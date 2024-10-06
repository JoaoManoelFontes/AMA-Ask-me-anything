import { ArrowUp } from "lucide-react";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createMessageReaction } from "../http/create-message-reaction";
import { toast } from "sonner";
import { removeMessageReaction } from "../http/remove-message-reaction";
import { Modal } from "./modal";

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
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

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
    <li className="leading-relaxed ml-4 text-zinc-100">
      {isModalOpen && (
        <Modal
          closeModal={closeModal}
          text={text}
          messageId={messageId}
          roomId={roomId}
        />
      )}
      {text}

      {hasReacted ? (
        <button
          type="button"
          onClick={handleRemoveReaction}
          className="mt-3 flex itens-center gap-2 leading-relaxed font-medium text-orange-400 hover:text-orange-500"
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
      <div className="p-4 flex justify-end">
        <ul>
          <li>
            <button
              onClick={openModal}
              type="button"
              className="mt-3 flex itens-center gap-2 text-sm font-medium text-orange-400 hover:text-orange-500"
            >
              Responder
            </button>
          </li>
          <li>
            <a
              href=""
              onClick={(event) => {
                if (answered) {
                  // Certifique-se de que `text` e `amountOfReactions` têm valores
                  navigate(`/room/${roomId}/answers/${messageId}`, {
                    state: { text, amountOfReactions },
                  });
                } else {
                  event.preventDefault();
                }
              }}
            >
              <span
                data-answered={answered}
                className="font-medium text-orange-400 hover:text-orange-500 data-[answered=false]:opacity-50 data-[answered=false]:text-zinc-500 data-[answered=false]:cursor-not-allowed"
              >
                Ver respostas
              </span>
            </a>
          </li>
        </ul>
      </div>
    </li>
  );
}
