// Main layout
import { Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar";

export default function Root() {
    return (
        // Main layout container
        <div className="flex flex-col gap-2 p-4 min-h-screen">
            {/* Sidebar */}
            <Sidebar />
            {/* Main content */}
            <div className="w-full h-full rounded-md border-2 border-white/20 bg-zinc-900 p-4">
                <Outlet />
            </div>
        </div>
    );
}
