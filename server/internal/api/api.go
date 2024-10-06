package api

import (
	"ama/internal/pgstore"
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"sync"

	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"github.com/go-chi/cors"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v5"
)

type handler struct {
	q    *pgstore.Queries
	r    *chi.Mux
	upg  websocket.Upgrader
	subs map[string]map[*websocket.Conn]context.CancelFunc
	mu   *sync.Mutex
}

func (h handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	h.r.ServeHTTP(w, r)
}

func NewHandler(q *pgstore.Queries) http.Handler {
	a := handler{
		q:    q,
		upg:  websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }},
		subs: make(map[string]map[*websocket.Conn]context.CancelFunc),
		mu:   &sync.Mutex{},
	}

	r := chi.NewRouter()
	r.Use(middleware.RequestID, middleware.Recoverer, middleware.Logger)

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://*", "http://*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Get("/subscribe/{room_id}", a.handlerSubscribeToRoom)

	r.Route("/api", func(r chi.Router) {
		r.Route("/rooms", func(r chi.Router) {
			r.Post("/", a.handlerCreateRoom)
			r.Get("/", a.handlerGetRooms)

			r.Route("/{room_id}", func(r chi.Router) {
				r.Route("/messages", func(r chi.Router) {
					r.Post("/", a.handlerCreateRoomMessages)
					r.Get("/", a.handlerGetRoomMessages)

					r.Route("/{message_id}", func(r chi.Router) {
						r.Get("/", a.handlerGetRoomMessages)
						r.Patch("/react", a.handlerReactToRoomMessage)
						r.Delete("/react", a.handlerRemoveReatcionToRoomMessage)

						r.Route("/answer", func(r chi.Router) {
							r.Get("/", a.handlerGetMessageAnswers)
							r.Post("/", a.handlerAnswerRoomMessage)
							r.Patch("/{answer_id}/react", a.handlerReactToAnswer)
							r.Delete("/{answer_id}/react", a.handlerRemoveReactionToAnswer)
						})
					})
				})
			})
		})
	})

	a.r = r
	return a
}

type MessageReaction struct {
	MessageId string `json:"messageId"`
	Count     int64  `json:"count"`
}

// Socket functions
func (h handler) handlerSubscribeToRoom(w http.ResponseWriter, r *http.Request) {
	rawRoomId := chi.URLParam(r, "room_id")
	roomId, err := uuid.Parse(rawRoomId)

	if err != nil {
		http.Error(w, "Invalid room id", http.StatusBadRequest)
		return
	}

	_, err = h.q.GetRoom(r.Context(), roomId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "Room not found", http.StatusBadRequest)
			return
		}
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	conn, err := h.upg.Upgrade(w, r, nil)
	if err != nil {
		slog.Warn("Failed to upgrade connection", "Error", err)
		http.Error(w, "Failed to upgrade socket connection", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithCancel(r.Context())

	// Subscribe to room
	h.mu.Lock()
	if _, ok := h.subs[rawRoomId]; !ok {
		h.subs[rawRoomId] = make(map[*websocket.Conn]context.CancelFunc)
	}
	h.subs[rawRoomId][conn] = cancel
	slog.Info("Subscribed to room", "Room", rawRoomId)
	h.mu.Unlock()

	<-ctx.Done()
	// Unsubscribe
	h.mu.Lock()
	delete(h.subs[rawRoomId], conn)
	h.mu.Unlock()
}

const (
	MessageKindMessageCreated                 = "message_created"
	MessageKindMessageRactionIncreased        = "message_reaction_increased"
	MessageKindMessageRactionDecreased        = "message_reaction_decreased"
	MessageKindMessageAnswered                = "message_answered"
	MessageKindMessageAnswerReactionIncreased = "message_answer_reaction_increased"
	MessageKindMessageAnswerReactionDecreased = "message_answer_reaction_decreased"
)

type MessageMessageReactionIncreased struct {
	ID    string `json:"id"`
	Count int64  `json:"count"`
}

type MessageMessageReactionDecreased struct {
	ID    string `json:"id"`
	Count int64  `json:"count"`
}

type MessageMessageAnswered struct {
	ID     string `json:"id"`
	Answer string `json:"answer"`
}

type MessageMessageCreated struct {
	ID      string `json:"id"`
	Message string `json:"message"`
}

type Message struct {
	Kind   string `json:"kind"`
	Value  any    `json:"value"`
	RoomId string `json:"-"`
}

type Answer struct {
	ID        string `json:"id"`
	Value     any    `json:"value"`
	RoomId    string `json:"-"`
	MessageId string `json:"-"`
}

type Notification struct {
	Payload interface{}
}

func (h handler) notifySubscribers(msg Message) {
	slog.Info("Notifying subscribers", "Message", msg)
	h.mu.Lock()
	subs, ok := h.subs[msg.RoomId]
	if !ok || len(subs) == 0 {
		return
	}
	for conn, cancel := range subs {
		if err := conn.WriteJSON(msg); err != nil {
			slog.Error("Failed to write message", "Error", err)
			cancel()
		}
	}
	defer h.mu.Unlock()
}

// Api functions
func (h handler) handlerCreateRoom(w http.ResponseWriter, r *http.Request) {
	type _body struct {
		Theme string `json:"theme"`
	}

	type response struct {
		ID string `json:"id"`
	}

	var body _body
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	roomId, err := h.q.InsertRoom(r.Context(), body.Theme)
	if err != nil {
		slog.Error("Failed to create room", "Error", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	sendResponse(w, response{ID: roomId.String()})

}
func (h handler) handlerGetRooms(w http.ResponseWriter, r *http.Request) {
	type response struct {
		Rooms []pgstore.Room `json:"rooms"`
	}

	rooms, err := h.q.GetRooms(r.Context())
	if err != nil {
		slog.Error("Failed to get rooms", "Error", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	sendResponse(w, response{Rooms: rooms})
}
func (h handler) handlerGetRoomMessages(w http.ResponseWriter, r *http.Request) {
	_, _, roomId, ok := h.readRoomParam(w, r)

	if !ok {
		return
	}

	messages, err := h.q.GetRoomMessages(r.Context(), roomId)

	if err != nil {
		slog.Error("Failed to get room messages", "Error", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if messages == nil {
		messages = []pgstore.Message{}
	}

	sendResponse(w, messages)
}
func (h handler) handlerCreateRoomMessages(w http.ResponseWriter, r *http.Request) {
	type _body struct {
		Message string `json:"message"`
	}
	type response struct {
		ID string `json:"id"`
	}

	_, _, roomId, ok := h.readRoomParam(w, r)

	if !ok {
		return
	}

	var body _body

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	messageId, err := h.q.InsertMessage(r.Context(), pgstore.InsertMessageParams{RoomID: roomId, Message: body.Message})

	if err != nil {
		slog.Error("Failed to insert message", "Error", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	sendResponse(w, response{ID: messageId.String()})

	go h.notifySubscribers(Message{
		Kind:   MessageKindMessageCreated,
		RoomId: roomId.String(),
		Value: MessageMessageCreated{
			ID:      messageId.String(),
			Message: body.Message,
		},
	})
}
func (h handler) handlerReactToRoomMessage(w http.ResponseWriter, r *http.Request) {

	type response struct {
		Count int64 `json:"count"`
	}

	_, _, roomId, roomParamOk := h.readRoomParam(w, r)

	if !roomParamOk {
		return
	}

	_, _, messageId, messageParamOk := h.readMessageParam(w, r)

	if !messageParamOk {
		return
	}

	count, err := h.q.ReactToMessage(r.Context(), messageId)

	if err != nil {
		slog.Error("Failed to react to message", "Error", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	sendResponse(w, response{Count: count})

	go h.notifySubscribers(Message{
		Kind:   MessageKindMessageRactionIncreased,
		RoomId: roomId.String(),
		Value: MessageMessageReactionIncreased{
			ID:    messageId.String(),
			Count: count,
		},
	})
}
func (h handler) handlerRemoveReatcionToRoomMessage(w http.ResponseWriter, r *http.Request) {

	type response struct {
		Count int64 `json:"count"`
	}

	_, _, roomId, roomParamOk := h.readRoomParam(w, r)

	if !roomParamOk {
		return
	}

	_, _, messageId, messageParamOk := h.readMessageParam(w, r)

	if !messageParamOk {
		return
	}

	count, err := h.q.RemoveReactionFromMessage(r.Context(), messageId)

	if err != nil {
		slog.Error("Failed to remove reaction to message", "Error", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	sendResponse(w, response{Count: count})

	go h.notifySubscribers(Message{
		Kind:   MessageKindMessageRactionDecreased,
		RoomId: roomId.String(),
		Value: MessageMessageReactionDecreased{
			ID:    messageId.String(),
			Count: count,
		},
	})
}
func (h handler) handlerAnswerRoomMessage(w http.ResponseWriter, r *http.Request) {

	type _body struct {
		Answer string `json:"answer"`
	}

	type response struct {
		ID string `json:"id"`
	}

	_, _, roomId, roomParamOk := h.readRoomParam(w, r)

	if !roomParamOk {
		return
	}

	_, _, messageId, messageParamOk := h.readMessageParam(w, r)

	if !messageParamOk {
		return
	}

	var body _body

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := h.q.MarkMessageAsAnswered(r.Context(), messageId)

	if err != nil {
		slog.Error("Failed to answer message", "Error", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	answerId, err := h.q.InsertAnswer(r.Context(), pgstore.InsertAnswerParams{
		MessageID: messageId,
		Answer:    body.Answer,
	})

	if err != nil {
		slog.Error("Failed to insert answer", "Error", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	sendResponse(w, response{ID: answerId.String()})

	go h.notifySubscribers(Message{
		Kind:   MessageKindMessageAnswered,
		RoomId: roomId.String(),
		Value: MessageMessageAnswered{
			ID:     messageId.String(),
			Answer: body.Answer,
		},
	})
}

func (h handler) handlerGetMessageAnswers(w http.ResponseWriter, r *http.Request) {
	_, _, _, roomParamOk := h.readRoomParam(w, r)

	if !roomParamOk {
		return
	}

	_, _, messageId, messageParamOk := h.readMessageParam(w, r)

	if !messageParamOk {
		return
	}

	answers, err := h.q.GetAnswers(r.Context(), messageId)

	if err != nil {
		slog.Error("Failed to get answers", "Error", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	sendResponse(w, answers)
}

func (h handler) handlerReactToAnswer(w http.ResponseWriter, r *http.Request) {
	type response struct {
		Count int64 `json:"count"`
	}

	_, _, roomId, roomParamOk := h.readRoomParam(w, r)

	if !roomParamOk {
		return
	}

	_, _, messageId, messageParamOk := h.readMessageParam(w, r)

	if !messageParamOk {
		return
	}

	_, _, answerId, answerParamOk := h.readAnswerParam(w, r)

	if !answerParamOk {
		return
	}

	count, err := h.q.ReactToAnswer(r.Context(), pgstore.ReactToAnswerParams{
		ID:        answerId,
		MessageID: messageId,
	})

	if err != nil {
		slog.Error("Failed to react to answer", "Error", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	sendResponse(w, response{Count: count})

	go h.notifySubscribers(Message{
		Kind:   MessageKindMessageAnswerReactionIncreased,
		RoomId: roomId.String(),
		Value: MessageMessageReactionIncreased{
			ID:    messageId.String(),
			Count: count,
		},
	})
}

func (h handler) handlerRemoveReactionToAnswer(w http.ResponseWriter, r *http.Request) {
	type response struct {
		Count int64 `json:"count"`
	}

	_, _, roomId, roomParamOk := h.readRoomParam(w, r)

	if !roomParamOk {
		return
	}

	_, _, messageId, messageParamOk := h.readMessageParam(w, r)

	if !messageParamOk {
		return
	}

	_, _, answerId, answerParamOk := h.readAnswerParam(w, r)

	if !answerParamOk {
		return
	}

	count, err := h.q.RemoveReactionFromAnswer(r.Context(), pgstore.RemoveReactionFromAnswerParams{
		ID:        answerId,
		MessageID: messageId,
	})

	if err != nil {
		slog.Error("Failed to remove reaction to answer", "Error", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	sendResponse(w, response{Count: count})

	go h.notifySubscribers(Message{
		Kind:   MessageKindMessageAnswerReactionDecreased,
		RoomId: roomId.String(),
		Value: MessageMessageReactionDecreased{
			ID:    messageId.String(),
			Count: count,
		},
	})
}
