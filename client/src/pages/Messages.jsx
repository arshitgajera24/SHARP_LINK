import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth, useUser } from '@clerk/clerk-react'
import { fetchConnections } from '../features/connections/connectionsSlice.js'
import RecentMessages from '../components/RecentMessages.jsx'
import Chatbox from './Chatbox.jsx'
import { closeChat, openChatWithUser } from '../features/chat/chatUISlice.js'

const Messages = () => {

  const { user } = useUser();
  const { getToken } = useAuth();
  const dispatch = useDispatch();
  const location = useLocation();

  const { open, selectedUserId } = useSelector((state) => state.chatUI);

  useEffect(() => {
    getToken().then((token) => dispatch(fetchConnections(token)));
  }, [user]);

  useEffect(() => {
    if (!location.state?.fromProfileChat) {
      dispatch(closeChat());
    }

    window.history.replaceState({}, document.title);
  }, [dispatch]);

  return <div className="flex h-full bg-slate-50">
      {/* Left Panel: Recent Chats */}
      <div className={`border-r border-gray-300 bg-white flex flex-col w-1/3 ${!selectedUserId ? 'w-full md:w-1/3 flex' : 'hidden md:flex'} max-h-screen`}>
        <RecentMessages selectedUserId={selectedUserId} onSelectUser={(id) => dispatch(openChatWithUser(id))}  />
      </div>

      {/* Right Panel: Chat Window */}
      <div className={`flex-1 flex flex-col ${selectedUserId ? 'flex w-full' : 'hidden md:flex'} max-h-screen`}>
        {
          selectedUserId ? (
            <Chatbox selectedUserId={selectedUserId} onBack={() => dispatch(closeChat())} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Select a chat to start messaging
            </div>
          )
        }
      </div>
    </div>
}

export default Messages
