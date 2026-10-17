import './App.css';
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import Auth from "./Auth.jsx";
import {MyContext} from "./MyContext.jsx";
import { useState, useEffect, useCallback } from 'react';
import {v1 as uuidv1} from "uuid";
import { apiFetch, getToken, setToken, clearToken } from "./api.js";
import useTheme from "./useTheme.js";

function App() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(uuidv1());
  const [prevChats, setPrevChats] = useState([]); //stores all chats of curr threads
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);

  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [documents, setDocuments] = useState([]); //PDFs attached to the current thread

  //theme lives outside auth so the login screen is themed too
  const {theme, setTheme} = useTheme();

  //restore the session from the saved token on a page refresh
  useEffect(() => {
    const restore = async () => {
      if(!getToken()) {
        setAuthChecked(true);
        return;
      }

      try {
        const data = await apiFetch("/api/auth/me");
        setUser(data.user);
      } catch {
        clearToken();
      }

      setAuthChecked(true);
    };

    restore();
  }, []);

  const startFreshSession = useCallback((loggedInUser) => {
    setUser(loggedInUser);
    setPrompt("");
    setReply(null);
    setPrevChats([]);
    setAllThreads([]);
    setDocuments([]);
    setNewChat(true);
    setCurrThreadId(uuidv1());
  }, []);

  const login = async (email, password) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      auth: false,
      body: {email, password}
    });

    setToken(data.token);
    startFreshSession(data.user);
  };

  const signup = async (name, email, password) => {
    const data = await apiFetch("/api/auth/signup", {
      method: "POST",
      auth: false,
      body: {name, email, password}
    });

    setToken(data.token);
    startFreshSession(data.user);
  };

  const logout = () => {
    clearToken();
    startFreshSession(null);
  };

  const providerValues = {
    prompt, setPrompt,
    reply, setReply,
    currThreadId, setCurrThreadId,
    newChat, setNewChat,
    prevChats, setPrevChats,
    allThreads, setAllThreads,
    documents, setDocuments,
    theme, setTheme,
    user, setUser, login, signup, logout
  };

  if(!authChecked) {
    return <div className='app appLoading'>Loading SigmaGPT...</div>;
  }

  return (
    <div className='app'>
      <MyContext.Provider value={providerValues}>
          {
            user
              ? <>
                  <Sidebar></Sidebar>
                  <ChatWindow></ChatWindow>
                </>
              : <Auth></Auth>
          }
        </MyContext.Provider>
    </div>
  )
}

export default App
