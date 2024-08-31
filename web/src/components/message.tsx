import { ArrowUp } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { createMessageReaction } from "../http/create-message-reaction";
import { toast } from "sonner";
import { removeMessageReaction } from "../http/remove-message-reaction";

interface MessageProps {
  id: string;
  text: string;
  amountOfReactions: number;
  answered?: boolean;
}

export function Message({
  id: messageId,
  text,
  amountOfReactions,
  answered = false,
}: MessageProps) {
  const { roomId } = useParams();
  const [hasReacted, setHasReacted] = useState(false);

  async function handleReact() {
    setHasReacted(true);

    if (!roomId) {
      throw new Error("Room ID is required");
    }

    try {
      await createMessageReaction({ roomId, messageId });
    } catch {
      toast.error("Erro ao curtir a pergunta");
    }
  }

  async function handleRemoveReaction() {
    setHasReacted(false);

    if (!roomId) {
      throw new Error("Room ID is required");
    }

    try {
      await removeMessageReaction({ roomId, messageId });
    } catch {
      toast.error("Erro ao descurtir a pergunta");
    }
  }

  return (
    <li
      data-answered={answered}
      className="leading-relaxed ml-4 text-zinc-100 data-[answered=true]:opacity-50 data-[answered=true]:pointer-events-none"
    >
      {text}

      {hasReacted ? (
        <button
          type="button"
          onClick={handleRemoveReaction}
          className="mt-3 flex itens-center gap-2 text-sm font-medium text-orange-400 hover:text-orange-500"
        >
          <ArrowUp className="size-4" />
          Curtir pergunta ({amountOfReactions})
        </button>
      ) : (
        <button
          type="button"
          onClick={handleReact}
          className="mt-3 flex itens-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-300"
        >
          <ArrowUp className="size-4" />
          Curtir pergunta ({amountOfReactions})
        </button>
      )}
    </li>
  );
}
