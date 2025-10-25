import { useAuth, useUser } from '@clerk/clerk-react';
import React, { useEffect, useState } from 'react'
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import Loading from '../components/Loading.jsx';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

const Notifications = () => {

    const { user } = useUser();
    const { getToken } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchAllNotifications = async () => {
        try {
            setLoading(true);
            if (!user) return;

            const token = await getToken();
            const {data} = await api.get("/api/notifications/get", {
                headers: { 
                    Authorization: `Bearer ${token}` 
                },
            });

            if (data.success) 
            {
                setNotifications(data.notifications);
            }
            else 
            {
                toast.error(data.message);
            }
        } catch (error) {
            console.log(error.message);
            toast.error(error.message)
        }
        setLoading(false);
    }

    const handleDeleteNotification = async (notificationId) => {
        if(!notificationId) return;
        const loadingId = toast.loading("Deleting...");
        try {
            const token = await getToken();
            const {data} = await api.delete(`/api/notifications/delete/${notificationId}`, {
                headers: { 
                    Authorization: `Bearer ${token}` 
                },
            });

            if (data.success) 
            {
                setNotifications(prev => prev.filter(n => n._id !== notificationId));
                toast.success(data.message, { id: loadingId });
            }
            else 
            {
                toast.error(data.message, { id: loadingId });
            }
        } catch (error) {
            console.log(error.message);
            toast.error(error.message, { id: loadingId })
        }
    }

    useEffect(() => {
        fetchAllNotifications();
    }, [user, getToken]);

    if(loading) return <Loading />

  return (
    <div className="w-full max-w-5xl mx-auto mt-6 p-4">
        <h1 className="text-3xl font-bold mb-6">Notifications</h1>
            <div className="flex flex-col gap-4">
                { notifications.length === 0 && 
                    <p className="text-gray-500 text-center">No Notifications Yet 🤷‍♂️</p>
                }

            {
                notifications.map((n) => {
                    const fromUser = n.from_user_id;

                    return (
                        <div onClick={() => navigate(n.reference_id ? `/post/${n.reference_id}` : `/profile/${fromUser._id}`)} key={n._id} className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition cursor-pointer">
                            
                            <div className="flex items-center gap-3 justify-center">
                                <img onClick={(e) => {e.stopPropagation(); navigate(`/profile/${fromUser._id}`);}} src={fromUser.profile_picture || "/link_tab_icon-removebg.webp"} alt={fromUser.username} className="w-10 h-10 rounded-full object-cover mt-1 cursor-pointer" />
                            
                                <div className="flex flex-col justify-between">
                                    <div className="flex gap-1">
                                        <span onClick={(e) => {e.stopPropagation(); navigate(`/profile/${fromUser._id}`);}} className="font-semibold text-sm cursor-pointer">@{fromUser.username}</span>
                                        <p className="text-sm">{n.message}</p>
                                    </div>
                                    <span className="text-xs text-gray-500">{moment(n.createdAt).fromNow()}</span>
                                </div>
                            </div>
                            <div className='flex gap-1'>
                                {
                                    n.reference_preview && (
                                        <img src={n.reference_preview} alt="post-preview" className="w-10 h-10 object-cover rounded ml-4" />
                                    )
                                }
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteNotification(n._id) }} className="p-2 rounded-full hover:bg-gray-100 text-red-600 cursor-pointer" title="Delete comment">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        
                    );
                })
            }
        </div>
    </div>
  )
}

export default Notifications
