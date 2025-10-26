import { useAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react'
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

const StoryViewsModel = ({ storyId, initialViewers, onClose }) => {

    const [viewers, setViewers] = useState(initialViewers);
    const [loaded, setLoaded] = useState(false);
    const { getToken } = useAuth();
    const navigate = useNavigate();

    const fetchViewers = async () => {
        try {
            const token = await getToken();
            const { data } = await api.get(`/api/story/viewers/${storyId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success)
            {
                setViewers(data.viewers.sort((a,b) => new Date(b.viewedAt) - new Date(a.viewedAt)));
            }
            else
            {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    useEffect(() => {
        if (initialViewers.length === 0) {
            fetchViewers();
        }
    }, [storyId]);

    return (
        <div onClick={(e) => e.stopPropagation()} className="fixed inset-0 bg-black/70 backdrop-blur z-[999] flex items-center justify-center">
            <div className="bg-white rounded-lg w-full max-w-sm max-h-[80vh] overflow-y-auto p-4 relative">
                <button onClick={onClose} className="absolute top-3 right-3 cursor-pointer">
                    <X />
                </button>
                <h2 className="text-lg font-bold mb-4">Story Views</h2>
                {
                    viewers.length > 0
                    ?   (
                        viewers.map((view, index) => (
                            <div onClick={() => navigate(`/profile/${view.user._id}`)} key={index} className="flex items-center gap-3 mb-3 cursor-pointer">
                                <img src={view.user.profile_picture} alt={view.user.full_name} className="w-10 h-10 rounded-full object-cover" loading='lazy' decoding="async" onLoad={() => setLoaded(true)} style={{filter: loaded ? "none" : "blur(20px)", transition: "filter 0.3s ease-out"}} />
                                <div className="flex flex-col">
                                    <span className="font-medium">{view.user.full_name}</span>
                                    <span className="text-sm text-gray-500">
                                    {moment(view.viewedAt).fromNow()}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">No views yet</p>
                    )
                }
            </div>
        </div>
    )
}

export default StoryViewsModel
