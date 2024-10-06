interface request {
  roomId: string;
  messageId: string;
  answer: string;
}

export async function createAnswer({ roomId, messageId, answer }: request) {
  const response = await fetch(
    `${
      import.meta.env.VITE_APP_API_URL
    }/rooms/${roomId}/messages/${messageId}/answer`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ answer }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create answer");
  }

  const data: { id: string } = await response.json();

  return {
    answerId: data.id,
  };
}
