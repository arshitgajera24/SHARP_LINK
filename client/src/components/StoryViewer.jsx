import { BadgeCheck, EllipsisVertical, Eye, Trash2, X } from 'lucide-react'
import moment from 'moment';
import { useEffect, useRef, useState } from 'react'
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from "react-router-dom"
import StoryViewsModel from './StoryViewsModel.jsx';

const StoryViewer = ({ viewStory, setViewStory, setSelectedStoryId = null }) => {

    const [index, setIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [viewCount, setViewCount] = useState(0);

    const [showOptions, setShowOptions] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [showViewsModal, setShowViewsModal] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [viewers, setViewers] = useState([]);

    const { user } = useUser();
    const { getToken } = useAuth();
    const timerRef = useRef(null);
    const intervalRef = useRef(null);
    const isPausedRef = useRef(false);
    const elapsedRef = useRef(0);
    const holdingRef = useRef(false);
    const navigate = useNavigate();

    if (!viewStory || viewStory.length === 0) return null;

    const currentStory = viewStory[index];
    const isMyStory = currentStory?.user?._id === user?.id;
    const totalStories = viewStory.length;
    const duration = 10000;

    const [videoDuration, setVideoDuration] = useState(duration);
    const videoRef = useRef(null);

    const handleDeleteStory = async (storyId) => {
        const toastId = toast.loading("Deleting...");

        try {
            const token = await getToken();
            const { data } = await api.delete(`/api/story/delete/${storyId}`, {
                headers: { 
                    Authorization: `Bearer ${token}` 
                }
            });

            if(data.success)
            {
                toast.success(data.message, { id: toastId, icon: "🗑️" });

                const updatedStories = viewStory.filter(s => s._id !== storyId);

                if (updatedStories.length === 0) {
                    setViewStory(null);
                    setSelectedStoryId(null);
                    return;
                }

                setViewStory(updatedStories);

                if (index >= updatedStories.length) {
                    setIndex(updatedStories.length - 1);
                }
                resumeStory();
            }
            else
            {
                toast.error(data.message, { id: toastId });
            }
        } catch (error) {
            toast.error(error.message, { id: toastId });
        }
    }

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
                setViewers(data.viewers.sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt)));
            }
        } catch (error) {
            toast.error(error.message);
        }
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

    const clearTimers = () => {
        clearTimeout(timerRef.current);
        clearInterval(intervalRef.current);
    };

    const nextStory = () => {
        clearTimers();
        elapsedRef.current = 0;
        setProgress(0);
        setVideoDuration(duration);
        holdingRef.current=false;
        resumeStory();
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
        elapsedRef.current = 0;
        setProgress(0);
        clearTimers();
        startProgress();
        setVideoDuration(duration);
        holdingRef.current=false;
        resumeStory();
        if(index > 0){
            setIndex(index - 1);
        } 
    }

    const startProgress = (startPercent = 0, customDuration = duration) => {
        clearTimers();

        let elapsed = (startPercent / 100) * customDuration;
        elapsedRef.current = elapsed;

        intervalRef.current = setInterval(() => {
            if (!isPausedRef.current) {
                elapsedRef.current += 100;
                setProgress(Math.min((elapsedRef.current / customDuration) * 100, 100));
            }
        }, 100);

        timerRef.current = setTimeout(() => {
            nextStory();
        }, customDuration - elapsedRef.current);
    }

    const pauseStory = () => { 
        setIsPaused(true); 
        isPausedRef.current = true;
    };

    const resumeStory = () => {
        setIsPaused(false); 
        isPausedRef.current = false; 
        startProgress(progress, currentStory.media_type === 'video' ? videoDuration : duration);
    };

    const openViews = () => {
        pauseStory();
        if(currentStory.media_type === 'video' && videoRef.current) videoRef.current.pause();
        setShowViewsModal(true);
    }

    const closeViews = () => { 
        setShowViewsModal(false); 
        if(currentStory.media_type === 'video' && videoRef.current) videoRef.current.play();
        resumeStory(); 
    };

    const handleMouseDown = () => {
        holdingRef.current = true;
        pauseStory();
        if(currentStory.media_type === 'video' && videoRef.current) {
            videoRef.current.pause();
        }
    };

    const handleMouseUp = () => {
        holdingRef.current = false;
        if(currentStory.media_type === 'video' && videoRef.current) {
            videoRef.current.play();
        }
        if (!showOptions) resumeStory();
    };

    useEffect(() => {
        elapsedRef.current = 0;
        setProgress(0);
        startProgress();
        markAsViewed();
        getStoryViewCounts();
        setSelectedStoryId(currentStory._id);
        return clearTimers;
    }, [index, currentStory]);

    const handleClose = () => {
        setViewStory(null);
        setIndex(0);
        setProgress(0);
        clearTimers();
        setSelectedStoryId(null);
    }

    const toggleOptions = (e) => {
        e.stopPropagation();
        if (showOptions) {
            setShowOptions(false);
            if(currentStory.media_type === 'video' && videoRef.current) videoRef.current.play();
            if (!holdingRef.current) resumeStory();
        } else {
            setShowOptions(true);
            if(currentStory.media_type === 'video' && videoRef.current) videoRef.current.pause();
            pauseStory();
        }
    };

    const handleClick = (e) => {      
        const { clientX, currentTarget } = e;
        const middle = currentTarget.offsetWidth / 2;
        if(clientX < middle) {
            setShowOptions(false);
            prevStory();
        } else {
            setShowOptions(false);
            nextStory();
        }
    }

    if(!viewStory) return null;

    const renderContent = () => {
        switch (currentStory.media_type) {
            case 'image':
                return (
                    <img src={currentStory.media_url} alt="Media" className='max-w-full max-h-screen object-contain' loading='lazy' decoding="async" onLoad={() => setLoaded(true)} style={{filter: loaded ? "none" : "blur(20px)", transition: "filter 0.3s ease-out"}} />
                );

            case 'video':
                return (
                    <video ref={videoRef} src={currentStory.media_url} className='min-h-screen pt-18' autoPlay onLoadedMetadata={() => {
                        const durationSec = Math.min(videoRef.current.duration, 60);
                        setVideoDuration(durationSec * 1000);
                        startProgress(0, durationSec * 1000);
                    }} onEnded={nextStory} />
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
    <div onClick={handleClick} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onTouchStart={handleMouseDown} onTouchEnd={handleMouseUp} className='fixed inset-0 h-full bg-black bg-opacity-90 z-110 flex items-center justify-center' style={{backgroundColor: currentStory.media_type === "text" ? currentStory.background_color : "#000000"}}>
      
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
                <img src={currentStory.user?.profile_picture} alt="Profile Picture" className='size-7 sm:size-8 rounded-full object-cover border border-white' loading='lazy' decoding="async" onLoad={() => setLoaded(true)} style={{filter: loaded ? "none" : "blur(20px)", transition: "filter 0.3s ease-out"}} />
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
            {
                showViewsModal && (
                    <StoryViewsModel
                        storyId={currentStory._id}
                        initialViewers={viewers}
                        onClose={(e) => {
                            e.stopPropagation();
                            closeViews();
                        }}
                    />
                )
            }
        </div>

        {
            isMyStory && (
                <div className='absolute bottom-6 left-0 right-0 flex justify-between items-center px-6'>
                    <button onClick={(e) => { e.stopPropagation(); openViews(); }} className='flex items-center gap-1 bg-black/50 text-white text-sm px-3 py-1.5 rounded-full backdrop-blur cursor-pointer hover:bg-black/70'>
                        <Eye className='w-5 h-5' />
                        <span>{viewCount}</span>
                    </button>
                    <div className="relative">
                        <EllipsisVertical onClick={toggleOptions} className='text-white cursor-pointer hover:text-gray-300' />
                        {
                            showOptions && (
                                <div className="absolute bottom-8 right-0 bg-white/90 text-gray-800 text-sm rounded-lg shadow-md backdrop-blur border border-gray-200">
                                    <button onClick={(e) => {e.stopPropagation(); setShowOptions(false); handleDeleteStory(currentStory._id);}} className="flex gap-1 w-full items-center px-3 py-2 hover:bg-gray-300 text-red-600 rounded-md transition-colors duration-150 cursor-pointer">
                                        <Trash2 className='w-4 h-4' /> Delete
                                    </button>
                                </div>
                            )
                        }
                    </div>
                </div>
            )
        }
    </div>
  )
}

export default StoryViewer
