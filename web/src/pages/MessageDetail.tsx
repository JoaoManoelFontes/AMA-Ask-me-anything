import { Suspense } from "react";
import { Answers } from "../components/answers";
import { useLocation } from "react-router-dom";

export function MessageDetail() {
  const location = useLocation();
  const { text, amountOfReactions } = location.state || {};
  console.log({ text, amountOfReactions });
  return (
    <div className="flex flex-col gap-6 py-10 px-4">
      <Suspense fallback={<div>Carregando...</div>}>
        <Answers text={text} amountOfReactions={amountOfReactions} />
      </Suspense>
    </div>
  );
}
