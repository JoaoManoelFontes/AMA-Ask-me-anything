import { ArrowRight } from "lucide-react";
import { createMessage } from "../http/create-message";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

export function CreateMessageForm() {
  const { roomId } = useParams();

  if (!roomId) {
    throw new Error("Room ID is required");
  }

  async function handleCreateMessage(data: FormData) {
    const message = data.get("message")?.toString();
    if (!message || !roomId) {
      return;
    }

    try {
      await createMessage({ roomId, message });
    } catch {
      toast.error("Erro ao criar pergunta");
    }
  }

  return (
    <form
      className="flex w-full itens-center gap-2 bg-zinc-900 p-2 rounded-xl border border-zinc-800 focus-within:ring-1 ring-orange-400 ring-opacity-30 ring-offset-zinc-900"
      action={handleCreateMessage}
    >
      <input
        type="text"
        placeholder="Qual sua pergunta?"
        name="message"
        autoComplete="off"
        className="flex-1 text-sm bg-transparent mx-2 outline-none text-zinc-100 placeholder:text-zinc-500"
      />

      <button
        type="submit"
        className="bg-orange-400 text-orange-950 px-3 py-1.5 gap-1.5 flex items-center rounded-lg font-medium text-sm hover:bg-orange-500 transition-colors"
      >
        Criar pergunta
        <ArrowRight className="size-4" />
      </button>
    </form>
  );
}
