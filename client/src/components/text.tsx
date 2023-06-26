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
            <div ref={msgsContainerRef} className="w-full h-full bg-black overflow-y-scroll flex flex-col gap-2">
                {messages.map((msg, i) => {
                    return (
                        <div key={i} className="p-4 rounded bg-gray-800">
                            <p className="text-xs opacity-50">{msg.author}</p>
                            <p>{msg.content}</p>
                        </div>
                    );
                })}
                <div style={{ float: "left", clear: "both" }} />
            </div>
            {/* Input + Send button */}
            <form onSubmit={handleMessageSubmit} className="w-full flex flex-row gap-2">
                <input
                    autoComplete="off"
                    id="message"
                    name="message"
                    className="w-full p-2 bg-black rounded-md"
                    placeholder="Enter message"></input>
                <button className="btn">Send</button>
            </form>
        </div>
    );
}
