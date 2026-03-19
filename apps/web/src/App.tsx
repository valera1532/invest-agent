import { RouterProvider } from "@tanstack/react-router";
import { router } from "./app/router";

function App() {
  return (
    <div className="app-root">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
