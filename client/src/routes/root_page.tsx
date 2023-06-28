// Main layout
import { Outlet } from "react-router-dom";
import Navbar from "../components/sidebar";
import { SocketProvider } from "../context/socket";

export default function Root() {
    return (
        // Main layout container
        <div className="flex flex-col items-center gap-2 p-4">
            {/* Sidebar */}
            <Navbar />
            {/* Main content */}
            <SocketProvider>
                <div className="rounded-md border-2 border-white/20 bg-zinc-900 sm:p-8 px-2 py-4 sm:w-auto w-full">
                    <Outlet />
                </div>
            </SocketProvider>
        </div>
    );
}
