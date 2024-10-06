import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { CreateRoom } from "./pages/create-room";
import { Room } from "./pages/room";
import { Toaster } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/react-query";
import { MessageDetail } from "./pages/MessageDetail";

const Router = createBrowserRouter([
  {
    path: "/",
    element: <CreateRoom />,
  },
  {
    path: "/room/:roomId",
    element: <Room />,
  },
  {
    path: "/room/:roomId/answers/:messageId",
    element: <MessageDetail />,
  },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={Router} />;
      <Toaster invert richColors />
    </QueryClientProvider>
  );
}
