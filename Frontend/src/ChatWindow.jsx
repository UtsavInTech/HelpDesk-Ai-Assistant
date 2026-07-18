import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect } from "react";
import { ScaleLoader } from "react-spinners";

function ChatWindow() {
    const {
        prompt,
        setPrompt,
        reply,
        setReply,
        currThreadId,
        setPrevChats,
        setNewChat,
        currentPersona,
        setCurrentPersona
    } = useContext(MyContext);

    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isPersonaOpen, setIsPersonaOpen] = useState(false);

    const getReply = async () => {
        setLoading(true);
        setNewChat(false);

        console.log("message ", prompt, " threadId ", currThreadId);

        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: prompt,
                threadId: currThreadId,
                persona: currentPersona
            })
        };

        try {
            const response = await fetch("http://localhost:8080/api/chat", options);
            const res = await response.json();
            console.log(res);
            setReply(res.reply);
        } catch (err) {
            console.log(err);
        }

        setLoading(false);
    };

    // Append new chat to prevChats
    useEffect(() => {
        if (prompt && reply) {
            setPrevChats(prevChats => ([
                ...prevChats,
                {
                    role: "user",
                    content: prompt
                },
                {
                    role: "assistant",
                    content: reply
                }
            ]));
        }

        setPrompt("");
    }, [reply]);

    const handleProfileClick = () => {
        setIsPersonaOpen(false);
        setIsOpen(!isOpen);
    };

    return (
        <div className="chatWindow">

            <div className="navbar">

                {/* Persona Selector */}
                <div className="personaContainer">

                    <span
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                            setIsOpen(false);
                            setIsPersonaOpen(!isPersonaOpen);
                        }}
                    >
                        HelpDesk ({currentPersona})
                        <i
                            className="fa-solid fa-chevron-down"
                            style={{ marginLeft: "6px" }}
                        ></i>
                    </span>

                    {
                        isPersonaOpen &&
                        <div className="personaDropDown">

                            <div
                                className="dropDownItem"
                                onClick={() => {
                                    setCurrentPersona("standard");
                                    setIsPersonaOpen(false);
                                }}
                            >
                                <i className="fa-solid fa-robot"></i> Standard
                            </div>

                            <div
                                className="dropDownItem"
                                onClick={() => {
                                    setCurrentPersona("funny");
                                    setIsPersonaOpen(false);
                                }}
                            >
                                <i className="fa-solid fa-face-laugh"></i> Funny
                            </div>

                            <div
                                className="dropDownItem"
                                onClick={() => {
                                    setCurrentPersona("pirate");
                                    setIsPersonaOpen(false);
                                }}
                            >
                                <i className="fa-solid fa-skull-crossbones"></i> Pirate
                            </div>

                            <div
                                className="dropDownItem"
                                onClick={() => {
                                    setCurrentPersona("guru");
                                    setIsPersonaOpen(false);
                                }}
                            >
                                <i className="fa-solid fa-brain"></i> Guru
                            </div>

                        </div>
                    }

                </div>

                {/* Profile */}
                <div className="userIconDiv" onClick={handleProfileClick}>
                    <span className="userIcon">
                        <i className="fa-solid fa-user"></i>
                    </span>
                </div>

            </div>

            {/* Profile Dropdown */}
            {
                isOpen &&
                <div className="dropDown">
                    <div className="dropDownItem">
                        <i className="fa-solid fa-gear"></i> Settings
                    </div>

                    <div className="dropDownItem">
                        <i className="fa-solid fa-cloud-arrow-up"></i> Upgrade plan
                    </div>

                    <div className="dropDownItem">
                        <i className="fa-solid fa-arrow-right-from-bracket"></i> Log out
                    </div>
                </div>
            }

            <Chat />

            <ScaleLoader color="#fff" loading={loading} />

            <div className="chatInput">
                <div className="inputBox">

                    <input
                        placeholder="Ask anything"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" ? getReply() : ""}
                    />

                    <div id="submit" onClick={getReply}>
                        <i className="fa-solid fa-paper-plane"></i>
                    </div>

                </div>

                <p className="info">
                    HelpDesk is Powered by ChatGPT API and it can make mistakes. Check important info.
                </p>
            </div>

        </div>
    );
}

export default ChatWindow;