import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { getAnswers } from "../http/get-answers";
import { ArrowUp } from "lucide-react";

interface AnswerProps {
  text: string;
  amountOfReactions: number;
}

export function Answers({ text, amountOfReactions }: AnswerProps) {
  const { roomId, messageId } = useParams();
  if (!roomId) {
    throw new Error("Room ID is required");
  }

  if (!messageId) {
    throw new Error("Message ID is required");
  }

  const { data } = useSuspenseQuery({
    queryKey: ["answers", messageId, roomId],
    queryFn: () => getAnswers({ roomId, messageId }),
  });

  return (
    <div className="flex flex-col gap-6 py-10 px-4">
      <div className=" flex flex-col items-center p-4">
        <h1 className="text-center text-xl">{text}</h1>
        <span className="text-right py-2">{amountOfReactions} curtidas</span>
      </div>
      <hr className="py-4 my-4 w-full border-zinc-800" />
      <ol className="list-decimal list-outside px-3 space-y-8">
        {data?.answers.map((answer) => (
          <div key={answer.id}>
            <li className="leading-relaxed ml-4 text-zinc-100">
              {answer.text}
              <button
                type="button"
                className="mt-3 flex itens-center gap-2 leading-relaxed font-medium text-orange-400 hover:text-orange-500"
              >
                <ArrowUp className="size-4" />
                Curtir pergunta ({answer.amountOfReactions})
              </button>
            </li>
          </div>
        ))}
      </ol>
    </div>
  );
}
