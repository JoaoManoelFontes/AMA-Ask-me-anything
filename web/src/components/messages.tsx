import { useParams } from "react-router-dom";
import { Message } from "./message";
import {
  getRoomMessages,
  GetRoomMessagesResponse,
} from "../http/get-room-messages";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export function Messages() {
  const { roomId } = useParams();
  const queryClient = useQueryClient();

  if (!roomId) {
    throw new Error("Room ID is required");
  }

  const { data } = useSuspenseQuery({
    queryKey: ["messages", roomId],
    queryFn: () => getRoomMessages({ roomId }),
  });

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8080/subscribe/${roomId}`);

    ws.onopen = () => {
      console.log("Connected");
    };

    ws.onmessage = (event) => {
      const data: {
        kind:
          | "message_created"
          | "message_answered"
          | "message_reaction_increased"
          | "message_reaction_decreased";
        value: any;
      } = JSON.parse(event.data);

      console.log(data);

      switch (data.kind) {
        case "message_created":
          queryClient.setQueryData<GetRoomMessagesResponse>(
            ["messages", roomId],
            (state) => {
              return {
                messages: [
                  ...(state?.messages || []),
                  {
                    id: data.value.id,
                    text: data.value.message,
                    amountOfReactions: 0,
                    answered: false,
                  },
                ],
              };
            }
          );

          break;

        case "message_answered":
          queryClient.setQueryData<GetRoomMessagesResponse>(
            ["messages", roomId],
            (state) => {
              if (!state) {
                return undefined;
              }
              return {
                messages: state.messages.map((message) => {
                  if (message.id === data.value.id) {
                    return {
                      ...message,
                      answered: true,
                    };
                  }
                  return message;
                }),
              };
            }
          );

          break;

        case "message_reaction_increased":
        case "message_reaction_decreased":
          queryClient.setQueryData<GetRoomMessagesResponse>(
            ["messages", roomId],
            (state) => {
              if (!state) {
                return undefined;
              }
              return {
                messages: state.messages.map((message) => {
                  if (message.id === data.value.id) {
                    return {
                      ...message,
                      amountOfReactions: data.value.count,
                    };
                  }
                  return message;
                }),
              };
            }
          );

          break;
      }
    };

    return () => {
      ws.close();
      console.log("Disconnected");
    };
  }, [roomId, queryClient]);

  return (
    <ol className="list-decimal list-outside px-3 space-y-8">
      {data?.messages.map((message) => (
        <Message
          key={message.id}
          id={message.id}
          text={message.text}
          amountOfReactions={message.amountOfReactions}
          answered={message.answered}
        />
      ))}
    </ol>
  );
}
