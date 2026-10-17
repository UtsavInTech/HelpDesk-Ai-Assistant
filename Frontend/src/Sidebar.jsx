import "./Sidebar.css";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { MyContext } from "./MyContext.jsx";
import { v1 as uuidv1 } from "uuid";
import logo from "./assets/blacklogo.png";
import { apiFetch } from "./api.js";
import useSidebarWidth, { MIN_WIDTH, MAX_WIDTH } from "./useSidebarWidth.js";

function Sidebar() {
    const { allThreads, setAllThreads, currThreadId, setNewChat, setPrompt, setReply, setCurrThreadId, setPrevChats, setDocuments } = useContext(MyContext);
    const [isRecentOpen, setIsRecentOpen] = useState(true);
    //on a phone the sidebar overlays the chat, so it starts closed
    const [isSidebarVisible, setIsSidebarVisible] = useState(() => window.innerWidth > 768);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [search, setSearch] = useState("");
    const searchRef = useRef(null);
    const {width, dragging, startDrag, onKeyDown, resetWidth} = useSidebarWidth();

    const getAllThreads = async () => {
        try {
            const res = await apiFetch("/api/thread");
            const filteredData = res.map(thread => ({ threadId: thread.threadId, title: thread.title }));
            setAllThreads(filteredData);
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        getAllThreads();
    }, [currThreadId]);


    const visibleThreads = useMemo(() => {
        const query = search.trim().toLowerCase();
        if(!query) return allThreads;
        return allThreads.filter(thread => thread.title?.toLowerCase().includes(query));
    }, [allThreads, search]);

    const openSearch = () => {
        setIsSidebarVisible(true);
        setIsSearchOpen(true);
        setIsRecentOpen(true);
        //focus after the box has rendered, so you can just start typing
        //(also covers reopening the rail while search was already on)
        setTimeout(() => searchRef.current?.focus(), 0);
    };

    const closeSearch = () => {
        setIsSearchOpen(false);
        setSearch("");
    };

    const toggleSearch = () => {
        if(isSearchOpen) closeSearch();
        else openSearch();
    };

    const closeOnMobile = () => {
        if(window.innerWidth <= 768) setIsSidebarVisible(false);
    };

    const createNewChat = () => {
        closeOnMobile();
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
        setDocuments([]);
    };

    const changeThread = async (newThreadId) => {
        closeOnMobile();
        if(newThreadId === currThreadId) return;

        setCurrThreadId(newThreadId);
        setReply(null);

        try {
            const res = await apiFetch(`/api/thread/${newThreadId}`);
            setPrevChats(res.messages);
            setDocuments(res.documents ?? []);
            //a thread started by a PDF upload has no messages yet
            setNewChat(res.messages.length === 0);
        } catch (err) {
            console.log(err);
            setPrevChats([]);
            setDocuments([]);
        }
    };

    const deleteThread = async (threadId) => {
        try {
            await apiFetch(`/api/thread/${threadId}`, { method: "DELETE" });
            setAllThreads(prev => prev.filter(thread => thread.threadId !== threadId));

            if (threadId === currThreadId) {
                createNewChat();
            }
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <>
        {/* tap-anywhere backdrop, only ever visible on narrow screens */}
        {
            isSidebarVisible &&
            <div className="sidebar-backdrop" onClick={() => setIsSidebarVisible(false)} />
        }

        <section
            className={`sidebar ${isSidebarVisible ? "visible" : "hidden"} ${dragging ? "resizing" : ""}`}
            style={isSidebarVisible ? {width: `${width}px`} : undefined}
        >
            {/* --- FULL OPEN SIDEBAR VIEW --- */}
            <div className="sidebar-full-content">
                <div className="sidebar-top-header">
                    <div className="logo-container" onClick={createNewChat} title="New chat">
                        <img src={logo} alt="SigmaGPT logo" className="logo" />
                    </div>

                    <span className="powered-by-text">SigmaGPT</span>

                    <div className="header-actions">
                        <button
                            className="icon-btn"
                            title="Close sidebar"
                            onClick={() => setIsSidebarVisible(false)}
                        >
                            <i className="fa-solid fa-bars-staggered"></i>
                        </button>
                    </div>
                </div>

                {/* Primary actions */}
                <nav className="sidebar-actions">
                    <button className="sidebar-row" onClick={createNewChat}>
                        <i className="fa-solid fa-pen-to-square"></i>
                        <span>New chat</span>
                    </button>

                    <button
                        className={`sidebar-row ${isSearchOpen ? "active" : ""}`}
                        onClick={toggleSearch}
                    >
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <span>Search chats</span>
                    </button>
                </nav>

                {
                    isSearchOpen &&
                    <div className="search-box">
                        <i className="fa-solid fa-magnifying-glass search-box-icon"></i>
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Search chats"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Escape" && closeSearch()}
                        />
                        <button className="icon-btn search-clear" onClick={closeSearch} title="Close search">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                }

                <div className="sidebar-scroll">
                    <button
                        className={`recent-toggle-btn ${isRecentOpen ? "active" : ""}`}
                        onClick={() => setIsRecentOpen(!isRecentOpen)}
                    >
                        <span>{search.trim() ? "Results" : "Recents"}</span>
                        <i className="fa-solid fa-chevron-right chevron-icon"></i>
                    </button>

                    {
                        isRecentOpen &&
                        <ul className="history">
                            {
                                visibleThreads.map((thread) => (
                                    <li key={thread.threadId}
                                        onClick={() => changeThread(thread.threadId)}
                                        className={thread.threadId === currThreadId ? "highlighted" : ""}
                                        title={thread.title}
                                    >
                                        <span className="thread-title">{thread.title}</span>
                                        <i className="fa-solid fa-trash"
                                            title="Delete chat"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteThread(thread.threadId);
                                            }}
                                        ></i>
                                    </li>
                                ))
                            }

                            {
                                visibleThreads.length === 0 &&
                                <li className="history-empty">
                                    {search.trim() ? "No chats match your search" : "No chats yet"}
                                </li>
                            }
                        </ul>
                    }
                </div>

                <div className="sign">
                    <p>By ATUL &hearts;</p>
                </div>
            </div>

            {/* --- COLLAPSED MINI-TOOLBAR TRACK VIEW --- */}
            <div className="sidebar-collapsed-content">
                <button className="icon-btn action-item tooltip-wrapper" onClick={() => setIsSidebarVisible(true)} data-tooltip="Open sidebar">
                    <i className="fa-solid fa-bars"></i>
                </button>
                <button className="icon-btn action-item tooltip-wrapper" onClick={createNewChat} data-tooltip="New chat">
                    <i className="fa-solid fa-pen-to-square"></i>
                </button>
                <button className="icon-btn action-item tooltip-wrapper" onClick={openSearch} data-tooltip="Search chats">
                    <i className="fa-solid fa-magnifying-glass"></i>
                </button>
            </div>

            {/* drag the divider to resize; double click resets it */}
            {
                isSidebarVisible &&
                <div
                    className="sidebar-resizer"
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Resize sidebar"
                    aria-valuenow={width}
                    aria-valuemin={MIN_WIDTH}
                    aria-valuemax={MAX_WIDTH}
                    tabIndex={0}
                    onPointerDown={startDrag}
                    onDoubleClick={resetWidth}
                    onKeyDown={onKeyDown}
                    title="Drag to resize"
                />
            }
        </section>
        </>
    );
}

export default Sidebar;
