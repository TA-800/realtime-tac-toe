import Button from "./button";
import useSocket from "./useSocketHook";
import { useState, useEffect, useRef } from "react";

type MessageType = {
    content: string;
    author: string;
};

export default function TextChat() {
    const { socket } = useSocket();
    const [messages, setMessages] = useState<MessageType[]>([]);
    const msgsContainerRef = useRef<HTMLDivElement>(null);

    const handleMessageSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const target = e.target as typeof e.target & {
            message: { value: string };
        };

        socket.emit("send message", target.message.value);
        // Clear input
        target.message.value = "";
    };

    const handleMessage = (newMsg: { content: string; username: string }) => {
        setMessages((prev) => [...prev, { content: newMsg.content, author: newMsg.username }]);
    };

    useEffect(() => {
        socket.on("receive msg", handleMessage);
        return () => {
            socket.off("receive msg", handleMessage);
        };
    }, []);

    // Scroll to bottom after every msgs state update
    useEffect(() => {
        if (!messages) return;

        // Scroll msgsContainerRef to the bottom after every message (but don't scroll the page)
        msgsContainerRef.current?.scrollTo({ top: msgsContainerRef.current?.scrollHeight, behavior: "smooth" });
    }, [messages]);

    return (
        <div className="h-72 w-full flex flex-col gap-2 bg-zinc-900">
            {/* Text container with scrollbar */}
            <div
                ref={msgsContainerRef}
                className="w-full h-full bg-black overflow-y-scroll flex flex-col gap-2 p-2 rounded border-2 border-white/20">
                {messages.map((msg, i) => {
                    return (
                        <div key={i} className="p-4 rounded bg-gray-800 border-2 border-white/5">
                            <p className="text-xs opacity-50">{msg.author}</p>
                            <p className="max-w-xs">{msg.content}</p>
                        </div>
                    );
                })}
                <div style={{ float: "left", clear: "both" }} />
            </div>
            {/* Input + Send button */}
            <form onSubmit={handleMessageSubmit} className="w-full flex flex-row gap-2">
                <input
                    required
                    autoComplete="off"
                    id="message"
                    name="message"
                    className="w-full p-2 bg-black rounded border-2 border-white/20"
                    placeholder="Enter message"></input>
                <Button type="submit">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                    </svg>
                    <span>Send</span>
                </Button>
            </form>
        </div>
    );
}
