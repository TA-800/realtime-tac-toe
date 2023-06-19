import { Link } from "react-router-dom";

export default function Sidebar() {
    return (
        <div className="h-screen w-72 bg-zinc-900 flex flex-col gap-5 items-center p-4">
            {["Home", "About", "Contact"].map((item, index) => {
                return (
                    <Link
                        key={index}
                        to={`/${item === "Home" ? "" : item.toLowerCase()}`}
                        className="text-2xl text-zinc-100 hover:text-zinc-200">
                        {item}
                    </Link>
                );
            })}
        </div>
    );
}
