import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "./routes/root_page";
import HomePage from "./routes/home_page";

const router = createBrowserRouter([
    {
        path: "/",
        /* Root is layout -> contains sidebar and Outlet component (outlet will render the children defined in the routes) */
        element: <Root />,
        children: [
            {
                path: "/",
                element: <HomePage />,
            },
            {
                path: "/about",
                element: <div>Hello About!</div>,
            },
            {
                path: "/contact",
                element: <div>Hello Contact!</div>,
            },
        ],
    },
]);

export default function App() {
    return <RouterProvider router={router} />;
}
