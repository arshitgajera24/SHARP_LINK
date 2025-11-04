import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import moment from 'moment';
import { useAuth, useUser } from '@clerk/clerk-react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import Loading from './Loading.jsx';
import { useDispatch } from 'react-redux';
import { openChatWithUser } from '../features/chat/chatUISlice.js';

const RecentMessages = ({ selectedUserId, onSelectUser = () => {} }) => {

    const [messages, setMessages] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const {user} = useUser();
    const location = useLocation();
    const pathName = location.pathname;
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const {getToken} = useAuth();
    const [loading, setLoading] = useState(false);

    const fetchRecentMessages = async () => {
        try {
            const token = await getToken();

            const {data} = await api.get("/api/user/recent-messages", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            if(data.success)
            {                
                const groupMessages = data.messages.reduce((acc, message) => {
                    const senderId = message.from_user_id._id === user.id ? message.to_user_id._id : message.from_user_id._id;;
                    if(!acc[senderId] || new Date(message.createdAt) > new Date(acc[senderId].createdAt))
                    {
                        acc[senderId] = message;
                    }
                    return acc;
                }, {});

                const sortMessages = Object.values(groupMessages).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
                setMessages(sortMessages)
            }
            else
            {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const markConversationAsSeen = async (otherUserId) => {
        try {
            const token = await getToken();
            await api.post("/api/message/get", { to_user_id: otherUserId }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            fetchRecentMessages();
        } catch (err) {
            toast.error("markConversationAsSeen error:", err);
        }
    };

    const getPreviewText = (m) => {
        if (!m) return "Message is not Available";

        // Post message
        if (m.message_type === "post") {
            if (!m.post_id) return "Post not Found";
            if (m.post_id.user) {
                const username = m.post_id.user.username || m.post_id.user.full_name || "user";
                return m.from_user_id._id === user.id 
                    ? `You sent a post of @${username}` 
                    : `Sent a post of @${username}`;
            }
            return "Post Details are Unavailable";
        }

        if (m.message_type === "image") {
            return m.text ? m.text : "Sent an image";
        }

        if (m.message_type === "text") {
            return m.text ? m.text : "No text message";
        }

        return "Message is not Available";
    };

    useEffect(() => {
        const fetchMessages = async () => {
            if(user)
            {
                setLoading(true);
                await fetchRecentMessages();
                setLoading(false);
                const interval = setInterval(fetchRecentMessages, 15000)
                return () => clearInterval(interval);
            }
        }
        fetchMessages();
    }, [user])    

  return pathName === "/" ? (
    <div className='bg-white max-w-xs mt-4 p-4 min-h-20 rounded-md shadow text-xs text-slate-800'>
        <h3 className='font-semibold text-slate-8 mb-4'>Recent Messages</h3>
        <div className='flex flex-col max-h-56 overflow-y-scroll no-scrollbar cursor-pointer'>
            {
                messages.length > 0 ? (messages.map((message, index) => {
                    const otherUser = message.from_user_id._id === user.id ? message.to_user_id : message.from_user_id;
                    return <div onClick={async () => { dispatch(openChatWithUser(otherUser._id)); await markConversationAsSeen(otherUser._id); }} key={index} className='flex items-start gap-2 py-2 hover:bg-slate-100'>
                        <img src={otherUser.profile_picture} alt="Profile Picture" className='w-8 h-8 rounded-full' loading='lazy' decoding='async' onLoad={() => setLoaded(true)} style={{filter: loaded ? "none" : "blur(20px)", transition: "filter 0.3s ease-out"}} />
                        <div className='w-full'>
                            <div className='flex justify-between'>
                                <p className='font-medium'>{otherUser.full_name}</p>
                                <p className='text-[10px] text-slate-400'>{moment(message.createdAt).fromNow()}</p>
                            </div>
                            <div className='flex justify-between'>
                                <p className='text-gray-500'>{getPreviewText(message)}</p>
                                {
                                    message.to_user_id._id === user.id && !message.seen && <p className='bg-indigo-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-[10px]'>1</p>
                                }
                            </div>
                        </div>
                    </div>
                })) : (
                    <p className="font-light text-center pt-2">No Recent Chats Available</p>
                )
            }
        </div>
    </div>
  ) : loading ? <Loading /> : (
    <div className="flex flex-col h-full">
        <h3 className="p-3 font-semibold border-b border-gray-200 sticky top-0 bg-white z-10">Recent Chats</h3>
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 max-h-screen">
        {
            messages.length > 0 ? (messages.map((msg) => {
                const otherUser = msg.from_user_id._id === user.id ? msg.to_user_id : msg.from_user_id;
                return <div key={otherUser._id} onClick={async () => {await markConversationAsSeen(otherUser._id); onSelectUser(otherUser._id); }} className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-100 transition ${selectedUserId === otherUser._id ? "bg-gray-200" : ""}`}>
                    <img src={otherUser.profile_picture} className="w-12 h-12 rounded-full" loading='lazy' decoding="async" onLoad={() => setLoaded(true)} style={{filter: loaded ? "none" : "blur(20px)", transition: "filter 0.3s ease-out"}} />
                    <div className="flex-1">
                        <div className="flex justify-between">
                            <p className="font-medium">{otherUser.full_name}</p>
                            <span className="text-xs text-gray-400">{moment(msg.createdAt).fromNow()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-500 truncate">{getPreviewText(msg)}</p>
                            {
                                msg.to_user_id._id === user.id && !msg.seen
                                && <span className="bg-indigo-500 text-white w-5 h-5 text-[10px] flex items-center justify-center rounded-full">{msg.unseenCount || 1}</span>
                            }
                        </div>
                    </div>
                </div>
            })) : (
                <p className="font-light text-center pt-2">No Recent Chats Available</p>
            )
        }
        </div>
    </div>
  )
}

export default RecentMessages
