import { ArrowRight } from "lucide-react";
import amaLogo from "../assets/logo.svg";
import { useNavigate } from "react-router-dom";
import { createRoom } from "../http/create-room";
import { toast } from "sonner";

export function CreateRoom() {
  const navigate = useNavigate();

  async function handleCreateRoom(data: FormData) {
    const theme = data.get("theme")?.toString();

    if (!theme) return;
    try {
      const { roomId } = await createRoom({ theme });

      navigate(`/room/${roomId}`);
    } catch {
      toast.error("Erro ao criar sala");
    }
  }

  return (
    <main className="h-screen flex items-center justify-center px-4">
      <div className="max-w-[450px] flex flex-col gap-6">
        <img src={amaLogo} alt="AMA" className="h-10" />

        <p className="leading-relaxed text-zinc-300 text-center">
          Crie uma sala pública de AMA (Ask me anything) e priorize as perguntas
          mais importantes para a comunidade.
        </p>

        <form
          action={handleCreateRoom}
          className="flex itens-center gap-2 bg-zinc-900 p-2 rounded-xl border border-zinc-800 focus-within:ring-1 ring-orange-400 ring-offset-zinc-900"
        >
          <input
            type="text"
            placeholder="Nome da sala"
            name="theme"
            autoComplete="off"
            className="flex-1 text-sm bg-transparent mx-2 outline-none text-zinc-100 placeholder:text-zinc-500"
          />

          <button
            type="submit"
            className="bg-orange-400 text-orange-950 px-3 py-1.5 gap-1.5 flex items-center rounded-lg font-medium text-sm hover:bg-orange-500 transition-colors"
          >
            Criar sala
            <ArrowRight className="size-4" />
          </button>
        </form>
      </div>
    </main>
  );
}
