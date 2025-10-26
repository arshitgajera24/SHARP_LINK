import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Copy, EllipsisVertical, Image, Send, SendHorizonal, Trash2 } from 'lucide-react';
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
  const [clickedMessageId, setClickedMessageId] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [loaded, setLoaded] = useState(false);

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

  const handleDeleteMessage = async (messageId) => {
    const toastId = toast.loading("Deleting...");
    try {
        const token = await getToken();
        const { data } = await api.delete(`/api/message/delete/${messageId}`, {
            headers: { 
              Authorization: `Bearer ${token}` 
            }
        });
    
        if(data.success)
        {
            toast.success(`${data.message} 💨`, { id: toastId });
            fetchUserMessages();
            setClickedMessageId(null);
        }
        else
        {
            toast.error(data.message, { id: toastId });
        }
    } catch (error) {
        toast.error(error.message, { id: toastId });
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
    const interval = setInterval(() => {
      fetchUserMessages();
    }, 3000);

    return () => {
      dispatch(resetMessages());
      clearInterval(interval);
    }
  }, [userId]);

  const isUserNearBottom = () => {
    const chatContainer = document.getElementById("chat-container");
    if (!chatContainer) return true;
    const threshold = 100;
    return chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < threshold;
  };

  useEffect(() => {
    const sortedMessages = [...messages].sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    const lastUnseenIndex = sortedMessages.findIndex(msg => !msg.seen && msg.from_user_id?._id !== currentUser._id);
    const lastMessage = lastUnseenIndex !== -1
      ? document.getElementById(`message-${sortedMessages[lastUnseenIndex]._id}`)
      : document.getElementById(`message-${sortedMessages[sortedMessages.length-1]?._id}`);

    if (!lastMessage) return;

    if (initialLoad || isUserNearBottom()) {
      lastMessage.scrollIntoView({ behavior: initialLoad ? "auto" : "smooth" });
      if (initialLoad) setInitialLoad(false);
    }
  }, [messages]);

  const renderMessageText = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" >
            {part}
          </a>
        );
      } else if (part.startsWith("/")) {
        return (
          <span key={index} onClick={() => navigate(part)} className="text-blue-600 hover:underline cursor-pointer" >
            {part}
          </span>
        );
      } else {
        return <span key={index}>{part}</span>;
      }
    });
  };

  return user && (
    <div className='flex flex-col flex-1 max-h-full overflow-x-hidden'>
      <div onClick={() => navigate(`/profile/${userId}`)} className='flex items-center gap-2 p-2 md:px-10 bg-white border-b border-gray-300 sticky top-0 z-10 cursor-pointer'>
        <button onClick={(e) => {e.stopPropagation(); navigate("/messages");}}>
          <ArrowLeft className='w-6 h-6 hover:scale-110 active:scale-95 mr-2 cursor-pointer' />
        </button>
        <img src={user.profile_picture} alt="profile Picture" className='size-8 rounded-full' loading='lazy' decoding="async" onLoad={() => setLoaded(true)} style={{filter: loaded ? "none" : "blur(20px)", transition: "filter 0.3s ease-out"}} />
        <div>
          <p className="font-medium">{user.full_name}</p>
          <p className="text-sm text-gray-500 -mt-1.5">@{user.username}</p>
        </div>
      </div>

      <div id="chat-container" className='flex-1 overflow-y-auto overflow-x-hidden p-5 md:px-10 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200'>
        <div className='space-y-4 max-w-4xl mx-auto'>
          {
            messages.toSorted((a,b) => new Date(a.createdAt) - new Date(b.createdAt)).map((message, index) => {
              const sentByCurrentUser = message.from_user_id === currentUser._id;
              
              return <div key={index} id={`message-${message._id}`} className={`flex flex-col relative ${message.to_user_id !== user._id ? "items-start" : "items-end"}`}>
                <div className={`p-2 text-sm max-w-xs rounded-lg shadow ${message.to_user_id !== user._id ? "rounded-bl-none bg-gradient-to-l from-violet-50 to-indigo-100" : "rounded-br-none bg-gradient-to-r from-indigo-500 to-purple-700 text-white"}`}>
                  
                  {/* Image Message */}
                  {
                    message.message_type === "image" && <img src={message.media_url} alt="Chat Media" className='w-full max-w-sm rounded-lg mb-1' loading='lazy' decoding='async' onLoad={() => setLoaded(true)} style={{filter: loaded ? "none" : "blur(20px)", transition: "filter 0.3s ease-out"}} />
                  }

                  {/* Post Message */}
                  {
                    message.message_type === "post" && (
                      message.post_id ? (
                      <div onClick={() => navigate(`/post/${message.post_id._id}`)} className="cursor-pointer border rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all max-w-sm">
                        {/* Post Header */}
                        {
                          message.post_id && message.post_id.user && (
                            <div className="flex items-center gap-2 p-3 border-b border-gray-100">
                              <img src={message.post_id.user.profile_picture} alt="User" className="size-8 rounded-full" loading='lazy' decoding='async' onLoad={() => setLoaded(true)} style={{filter: loaded ? "none" : "blur(20px)", transition: "filter 0.3s ease-out"}} />
                              <div>
                                <p className="font-medium text-sm text-gray-800">{message.post_id.user.full_name}</p>
                                <p className="text-xs text-gray-500">@{message.post_id.user.username}</p>
                              </div>
                            </div>
                          )
                        }

                        {/* Post Media */}
                        {
                          message?.post_id?.video_url ? (
                            <video src={message?.video_url} className='w-[300px] h-[300px]' ></video>
                          ) : (
                            <>
                              {
                                message.media_url && (
                                  <img src={message.media_url} alt="Shared Post" className="w-full object-cover max-h-80" loading='lazy' decoding='async' onLoad={() => setLoaded(true)} style={{filter: loaded ? "none" : "blur(20px)", transition: "filter 0.3s ease-out"}}/>
                                )
                              }
                            </>
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
                    ) : (
                      <div className="p-2 text-sm max-w-xs bg-gray-100 text-gray-500 rounded-lg shadow italic">
                        Post not found
                      </div>
                    ))
                  }

                  {/* Text Message */}
                  {
                    message.message_type === "text" && <p className="break-words">
                      {renderMessageText(message.text)}
                    </p>
                  }

                  {/* 3-dot menu button */}
                  <div className="absolute top-1/2 transform -translate-y-1/2"
                      style={{ 
                        left: message.to_user_id !== user._id ? '-22px' : 'auto', 
                        right: message.to_user_id === user._id ? '-22px' : 'auto',
                      }}>
                    
                    {/* 3-dot button */}
                    <button onClick={(e) => {
                          e.stopPropagation();
                          setClickedMessageId(prev => prev === message._id ? null : message._id);
                        }} className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer z-10" >
                        <EllipsisVertical size={16} />
                    </button>

                    {/* menu */}
                    {clickedMessageId === message._id && (
                      <div className={`absolute top-0 ${message.to_user_id === user._id ? "right-full" : "left-full"} ml-2 bg-white border border-gray-200 shadow-lg rounded-lg flex flex-col w-24 z-50`} style={{top: "auto", bottom: "0"}}>
                        <p className="px-3 py-2 text-xs text-gray-500 border-b border-gray-200">
                          {(() => {
                            const msgDate = new Date(message.createdAt);
                            const today = new Date();

                            const isToday = msgDate.getDate() === today.getDate() &&
                                            msgDate.getMonth() === today.getMonth() &&
                                            msgDate.getFullYear() === today.getFullYear();

                            const time = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

                            if (isToday) {
                              return time;
                            } else {
                              const date = `${String(msgDate.getDate()).padStart(2, '0')}/${String(msgDate.getMonth() + 1).padStart(2, '0')}/${String(msgDate.getFullYear()).slice(2)}`;
                              return `${date} ${time}`;
                            }
                          })()}
                        </p>
                        <button className="flex items-center text-gray-800 gap-2 px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                            onClick={() => {
                                let content = "";
                                if(message.message_type === "text") content = message.text;
                                else if(message.message_type === "image") content = message.media_url;
                                else if(message.message_type === "post") content = `${import.meta.env.VITE_FRONTEND_URL}/post/${message.post_id?._id}`;
                                navigator.clipboard.writeText(content)
                                  .then(() => toast.success("Copied to clipboard"))
                                  .catch(() => toast.error("Failed to copy"));
                                setClickedMessageId(null);
                            }}>
                          <Copy className='w-4 h-4' />Copy
                        </button>
                        {message.to_user_id === user._id && (
                          <button onClick={() => handleDeleteMessage(message._id)} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer rounded-b-md">
                            <Trash2 className='w-4 h-4' />Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
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
              ? <img src={URL.createObjectURL(image)} alt="Image" className='h-8 rounded' loading='lazy' decoding='async' onLoad={() => setLoaded(true)} style={{filter: loaded ? "none" : "blur(20px)", transition: "filter 0.3s ease-out"}} />
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
