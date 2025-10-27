import { useRef } from 'react'
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
import {useDispatch, useSelector} from "react-redux"
import { fetchUsers } from './features/user/userSlice.js'
import { fetchConnections } from './features/connections/connectionsSlice.js'
import { addMessage, deleteMessage, markMessageSeen } from './features/messages/messagesSlice.js'
import Notification from './components/Notification.jsx'
import PostPage from './pages/PostPage.jsx'
import api from './api/axios.js'
import Loading from './components/Loading.jsx'
import Notifications from './pages/Notifications.jsx'
import { Error } from './pages/Error.jsx'
import { closeChat } from './features/chat/chatUISlice.js'


const App = () => {
  const {user} = useUser();
  const {getToken, isLoaded} = useAuth();
  const {pathname} = useLocation();
  const pathNameRef = useRef(pathname);
  const { selectedUserId } = useSelector((state) => state.chatUI);

  // const { signOut } = useAuth();
  // signOut();

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
    const isMobile = window.innerWidth < 768;
    if(isMobile && (pathname === "/" || pathname.startsWith("/profile")))
    {
      dispatch(closeChat());
    }
  }, [pathname, dispatch])

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
            const isOnMessagesPage = pathNameRef.current.startsWith("/messages");
            const isChatboxOpen = !!selectedUserId;

            if((isOnMessagesPage && selectedUserId === msg.from_user_id) || (!isOnMessagesPage && selectedUserId === msg.from_user_id))
            {
              const markAsSeen = async () => {
                const token = await getToken();
                await api.post("/api/message/get", { to_user_id: msg.from_user_id._id }, {
                  headers: { Authorization: `Bearer ${token}` }
                });
              };
              markAsSeen();
            }
            else if (!isOnMessagesPage && !isChatboxOpen)
            {
              toast.custom((t) => <Notification t={t} message={msg} />, {position: "top-right"});
            }
            dispatch(addMessage(msg));
            break;

          case "messageSeen":
            if(message.userId && message.messageIds) {
              dispatch(markMessageSeen({ messageIds: message.messageIds }));
            }
            break;
          
          case "message_deleted":
            dispatch(deleteMessage({messageId: message.messageId}));
            break;

          default:
            console.warn("Unknown SSE message type:", message);
        }
      }

      eventSource.onerror = (err) => {
        console.warn("SSE disconnected. Attempting to reconnect...");
        eventSource.close();
        setTimeout(() => {
          const newEventSource = new EventSource(`${import.meta.env.VITE_BASEURL}/api/message/${user.id}`);
        }, 3000);
      };

      return () => {
        eventSource.close();
      }
    }
  }, [user, dispatch])

  useEffect(() => {
    if (isLoaded && user) {
      const welcomeShownKey = `welcome_shown_${user.id}`;

      if (!sessionStorage.getItem(welcomeShownKey)) {
        const createdAt = new Date(user.createdAt).getTime();
        const lastSignInAt = new Date(user.lastSignInAt).getTime();

        const welcomeMessage = createdAt === lastSignInAt
          ? "Registration Successful! 🎉"
          : `Welcome back, ${user.firstName || "User"}! 👋`;

        toast.success(welcomeMessage);

        sessionStorage.setItem(welcomeShownKey, "true");
      }
    }
  }, [isLoaded, user]);

  if (!isLoaded) {
    return <Loading />;
  }

  return (
    <>
      <Toaster />
      <Routes>
        <Route path='/' element={!user ? <Login /> : <Layout />}>
          <Route index element={<Feed />} />
          <Route path='notifications' element={<Notifications />} />
          <Route path='messages/:userId?' element={<Messages />} />
          <Route path='connections' element={<Connections />} />
          <Route path='discover' element={<Discover />} />
          <Route path='profile' element={<Profile />} />
          <Route path='profile/:profileId' element={<Profile />} />
          <Route path='create-post' element={<CreatePost />} />
          <Route path="/post/:postId" element={<PostPage />} />
          <Route path='*' element={<Error />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
