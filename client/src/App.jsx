import React, { useRef } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Feed from './pages/Feed'
import Messages from './pages/Messages'
import Connections from './pages/Connections'
import Discover from './pages/Discover'
import Profile from './pages/Profile'
import CreatePost from './pages/CreatePost'
import {useUser, useAuth} from "@clerk/clerk-react"
import Layout from './pages/Layout'
import toast, {Toaster} from "react-hot-toast"
import { useEffect } from 'react'
import {useDispatch} from "react-redux"
import { fetchUsers } from './features/user/userSlice.js'
import { fetchConnections } from './features/connections/connectionsSlice.js'
import { addMessage, markMessageSeen } from './features/messages/messagesSlice.js'
import Notification from './components/Notification.jsx'
import ScrollToHash from './components/ScrollToHash.jsx'
import PostPage from './pages/PostPage.jsx'
import api from './api/axios.js'
import Loading from './components/Loading.jsx'

const App = () => {
  const {user} = useUser();
  const {getToken, isLoaded} = useAuth();
  const {pathname} = useLocation();
  const pathNameRef = useRef(pathname);

  const dispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      if(user)
      {
        const token = await getToken()
        dispatch(fetchUsers(token))
        dispatch(fetchConnections(token))
      }
    }
    fetchData();
  }, [user, getToken, dispatch])

  useEffect(() => {
    pathNameRef.current = pathname    
  }, [pathname])

  useEffect(() => {
    if(user)
    {
      const eventSource = new EventSource(`${import.meta.env.VITE_BASEURL}/api/message/${user.id}`)
      eventSource.onmessage = (event) => {
        const message = JSON.parse(event.data);       
        
        switch(message.type) {
          case "newMessage":
            const msg = message.message;
            if(pathNameRef.current !== `/messages/${msg.from_user_id._id}`) 
            {
              toast.custom((t) => <Notification t={t} message={msg} />, {position: "top-right"});
            }
            else
            {
              const markAsSeen = async () => {
              const token = await getToken();
                await api.post("/api/message/get", { to_user_id: msg.from_user_id._id }, {
                  headers: { Authorization: `Bearer ${token}` }
                });
              };
              markAsSeen();
            }
            dispatch(addMessage(msg));
            break;

          case "messageSeen":
            if(message.userId && message.messageIds) {
              dispatch(markMessageSeen({ messageIds: message.messageIds }));
            }
            break;

          default:
            console.warn("Unknown SSE message type:", message);
        }
      }

      return () => {
        eventSource.close();
      }
    }
  }, [user, dispatch])

    if (!isLoaded) {
      return <Loading />;
    }

  return (
    <>
      <ScrollToHash />
      <Toaster />
      <Routes>
        <Route path='/' element={!user ? <Login /> : <Layout />}>
          <Route index element={<Feed />} />
          <Route path='messages/:userId?' element={<Messages />} />
          <Route path='connections' element={<Connections />} />
          <Route path='discover' element={<Discover />} />
          <Route path='profile' element={<Profile />} />
          <Route path='profile/:profileId' element={<Profile />} />
          <Route path='create-post' element={<CreatePost />} />
          <Route path="/post/:postId" element={<PostPage />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
