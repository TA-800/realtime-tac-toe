import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "./routes/root_page";
import GamePage from "./routes/game_page";
import About from "./routes/about_page";

const router = createBrowserRouter([
    {
        path: "/",
        /* Root is layout -> contains sidebar and Outlet component (outlet will render the children defined in the routes) */
        element: <Root />,
        children: [
            {
                path: "/",
                element: <GamePage />,
            },
            {
                path: "/about",
                element: <About />,
            },
        ],
    },
]);

export default function App() {
    return <RouterProvider router={router} />;
}
