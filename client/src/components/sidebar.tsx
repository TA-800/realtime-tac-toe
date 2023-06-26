import { Link } from "react-router-dom";

export default function Navbar() {
    return (
        <div className="bg-zinc-900 flex gap-4 p-2 rounded-md border-2 border-white/20">
            {/* Home icon */}
            <Link to="/">
                <svg width="42" height="42" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M10.55 2.533a2.25 2.25 0 0 1 2.9 0l6.75 5.695c.508.427.8 1.056.8 1.72v9.802a1.75 1.75 0 0 1-1.75 1.75h-3a1.75 1.75 0 0 1-1.75-1.75v-5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0-.75.75v5a1.75 1.75 0 0 1-1.75 1.75h-3A1.75 1.75 0 0 1 3 19.75V9.947c0-.663.292-1.292.8-1.72l6.75-5.694Z"
                        fill="#fff"
                    />
                </svg>
            </Link>
            {/* About icon */}
            <Link to="/about">
                <svg width="42" height="42" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M4 4.5A2.5 2.5 0 0 1 6.5 2H18a2.5 2.5 0 0 1 2.5 2.5v14.25a.75.75 0 0 1-.75.75H5.5a1 1 0 0 0 1 1h13.25a.75.75 0 0 1 0 1.5H6.5A2.5 2.5 0 0 1 4 19.5v-15ZM12.25 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-.75 1.75v5a.75.75 0 0 0 1.5 0v-5a.75.75 0 0 0-1.5 0Z"
                        fill="#fff"
                    />
                </svg>
            </Link>
        </div>
    );
}
