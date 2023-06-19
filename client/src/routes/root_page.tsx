// Main layout

import { Outlet } from "react-router-dom";
import Sidebar from "./sidebar";

export default function Root() {
    return (
        // Main layout container
        <div className="flex flex-row gap-2 p-4">
            {/* Sidebar */}
            <Sidebar />
            {/* Main content */}
            <div className="w-full rounded-md bg-zinc-900 p-4">
                <Outlet />
            </div>
        </div>
    );
}
