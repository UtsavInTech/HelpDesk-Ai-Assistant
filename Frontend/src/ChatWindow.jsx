import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import Settings from "./Settings.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useEffect, useRef, useState } from "react";
import { ScaleLoader } from "react-spinners";
import { apiFetch } from "./api.js";

function ChatWindow() {
    const {
        prompt,
        setPrompt,
        setReply,
        currThreadId,
        setPrevChats,
        setNewChat,
        setAllThreads,
        documents,
        setDocuments,
        user,
        logout
    } = useContext(MyContext);

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [error, setError] = useState("");
    const menuRef = useRef(null);
    const fileRef = useRef(null);

    //close the account menu on an outside click or Escape
    useEffect(() => {
        if(!isOpen) return;

        const onPointerDown = (e) => {
            if(!menuRef.current?.contains(e.target)) setIsOpen(false);
        };
        const onKeyDown = (e) => {
            if(e.key === "Escape") setIsOpen(false);
        };

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [isOpen]);

    const refreshThreads = async () => {
        try {
            const res = await apiFetch("/api/thread");
            setAllThreads(res.map(thread => ({threadId: thread.threadId, title: thread.title})));
        } catch (err) {
            console.log(err);
        }
    };

    const uploadPdf = async (file) => {
        if(!file) return;

        setError("");
        setUploading(true);

        try {
            const form = new FormData();
            form.append("file", file);

            const res = await apiFetch(`/api/thread/${currThreadId}/document`, {
                method: "POST",
                body: form
            });

            setDocuments(res.documents);
            refreshThreads();
        } catch (err) {
            setError(err.message);
        }

        setUploading(false);
    };

    const removeDocument = async (documentId) => {
        try {
            const res = await apiFetch(`/api/thread/${currThreadId}/document/${documentId}`, {
                method: "DELETE"
            });
            setDocuments(res.documents);
        } catch (err) {
            setError(err.message);
        }
    };

    const getReply = async () => {
        const message = prompt.trim();
        if(!message || loading) return;

        setError("");
        setLoading(true);
        setNewChat(false);
        setReply(null);
        setPrompt("");

        //show the question straight away, the way ChatGPT does
        setPrevChats(chats => [...chats, {role: "user", content: message}]);

        try {
            const res = await apiFetch("/api/chat", {
                method: "POST",
                body: {
                    message,
                    threadId: currThreadId
                }
            });

            setPrevChats(chats => [...chats, {role: "assistant", content: res.reply}]);
            setReply(res.reply);

            //a brand new thread may have just been created, so refresh the sidebar
            refreshThreads();
        } catch (err) {
            console.log(err);
            setError(err.message);
            //drop the question again so the user can retry without a dangling message
            setPrevChats(chats => chats.slice(0, -1));
            setPrompt(message);
        }

        setLoading(false);
    };

    return (
        <div className="chatWindow">

            <div className="navbar">
                <span className="brand">SigmaGPT</span>

                {/* Profile */}
                <div className="userIconDiv" ref={menuRef}>
                    <button
                        className="userIcon"
                        onClick={() => setIsOpen(!isOpen)}
                        title={user?.email}
                        aria-label="Account menu"
                        aria-expanded={isOpen}
                    >
                        {(user?.name || user?.email || "?").charAt(0).toUpperCase()}
                    </button>

                    {/* Profile Dropdown */}
                    {
                        isOpen &&
                        <div className="dropDown">
                            <div className="dropDownItem accountItem">
                                <i className="fa-solid fa-circle-user"></i>
                                <span className="accountEmail">{user?.email}</span>
                            </div>

                            <button
                                className="dropDownItem"
                                onClick={() => {
                                    setIsOpen(false);
                                    setShowSettings(true);
                                }}
                            >
                                <i className="fa-solid fa-gear"></i>
                                <span>Settings</span>
                            </button>

                            <button className="dropDownItem" onClick={logout}>
                                <i className="fa-solid fa-arrow-right-from-bracket"></i>
                                <span>Log out</span>
                            </button>
                        </div>
                    }
                </div>
            </div>

            {/* Attached PDFs stay with the whole chat, so follow-up questions still see them */}
            {
                (documents.length > 0 || uploading) &&
                <div className="attachmentBar">
                    <span className="attachmentBarLabel">
                        <i className="fa-solid fa-paperclip"></i>
                        Attached to this chat
                    </span>

                    {
                        documents.map(doc => (
                            <span className="attachment" key={doc.id} title={`${doc.name} - ${doc.pages} page(s)`}>
                                <i className="fa-solid fa-file-pdf"></i>
                                <span className="attachmentName">{doc.name}</span>
                                <button
                                    className="attachmentRemove"
                                    onClick={() => removeDocument(doc.id)}
                                    title={`Remove ${doc.name}`}
                                    aria-label={`Remove ${doc.name}`}
                                >
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </span>
                        ))
                    }

                    {uploading && <span className="attachment pending"><i className="fa-solid fa-spinner fa-spin"></i> Reading PDF...</span>}
                </div>
            }

            <Chat />

            <div className="composerArea">
                {loading && <div className="chatLoader"><ScaleLoader color="var(--sg-text-secondary)" height={16} width={3} /></div>}

                {error && <p className="chatError"><i className="fa-solid fa-triangle-exclamation"></i> {error}</p>}

                <div className="chatInput">
                    <div className="inputBox">

                        <input
                            type="file"
                            accept="application/pdf,.pdf"
                            ref={fileRef}
                            style={{display: "none"}}
                            onChange={(e) => {
                                uploadPdf(e.target.files?.[0]);
                                //reset so picking the same file twice still fires
                                e.target.value = "";
                            }}
                        />

                        <button
                            className="attachBtn"
                            onClick={() => fileRef.current?.click()}
                            disabled={uploading}
                            title="Attach a PDF"
                            aria-label="Attach a PDF"
                        >
                            <i className="fa-solid fa-paperclip"></i>
                        </button>

                        <input
                            className="promptInput"
                            placeholder={documents.length ? "Ask about your PDF" : "Ask anything"}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && getReply()}
                        />

                        <button id="submit" onClick={getReply} disabled={!prompt.trim() || loading} title="Send">
                            <i className="fa-solid fa-arrow-up"></i>
                        </button>

                    </div>

                    <p className="info">
                        SigmaGPT can make mistakes. Check important info.
                    </p>
                </div>
            </div>

            {showSettings && <Settings onClose={() => setShowSettings(false)} />}

        </div>
    );
}

export default ChatWindow;
