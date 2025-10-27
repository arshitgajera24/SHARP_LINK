import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'
import { openChatWithUser } from '../features/chat/chatUISlice';
import { useDispatch } from 'react-redux';

const Notification = ({t, message}) => {

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [loaded, setLoaded] = useState(false);

    const getNotificationText = (m) => {
        if (!m) return "Sent a Media";

        if (m.message_type === "post" && m.post_id && m.post_id.user) {
            const username = m.post_id.user.username || m.post_id.user.full_name || "user";
            return `Sent a post of @${username}`;
        }

        if (m.message_type === "image") return m.text ? m.text : "Sent an image";
        if (m.message_type === "text" && m.text) return m.text;
        return "Sent a Media";
    }

  return (
    <div className='max-w-md w-full bg-white shadow-lg rounded-lg flex border border-gray-300 hover:scale-105 transition'>
        <div className='flex-1 p-4'>
            <div className='flex items-start'>
                <img src={message.from_user_id.profile_picture} alt="Sender Image" className='h-10 w-10 rounded-full flex-shrink-0 mt-0.5' loading='lazy' decoding="async" onLoad={() => setLoaded(true)} style={{filter: loaded ? "none" : "blur(20px)", transition: "filter 0.3s ease-out"}} />
                <div className='ml-3 flex-1'>
                    <p className="text-sm font-medium text-gray-900">{message.from_user_id.full_name}</p>
                    <p className='text-sm text-gray-500'>{getNotificationText(message)}</p>
                </div>
            </div>
        </div>
        <div className='flex border-l border-gray-200'>
            <button onClick={() => 
                {
                    const isMobile = window.innerWidth < 768;
                    if (isMobile) {
                        navigate(`/messages`);
                        dispatch(openChatWithUser(message.from_user_id._id));
                    } else {
                        dispatch(openChatWithUser(message.from_user_id._id));
                    }
                    toast.dismiss(t.id);
                }
            } className='p-4 text-indigo-600 font-semibold cursor-pointer'>
                Reply
            </button>
        </div>
    </div>
  )
}

export default Notification
