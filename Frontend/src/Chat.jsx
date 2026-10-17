import "./Chat.css";
import { useContext, useState, useEffect, useRef } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

function Chat() {
    const {newChat, prevChats, reply} = useContext(MyContext);
    const [latestReply, setLatestReply] = useState(null);
    const bottomRef = useRef(null);

    const lastIdx = prevChats.length - 1;

    //type out only the reply that just arrived - loaded history renders instantly
    useEffect(() => {
        const last = prevChats[lastIdx];

        if(reply === null || !last || last.role !== "assistant" || last.content !== reply) {
            setLatestReply(null);
            return;
        }

        const words = reply.split(" "); //individual words
        let idx = 0;
        setLatestReply(words[0] ?? "");

        const interval = setInterval(() => {
            idx++;
            setLatestReply(words.slice(0, idx + 1).join(" "));
            if(idx >= words.length - 1) clearInterval(interval);
        }, 40);

        return () => clearInterval(interval);
    }, [reply, prevChats, lastIdx]);

    //keep the newest message in view
    useEffect(() => {
        bottomRef.current?.scrollIntoView({behavior: "smooth"});
    }, [prevChats.length, latestReply]);

    if(newChat) {
        return (
            <div className="greeting">
                <h1>What&apos;s on your mind today?</h1>
            </div>
        );
    }

    return (
        <>
            <div className="chats">
                {
                    prevChats?.map((chat, idx) => {
                        const isTyping = idx === lastIdx && chat.role === "assistant" && latestReply !== null;

                        return (
                            <div className={chat.role === "user" ? "userDiv" : "gptDiv"} key={idx}>
                                {
                                    chat.role === "user"
                                        ? <p className="userMessage">{chat.content}</p>
                                        : <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                                              {isTyping ? latestReply : chat.content}
                                          </ReactMarkdown>
                                }
                            </div>
                        );
                    })
                }
                <div ref={bottomRef}></div>
            </div>
        </>
    )
}

export default Chat;
