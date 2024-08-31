import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface params {
  roomId: string;
}

export function useMessagesWebsockets({ roomId }: params) {
  const queryClient = useQueryClient();

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
          queryClient.setQueryData<response>(["messages", roomId], (state) => {
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
          });

          break;

        case "message_answered":
          queryClient.setQueryData<response>(["messages", roomId], (state) => {
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
          });

          break;

        case "message_reaction_increased":
        case "message_reaction_decreased":
          queryClient.setQueryData<response>(["messages", roomId], (state) => {
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
          });

          break;
      }
    };

    return () => {
      ws.close();
      console.log("Disconnected");
    };
  }, [roomId, queryClient]);
}
