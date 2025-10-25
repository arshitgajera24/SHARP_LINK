import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth, useUser } from '@clerk/clerk-react'
import { fetchConnections } from '../features/connections/connectionsSlice.js'
import RecentMessages from '../components/RecentMessages.jsx'
import Chatbox from './Chatbox.jsx'

const Messages = () => {

  const { user } = useUser();
  const { getToken } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userId } = useParams();

  const [selectedUserId, setSelectedUserId] = useState(userId || null);

  useEffect(() => {
    getToken().then((token) => dispatch(fetchConnections(token)));
  }, [user]);

  useEffect(() => {
    setSelectedUserId(userId);
  }, [userId])

  return <div className="flex h-full bg-slate-50">
      {/* Left Panel: Recent Chats */}
      <div className={`border-r border-gray-300 bg-white flex flex-col w-1/4 ${!userId ? 'w-full md:w-1/4 flex' : 'hidden md:flex'} max-h-screen`}>
        <RecentMessages selectedUserId={userId}
          onSelectUser={(id) => navigate(`/messages/${id}`)} />
      </div>

      {/* Right Panel: Chat Window */}
      <div className={`flex-1 flex flex-col ${userId ? 'flex w-full' : 'hidden md:flex'} max-h-screen`}>
        {
          userId ? (
            <Chatbox selectedUserId={userId} />
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
