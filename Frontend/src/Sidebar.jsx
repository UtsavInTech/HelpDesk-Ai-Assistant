import "./Sidebar.css";
import { useContext, useEffect, useState } from "react";
import { MyContext } from "./MyContext.jsx";
import { v1 as uuidv1 } from "uuid";
const API_URL = import.meta.env.VITE_API_URL;

function Sidebar() {
    const { allThreads, setAllThreads, currThreadId, setNewChat, setPrompt, setReply, setCurrThreadId, setPrevChats } = useContext(MyContext);
    const [isRecentOpen, setIsRecentOpen] = useState(true);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);

    const getAllThreads = async () => {
        try {
            const response = await fetch(`${API_URL}/api/thread`);
            const res = await response.json();
            const filteredData = res.map(thread => ({ threadId: thread.threadId, title: thread.title }));
            setAllThreads(filteredData);
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        getAllThreads();
    }, [currThreadId]);

    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
    };

    const changeThread = async (newThreadId) => {
        setCurrThreadId(newThreadId);
        try {
            const response = await fetch(`${API_URL}/api/thread/${newThreadId}`);
            const res = await response.json();
            setPrevChats(res);
            setNewChat(false);
            setReply(null);
        } catch (err) {
            console.log(err);
        }
    };

    const deleteThread = async (threadId) => {
        try {
            const response = await fetch(`${API_URL}/api/thread/${threadId}`, { method: "DELETE" });
            const res = await response.json();
            setAllThreads(prev => prev.filter(thread => thread.threadId !== threadId));
            if (threadId === currThreadId) {
                createNewChat();
            }
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <section className={`sidebar ${isSidebarVisible ? "visible" : "hidden"}`}>
            {/* --- FULL OPEN SIDEBAR VIEW --- */}
            <div className="sidebar-full-content">
                <div className="sidebar-top-header">
                    <div className="logo-container" onClick={createNewChat} style={{ cursor: "pointer" }}>
                        <img src="src/assets/blacklogo.png" alt="gpt logo" className="logo" />
                    </div>

                    <span className="powered-by-text">HelpDesk - An Ai Assistant</span>
                    
                    <div className="header-actions">
                        <button 
                            className="icon-btn close-sidebar-btn" 
                            title="Close sidebar"
                            onClick={() => setIsSidebarVisible(false)}
                        >
                            <i className="fa-solid fa-bars-staggered"></i>
                        </button>
                    </div>
                </div>

                {/* Main New Chat Button Element placed right before Recents */}
                <div className="sidebar-new-chat-row" onClick={createNewChat}>
                    <div className="new-chat-left">
                        <i className="fa-solid fa-plus plus-icon"></i>
                        <span>New chat</span>
                    </div>
                    <i className="fa-solid fa-pen-to-square pen-icon"></i>
                </div>

                <div 
                    className={`recent-toggle-btn ${isRecentOpen ? "active" : ""}`} 
                    onClick={() => setIsRecentOpen(!isRecentOpen)}
                >
                    <span>Recents</span>
                    <i className="fa-solid fa-chevron-right chevron-icon"></i>
                </div>

                <ul className={`history ${isRecentOpen ? "show" : "hide"}`}>
                    {
                        allThreads?.map((thread, idx) => (
                            <li key={idx} 
                                onClick={(e) => changeThread(thread.threadId)}
                                className={thread.threadId === currThreadId ? "highlighted" : " "}
                            >
                                {thread.title}
                                <i className="fa-solid fa-trash"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteThread(thread.threadId);
                                    }}
                                ></i>
                            </li>
                        ))
                    }
                </ul>

                <div className="sign">
                    <p>By UtsavInTech &hearts;</p>
                </div>
            </div>

            {/* --- COLLAPSED MINI-TOOLBAR TRACK VIEW --- */}
            <div className="sidebar-collapsed-content">
                <button className="icon-btn action-item tooltip-wrapper" onClick={() => setIsSidebarVisible(true)} data-tooltip="Open sidebar">
                    <i className="fa-solid fa-bars"></i>
                </button>
                <button className="icon-btn action-item tooltip-wrapper" onClick={createNewChat} data-tooltip="New Chat">
                    <i className="fa-solid fa-pen-to-square"></i>
                </button>
                <button className="icon-btn action-item tooltip-wrapper" data-tooltip="Search">
                    <i className="fa-solid fa-magnifying-glass"></i>
                </button>
                <button className="icon-btn action-item tooltip-wrapper" data-tooltip="Explore">
                    <i className="fa-solid fa-compass"></i>
                </button>
            </div>
        </section>
    );
}

export default Sidebar;
