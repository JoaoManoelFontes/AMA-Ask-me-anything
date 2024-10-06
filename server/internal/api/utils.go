package api

import (
	"ama/internal/pgstore"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func sendResponse(w http.ResponseWriter, data any) {
	res, _ := json.Marshal(data)

	w.Header().Set("Content-Type", "application/json")
	w.Write(res)
}

func (h handler) readRoomParam(w http.ResponseWriter, r *http.Request) (room pgstore.Room, rawRoomId string, roomId uuid.UUID, ok bool) {

	rawRoomId = chi.URLParam(r, "room_id")
	roomId, err := uuid.Parse(rawRoomId)

	if err != nil {
		http.Error(w, "Invalid room id", http.StatusBadRequest)
		return pgstore.Room{}, "", uuid.Nil, false
	}

	room, err = h.q.GetRoom(r.Context(), roomId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "Room not found", http.StatusBadRequest)
			return pgstore.Room{}, "", uuid.Nil, false
		}

		slog.Error("Failed to get room", "Error", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return pgstore.Room{}, "", uuid.Nil, false
	}

	return room, rawRoomId, roomId, true
}

func (h handler) readMessageParam(w http.ResponseWriter, r *http.Request) (message pgstore.Message, rawMessageId string, messageId uuid.UUID, ok bool) {
	rawMessageId = chi.URLParam(r, "message_id")

	messageId, err := uuid.Parse(rawMessageId)
	if err != nil {
		http.Error(w, "Invalid message id", http.StatusBadRequest)
		return pgstore.Message{}, "", uuid.Nil, false
	}

	message, err = h.q.GetMessage(r.Context(), messageId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "Message not found", http.StatusBadRequest)
			return pgstore.Message{}, "", uuid.Nil, false
		}

		slog.Error("Failed to get message", "Error", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return pgstore.Message{}, "", uuid.Nil, false

	}

	return message, rawMessageId, messageId, true
}

func (h handler) readAnswerParam(w http.ResponseWriter, r *http.Request) (answer pgstore.Answer, rawAnswerId string, answerId uuid.UUID, ok bool) {
	rawAnswerId = chi.URLParam(r, "answer_id")

	answerId, err := uuid.Parse(rawAnswerId)

	if err != nil {
		http.Error(w, "Invalid answer id", http.StatusBadRequest)
		return pgstore.Answer{}, "", uuid.Nil, false
	}

	answer, err = h.q.GetAnswer(r.Context(), answerId)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "Answer not found", http.StatusBadRequest)
			return pgstore.Answer{}, "", uuid.Nil, false
		}
		http.Error(w, "Failed to get answer", http.StatusBadRequest)
		return pgstore.Answer{}, "", uuid.Nil, false
	}

	return answer, rawAnswerId, answerId, true
}
