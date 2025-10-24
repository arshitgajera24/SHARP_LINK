import { BadgeCheck, Eye, X } from 'lucide-react'
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react'
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from "react-router-dom"

const StoryViewer = ({ viewStory, setViewStory, setSelectedStoryId = null, onOpenViews }) => {

    const [index, setIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [viewCount, setViewCount] = useState(0);

    const { user } = useUser();
    const { getToken } = useAuth();
    const timerRef = useRef(null);
    const intervalRef = useRef(null);
    const isPausedRef = useRef(false);
    const navigate = useNavigate();

    if (!viewStory || viewStory.length === 0) return null;

    const currentStory = viewStory[index];
    const isMyStory = currentStory?.user?._id === user?.id;
    const totalStories = viewStory.length;

    const getStoryViewCounts = async () => {
        try {
            if (!isMyStory) return;
            const token = await getToken();
            const { data } = await api.get(`/api/story/viewers/${currentStory._id}`, {
                headers: { 
                    Authorization: `Bearer ${token}` 
                }
            });

            if (data.success) {
                setViewCount(data.viewers.length);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    const nextStory = () => {
        if(index < totalStories - 1)
        {
            setIndex(index + 1);
        }
        else
        {
            setViewStory(null);
        }
    }

    const prevStory = () => {
        if(index > 0){
            setIndex(index - 1);
        } 
    }

    const startProgress = () => {
        clearTimeout(timerRef.current);
        clearInterval(intervalRef.current);
        setProgress(0);

        if(currentStory.media_type === "video") return;

        let elapsed = 0;
        const duration = 10000;
        const setTime = 100;

        intervalRef.current = setInterval(() => {
            if(!isPausedRef.current){
                elapsed += setTime;
                setProgress(Math.min((elapsed / duration) * 100, 100));
            }
        }, setTime)

        timerRef.current = setTimeout(() => {
            nextStory();
        }, duration)
    }

    const markAsViewed = async () => {
        if (!currentStory) return;
        try {
            const token = await getToken();
            await api.post(`/api/story/view/${currentStory._id}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
        } catch (error) {
            toast.error(error.message)
        }
    };

    useEffect(() => {
        startProgress();
        markAsViewed();
        getStoryViewCounts();
        return () => {
            clearTimeout(timerRef.current);
            clearInterval(intervalRef.current)
        }
    }, [index, currentStory])

    const handleClose = () => {
        setViewStory(null);
        setIndex(0);
        setProgress(0);
        clearTimeout(timerRef.current);
        clearInterval(intervalRef.current);
    }

    const handleMouseDown = () => {
        isPausedRef.current = true;
    }

    const handleMouseUp = () => {
        isPausedRef.current = false;
    }

    const handleClick = (e) => {      
        const { clientX, currentTarget } = e;
        const middle = currentTarget.offsetWidth / 2;
        if(clientX < middle) {
            prevStory();
        } else {
            nextStory();
        }
    }

    if(!viewStory) return null;

    const renderContent = () => {
        switch (currentStory.media_type) {
            case 'image':
                return (
                    <img src={currentStory.media_url} alt="Media" className='max-w-full max-h-screen object-contain' />
                );

            case 'video':
                return (
                    <video onEnded={() => setViewStory(null)} src={currentStory.media_url} className='min-h-screen pt-18' autoPlay />
                );
            
            case 'text':
                return (
                    <div className='w-full h-full flex items-center justify-center p-8 text-white text-2xl text-center'>
                        {currentStory.content}
                    </div>
                )
        
            default:
                return null;
        }
    }

    useEffect(() => {
        setSelectedStoryId(currentStory._id);    
    }, [renderContent])

  return (
    <div onClick={handleClick} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onTouchStart={handleMouseDown} onTouchEnd={handleMouseUp} className='fixed inset-0 h-screen bg-black bg-opacity-90 z-110 flex items-center justify-center' style={{backgroundColor: currentStory.media_type === "text" ? currentStory.background_color : "#000000"}}>
      
        {/* Progress Bar */}
        <div className='absolute top-1 left-0 right-0 flex gap-2'>
            {
                viewStory.map((_, i) => (
                    <div key={i} className='flex-1 h-1 bg-gray-500 rounded'>
                        <div className='h-full bg-white transition-all duration-50 linear rounded' 
                            style={{
                                width: i < index ? '100%' : i === index ? `${progress}%` : '0%'
                            }} />
                    </div>
                ))
            }
        </div>

        {/* User Info - Left part */}
        <div onClick={() => navigate(`/profile/${currentStory.user?._id}`)} className='absolute top-4 left-4 flex items-center space-x-3 p-2 px-4 sm:p-4 sm:px-8 backdrop-blur-2xl rounded bg-black/50 cursor-pointer'>
            <div className='flex items-center space-x-3'>
                <img src={currentStory.user?.profile_picture} alt="Profile Picture" className='size-7 sm:size-8 rounded-full object-cover border border-white' />
                <div className='text-white font-medium flex items-center gap-1.5'>
                    <span>{currentStory.user?.full_name}</span>
                    <BadgeCheck size={18} />
                </div>
            </div>
            <span className='text-white/70 text-xs'>
                {moment(currentStory.createdAt).fromNow()}
            </span>
        </div>

        {/* Close button */}
        <button onClick={handleClose} className='absolute top-4 right-4 text-white text-3xl font-bold focus:outline-none'>
            <X className='w-8 h-8 hover:scale-110 transition cursor-pointer' />
        </button>

        {/* Content Wrapper */}
        <div className='max-w-[90vw] max-h-[90vh] flex items-center justify-center'>
            {renderContent()}
        </div>

        {
            isMyStory && (
                <button onClick={(e) => { e.stopPropagation(); onOpenViews(); }} className='absolute bottom-6 left-6 flex items-center gap-1 bg-black/50 text-white text-sm px-3 py-1.5 rounded-full backdrop-blur cursor-pointer hover:bg-black/70'>
                    <Eye className='w-5 h-5' />
                    <span>{viewCount}</span>
                </button>
            )
        }
    </div>
  )
}

export default StoryViewer
