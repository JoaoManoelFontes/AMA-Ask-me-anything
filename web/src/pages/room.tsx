import { useParams } from "react-router-dom";
import AmaLogo from "../assets/logo.svg";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Messages } from "../components/messages";
import { CreateMessageForm } from "../components/create-message-form";
import { Suspense } from "react";

export function Room() {
  function handleShareRoom() {
    const url = window.location.href.toString();
    if (navigator.share !== undefined && navigator.canShare()) {
      navigator.share({
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast("Link copiado para sua area de transferecia");
    }
  }

  const { roomId } = useParams();

  return (
    <div className="mx-auto max-w-[640px] flex flex-col gap-6 py-10 px-4">
      <div className="flex items-center gap-3 px-3">
        <img src={AmaLogo} alt="AMA" className="h-5" />

        <span className="text-sm text-zinc-500 truncate">
          Código da sala: <span className="text-zinc-300">{roomId}</span>
        </span>

        <button
          onClick={handleShareRoom}
          type="submit"
          className="bg-zinc-800 text-zinc-300 px-3 py-1.5 gap-1.5 flex items-center rounded-lg font-medium text-sm hover:bg-zinc-600 transition-colors ml-auto"
        >
          Compartilhar
          <Share2 className="size-4" />
        </button>
      </div>
      <div className="w-full h-px bg-zinc-900"></div>

      <CreateMessageForm />
      <Suspense fallback={<div>Carregando...</div>}>
        <Messages />
      </Suspense>
    </div>
  );
}
