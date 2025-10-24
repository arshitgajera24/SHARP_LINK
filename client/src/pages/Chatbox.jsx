import React, { useEffect, useRef, useState } from 'react'
import { dummyMessagesData, dummyUserData } from '../assets/assets'
import { ArrowLeft, Image, Send, SendHorizonal } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { addMessage, fetchMessages, resetMessages } from '../features/messages/messagesSlice.js';

const Chatbox = ({ selectedUserId }) => {

  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [user, setUser] = useState(null);
  const lastMessageRef = useRef(null);
  const {messages} = useSelector((state) => state.messages);
  const userId = !selectedUserId ? useParams()?.userId : selectedUserId;
  const {getToken} = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.user.value);

  const connections = useSelector((state) => state.connections.connections);

  const fetchUserMessages = async () => {
    try {
      const token = await getToken();
      dispatch(fetchMessages({token, userId}));
    } catch (error) {
      toast.error(error.message);
    }
  }

  const sendMessage = async () => {
    try {
      if(!text && !image) return;

      const token = await getToken();

      const formData = new FormData();
      formData.append("to_user_id", userId);
      formData.append("text", text);
      image && formData.append("image", image);

      const {data} = await api.post("/api/message/send", formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if(data.success)
      {
        setText("")
        setImage(null);
        dispatch(addMessage(data.message))
      }
      else
      {
        throw new Error(data.message)
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  useEffect(() => {
    if(connections.length > 0)
    {
      const user = connections.find(connection => connection._id === userId);
      setUser(user)
    }
  }, [connections, userId])

  useEffect(() => {
    fetchUserMessages();

    return () => {
      dispatch(resetMessages())
    }
  }, [userId])

  useEffect(() => {
    // Find the last message not seen by current user
    const sortedMessages = [...messages].sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    const lastUnseenIndex = sortedMessages.findIndex(msg => !msg.seen && msg.from_user_id?._id !== currentUser._id);

    if(lastUnseenIndex !== -1) {
      // Scroll to last unseen message
      lastMessageRef.current = document.getElementById(`message-${sortedMessages[lastUnseenIndex]._id}`);
    } else if(sortedMessages.length > 0) {
      // If all messages seen, scroll to last message
      lastMessageRef.current = document.getElementById(`message-${sortedMessages[sortedMessages.length-1]._id}`);
    }

    lastMessageRef.current?.scrollIntoView({behavior: "auto"});
  }, [messages]);

  return user && (
    <div className='flex flex-col flex-1 max-h-screen'>
      <div onClick={() => navigate(`/profile/${userId}`)} className='flex items-center gap-2 p-2 md:px-10 bg-white border-b border-gray-300 sticky top-0 z-10 cursor-pointer'>
        <button onClick={(e) => {e.stopPropagation(); navigate("/messages");}}>
          <ArrowLeft className='w-6 h-6 hover:scale-110 active:scale-95 mr-2 cursor-pointer' />
        </button>
        <img src={user.profile_picture} alt="profile Picture" className='size-8 rounded-full' />
        <div>
          <p className="font-medium">{user.full_name}</p>
          <p className="text-sm text-gray-500 -mt-1.5">@{user.username}</p>
        </div>
      </div>

      <div className='flex-1 overflow-y-auto p-5 md:px-10 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200'>
        <div className='space-y-4 max-w-4xl mx-auto'>
          {
            messages.toSorted((a,b) => new Date(a.createdAt) - new Date(b.createdAt)).map((message, index) => {
              const sentByCurrentUser = message.from_user_id === currentUser._id;
              
              return <div key={index} id={`message-${message._id}`} className={`flex flex-col ${message.to_user_id !== user._id ? "items-start" : "items-end"}`}>
                <div className={`p-2 text-sm max-w-sm bg-white text-slate-700 rounded-lg shadow ${message.to_user_id !== user._id ? "rounded-bl-none" : "rounded-br-none"}`}>
                  {
                    message.message_type === "image" && <img src={message.media_url} alt="Chat Media" className='w-full max-w-sm rounded-lg mb-1' />
                  }
                  {
                    message.message_type === "post" && message.post_id && (
                      <div onClick={() => navigate(`/post/${message.post_id._id}`)} className="cursor-pointer border rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all max-w-sm">
                        {/* Post Header */}
                        {
                          message.post_id && message.post_id.user && (
                            <div className="flex items-center gap-2 p-3 border-b border-gray-100">
                              <img src={message.post_id.user.profile_picture} alt="User" className="size-8 rounded-full"/>
                              <div>
                                <p className="font-medium text-sm">{message.post_id.user.full_name}</p>
                                <p className="text-xs text-gray-500">@{message.post_id.user.username}</p>
                              </div>
                            </div>
                          )
                        }

                        {/* Post Media */}
                        {
                          message.media_url && (
                            <img src={message.media_url} alt="Shared Post" className="w-full object-cover max-h-80"/>
                          )
                        }

                        {/* Post Caption */}
                        <div className="p-3 text-sm text-gray-700">
                          {
                            message.post_id?.text
                              ? message.post_id.text
                              : message.text || "Shared a post"
                          }
                        </div>
                      </div>
                    )
                  }
                  {
                    message.message_type === "text" && <p>{message.text}</p>
                  }
                </div>
                {
                  sentByCurrentUser && message.seen && (
                    <span className="text-xs text-gray-400 mt-1">Seen</span>
                  )
                }
              </div>
            })
          }
        </div>
      </div>

      <div className='sticky bottom-0 w-full px-4 z-20 bg-white py-2 xl:pb-2 pb-15'>
        <div className='flex items-center gap-3 pl-5 p-1.5 bg-white w-full max-w-xl mx-auto border border-gray-200 dark:border-gray-700 shadow rounded-full'>
          <input onKeyDown={e => e.key === "Enter" && sendMessage()} onChange={(e) => setText(e.target.value)} value={text} type="text" className='flex-1 outline-none text-slate-700' placeholder='Type a Message...' />
          <label htmlFor="image">
            {
              image
              ? <img src={URL.createObjectURL(image)} alt="Image" className='h-8 rounded' />
              : <Image className='size-7 text-gray-400 cursor-pointer' />
            }
            <input type="file" id="image" accept='image/*' hidden onChange={(e) => setImage(e.target.files[0])} />
          </label>
          <button onClick={sendMessage} className='bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 cursor-pointer text-white p-2 rounded-full'>
            <SendHorizonal size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Chatbox
