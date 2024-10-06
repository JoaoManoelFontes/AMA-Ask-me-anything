interface request {
  roomId: string;
  messageId: string;
}

interface Answer {
  ID: string;
  MessageId: string;
  Answer: string;
  ReactionCount: number;
}

interface getAnswersResponse {
  answers: {
    id: string;
    text: string;
    amountOfReactions: number;
  }[];
}

export async function getAnswers({
  roomId,
  messageId,
}: request): Promise<getAnswersResponse> {
  const response = await fetch(
    `${
      import.meta.env.VITE_APP_API_URL
    }/rooms/${roomId}/messages/${messageId}/answer`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch messages");
  }

  const data: Answer[] = await response.json();

  return {
    answers: data.map((answer) => {
      return {
        id: answer.ID,
        text: answer.Answer,
        amountOfReactions: answer.ReactionCount,
      };
    }),
  };
}
