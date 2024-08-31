interface Message {
  ID: string;
  Message: string;
  ReactionCount: number;
  Answered: boolean;
}

interface request {
  roomId: string;
}

export interface GetRoomMessagesResponse {
  messages: {
    id: string;
    text: string;
    amountOfReactions: number;
    answered: boolean;
  }[];
}

export async function getRoomMessages({
  roomId,
}: request): Promise<GetRoomMessagesResponse> {
  const response = await fetch(
    `${import.meta.env.VITE_APP_API_URL}/rooms/${roomId}/messages`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch messages");
  }

  const data: Message[] = await response.json();

  return {
    messages: data.map((message) => {
      return {
        id: message.ID,
        text: message.Message,
        amountOfReactions: message.ReactionCount,
        answered: message.Answered,
      };
    }),
  };
}
