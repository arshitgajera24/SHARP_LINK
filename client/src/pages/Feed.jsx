import { useEffect, useState } from 'react'
import { assets } from '../assets/assets';
import Loading from '../components/Loading';
import Storiesbar from '../components/Storiesbar';
import PostCard from '../components/PostCard';
import RecentMessages from '../components/RecentMessages';
import { useAuth } from '@clerk/clerk-react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import Chatbox from './Chatbox.jsx';
import { closeChat } from '../features/chat/chatUISlice.js';

const Feed = () => {

  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const {getToken} = useAuth();

  const fetchFeeds = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("api/post/feed", {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        }
      })
      
      if(data.success)
      {
        setFeeds(data.posts || [])
      }
      else
      {
        toast.error(data.message)
      }

    } catch (error) {
      toast.error(error.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchFeeds();
  }, [])

  const handleDeleteFromFeed = (postId) => {
    setFeeds((prev) => prev.filter((post) => post._id !== postId));
  };

  return !loading ? (
    <div className='h-full overflow-y-scroll no-scrollbar py-2 mb-12 xl:mb-0 xl:pr-5 flex items-start justify-center xl:gap-8'>
      {/* Stories & Post */}
      <div>
        <Storiesbar />
        <div className='p-4 space-y-6'>
          {
            feeds.map((post) => (
              <PostCard key={post._id} post={post} onDelete={handleDeleteFromFeed} />
            ))
          }
        </div>
      </div>

      {/* Right Side Bar */}
      <div className='max-xl:hidden sticky top-0'>
        <div className='max-w-xs bg-white text-xs p-4 rounded-md inline-flex flex-col gap-2 shadow'>
          <h3 className='text-slate-800 font-semibold'>Sponsored</h3>
          <img src={assets.sponsored_img} alt="Sponsored Image" className='w-75 h-50 rounded-md' fetchPriority='high' decoding="async" onLoad={() => setLoaded(true)} style={{filter: loaded ? "none" : "blur(20px)", transition: "filter 0.3s ease-out"}} />
          <p className='text-slate-600'>Email Marketing</p>
          <p className='text-slate-400'>Supercharge Your Marketing with a Powerful, Easy-to-Use Platform Built for Results.</p>
        </div>
        <RecentMessages />
      </div>
    </div>
  ) : <Loading />
}

export default Feed
