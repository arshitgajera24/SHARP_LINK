import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react';
import StoryModel from './StoryModel';
import StoryViewer from './StoryViewer';
import { useAuth } from '@clerk/clerk-react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

const Storiesbar = () => {

    const {getToken} = useAuth();
    const currentUser = useSelector((state) => state.user.value);
    const [stories, setStories] = useState([]);
    const [showModel, setShowModel] = useState(false);
    const [viewStory, setViewStory] = useState(null);
    const [selectedStoryId, setSelectedStoryId] = useState(null);
    const [myStory, setMyStory] = useState(null);
    const [otherStories, setOtherStories] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchStories = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            const {data} = await api.get("/api/story/get", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if(data.success)
            {
                const grouped = data.stories.reduce((acc, story) => {
                    const userId = story.user._id;
                    if(!acc[userId])
                    {
                        acc[userId] = { user: story.user, stories: [] };
                    }
                    acc[userId].stories.push(story);
                    return acc;
                }, {})
                
                Object.values(grouped).forEach(userGroup => {
                    userGroup.stories.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                });

                const sortStories = Object.values(grouped).sort((a, b) => 
                    new Date(b.stories[b.stories.length - 1].createdAt) - new Date(a.stories[a.stories.length - 1].createdAt)
                );

                setStories(sortStories)
            }
            else
            {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false);
        }
    }

    const StorySkeleton = () => (
        <div className="flex flex-col items-center cursor-pointer animate-pulse">
            <div className="relative size-16 sm:size-18 md:size-20 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-400 opacity-50 flex items-center justify-center">
                <div className="size-14 sm:size-16 md:size-18 bg-gray-300 rounded-full"></div>
            </div>
            <div className="h-3 w-12 bg-gray-300 rounded mt-2" />
        </div>
    );

    useEffect(() => {
        fetchStories();
    }, [])

    useEffect(() => {
        fetchStories();
    }, [selectedStoryId]);

    useEffect(() => {
        const mine = stories.find((story) => story.user._id === currentUser?._id);
        const others = stories.filter((story) => story.user._id !== currentUser?._id);
        setMyStory(mine || null);
        setOtherStories(others);
    }, [stories, currentUser, selectedStoryId]);


  return (
    <div className={`w-full sm:w-[calc(100vw-240px)] lg:max-w-2xl overflow-x-auto no-scrollbar mx-auto px-4 py-2 min-h-[110px]`}>
        <div className={`flex items-center gap-4 min-w-full justify-start`}>

        {loading ? (
            // Show shimmer while stories are loading
            <>
                {[...Array(5)].map((_, i) => (
                    <StorySkeleton key={i} />
                ))}
            </>
        ) : (
            <>
                {/* My Story or Add Story */}
                {
                    !myStory ? (
                        <div onClick={() => setShowModel(true)} className="flex flex-col items-center cursor-pointer group">
                            <div className="relative size-16 sm:size-18 md:size-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 p-[2px]">
                                <div className="bg-white rounded-full size-full flex items-center justify-center">
                                    <div className="size-12 sm:size-14 md:size-16 bg-indigo-500 rounded-full flex items-center justify-center transition-transform group-active:scale-90">
                                        <Plus className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">Add Story</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center cursor-pointer group relative"
                            onClick={() => {
                                setSelectedStoryId(myStory.stories[0]._id);
                                setViewStory(myStory.stories);
                            }} >
                            <div className="relative size-16 sm:size-18 md:size-20 rounded-full p-[2px] bg-gradient-to-tr from-indigo-500 to-purple-600">
                                <div className="bg-white rounded-full size-full flex items-center justify-center relative">
                                    <img src={myStory.user.profile_picture} alt={myStory.user.full_name} className="size-14 sm:size-16 md:size-18 rounded-full object-cover border-2 border-white transition-transform duration-300 group-hover:scale-105" loading='lazy' decoding="async" onLoad={() => setLoaded(true)} style={{filter: loaded ? "none" : "blur(20px)", transition: "filter 0.3s ease-out"}} />
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        setShowModel(true);
                                    }} className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-1 shadow-md hover:bg-indigo-700 transition cursor-pointer">
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-700 mt-1 font-medium">Your Story</p>
                        </div>
                    )
                }

                {/* Other User's Stories */}
                {
                    otherStories.map((story, index) => {
                        const totalStories = story.stories.length;
                        const angle = 360 / totalStories;
                        const gap = totalStories === 1 ? 0 : 2;

                        const gradientSegments = story.stories.map((_, i) => {
                            const start = i * angle + gap;
                            const end = (i + 1) * angle - gap;
                            const colors = ['#5e35b1', '#9c27b0', '#7e57c2', '#673ab7', '#8e24aa', '#d500f9'];
                            const color = colors[i % colors.length];
                            return `${color} ${start}deg ${end}deg, transparent ${end}deg ${(i + 1) * angle}deg`;
                        }).join(', ');

                        return (
                            <div key={index} onClick={() => {
                                setSelectedStoryId(story.stories[0]._id);
                                setViewStory(story.stories);
                            }} className="flex flex-col items-center cursor-pointer group">
                                <div className="relative size-16 sm:size-18 md:size-20 rounded-full p-[2px]"
                                    style={{
                                        background: `conic-gradient(${gradientSegments})`,
                                        boxShadow: '0 0 6px rgba(0,0,0,0.3)',
                                    }} >
                                    <div className="bg-white rounded-full size-full flex items-center justify-center">
                                    <img src={story.user.profile_picture} alt={story.user.full_name} className="size-14 sm:size-16 md:size-18 rounded-full object-cover border-2 border-white transition-transform duration-300 group-hover:scale-105" loading='lazy' decoding="async" onLoad={() => setLoaded(true)} style={{filter: loaded ? "none" : "blur(20px)", transition: "filter 0.3s ease-out"}} />
                                    </div>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-700 mt-1 truncate max-w-[70px] text-center">
                                    {story.user.full_name.split(" ")[0]}
                                </p>
                            </div>
                        );
                    })
                }
            </>
        )}
        </div>

        {/* Modals */}
        {showModel && <StoryModel setShowModel={setShowModel} fetchStories={fetchStories} />}
        {
            viewStory && (
                <StoryViewer
                    viewStory={viewStory}
                    setViewStory={setViewStory}
                    setSelectedStoryId={setSelectedStoryId}
                />
            )
        }

        
    </div>
  );
};

export default Storiesbar
