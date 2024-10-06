import { ArrowRight, X } from "lucide-react";
import { createAnswer } from "../http/create-answer";

interface ModalProps {
  closeModal: () => void;
  text: string;
  messageId: string;
  roomId?: string;
}

export function Modal({ closeModal, text, messageId, roomId }: ModalProps) {
  async function handleCreateAnswer(data: FormData) {
    const answer = data.get("answer")?.toString();

    if (!answer || !messageId || !roomId) {
      return;
    }

    try {
      await createAnswer({ roomId, messageId, answer });
      closeModal();
    } catch {
      console.error("Failed to create answer");
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-zinc-800 text-zinc-300 p-6 rounded-md shadow-md w-full max-w-md">
        <div className="flex justify-between">
          <h3 className="text-lg font-semibold">Responder à mensagem</h3>
          <button type="button" onClick={closeModal}>
            <X />
          </button>
        </div>
        <div className="py-4">
          <h4>
            Pergunta: <span className="text-sm text-zinc-300">{text}</span>
          </h4>
        </div>
        <form
          className="flex itens-center gap-2 bg-zinc-900 p-2 rounded-xl border border-zinc-800 focus-within:ring-1 ring-orange-400 ring-offset-zinc-900"
          action={handleCreateAnswer}
        >
          <input
            type="text"
            placeholder="Sua resposta"
            name="answer"
            autoComplete="off"
            className="flex-1 outline-none text-sm bg-transparent mx-2  text-zinc-100 placeholder:text-zinc-500"
          />
          <button
            type="submit"
            className="bg-orange-400 text-orange-950 px-3 py-1.5 gap-1.5 flex items-center rounded-lg font-medium text-sm hover:bg-orange-500 transition-colors"
          >
            Criar resposta
            <ArrowRight className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
