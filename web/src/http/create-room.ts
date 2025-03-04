interface request {
  theme: string;
}

export async function createRoom({ theme }: request) {
  const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ theme }),
  });

  const data: { id: string } = await response.json();

  return {
    roomId: data.id,
  };
}
