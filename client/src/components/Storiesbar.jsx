import React, { useEffect, useState } from 'react'
import { Plus } from 'lucide-react';
import moment from "moment"
import StoryModel from './StoryModel';
import StoryViewer from './StoryViewer';
import { useAuth, useUser } from '@clerk/clerk-react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import StoryViewsModel from './StoryViewsModel.jsx';

const Storiesbar = () => {

    const {getToken} = useAuth();
    const [stories, setStories] = useState([]);
    const [showModel, setShowModel] = useState(false);
    const [viewStory, setViewStory] = useState(null);
    const [showViewsModal, setShowViewsModal] = useState(false);
    const [selectedStoryId, setSelectedStoryId] = useState(null);

    const fetchStories = async () => {
        try {
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
        }
    }

    useEffect(() => {
        fetchStories();
    }, [])

  return (
    <div className="w-full sm:w-[calc(100vw-240px)] lg:max-w-2xl mx-auto overflow-x-auto no-scrollbar px-4 py-2">
        <div className="flex items-center gap-4">
            {/* Add Story */}
            <div onClick={() => setShowModel(true)} className="flex flex-col items-center cursor-pointer group">
                <div className="relative size-16 sm:size-18 md:size-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 p-[2px]">
                    <div className="bg-white rounded-full size-full flex items-center justify-center">
                    <div className="size-12 sm:size-14 md:size-16 bg-indigo-500 rounded-full flex items-center justify-center transition-transform group-active:scale-90">
                        <Plus className="w-6 h-6 text-white" />
                    </div>
                    </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">Your Story</p>
            </div>

            {/* Stories Cards */}
            {
                stories.map((story, index) => {

                    const totalStories = story.stories.length;
                    const angle = 360 / totalStories;

                    const gradientSegments = story.stories.map((_, i) => {
                        const start = i * angle;
                        const end = (i + 1) * angle;
                        const colors = ['#5f27cd', '#a29bfe', '#6c5ce7', '#00b894', '#fd79a8'];
                        const color = colors[i % colors.length];
                        return `${color} ${start}deg ${end}deg`;
                    }).join(', ');

                    return (
                        <div key={index} onClick={() => {setSelectedStoryId(story.stories[0]._id); setViewStory(story.stories);}} className="flex flex-col items-center cursor-pointer group">
                            <div className="relative size-16 sm:size-18 md:size-20 rounded-full p-[2px]" style={{ background: `conic-gradient(${gradientSegments})` }}>
                                <div className="bg-white rounded-full size-full flex items-center justify-center">
                                    <img src={story.user.profile_picture} alt={story.user.full_name} className="size-14 sm:size-16 md:size-18 rounded-full object-cover border-2 border-white transition-transform duration-300 group-hover:scale-105"/>
                                </div>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-700 mt-1 truncate max-w-[70px] text-center">
                                {story.user.full_name.split(" ")[0]}
                            </p>
                        </div>
                    )
                })
            }
        </div>

        {/* Add Story Model */}
        {
            showModel && <StoryModel setShowModel={setShowModel} fetchStories={fetchStories} />
        }
        {/* View Story Model */}
        {
            viewStory && <StoryViewer viewStory={viewStory} setViewStory={setViewStory} setSelectedStoryId={setSelectedStoryId} onOpenViews={() => setShowViewsModal(true)} />
        }
        {
            showViewsModal && (
                <StoryViewsModel
                    storyId={selectedStoryId}
                    onClose={() => setShowViewsModal(false)}
                />
            )
        }
    </div>
  )
}

export default Storiesbar
