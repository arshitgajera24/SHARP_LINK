import { BadgeCheck, Heart, MessageCircle, Send } from 'lucide-react'
import moment from 'moment'
import React, { useState } from 'react'
import { dummyUserData } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '@clerk/clerk-react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

const PostCard = ({post}) => {

    const [likes, setLikes] = useState(post.likes_count);
    const [showHeart, setShowHeart] = useState(false);

    const { getToken } = useAuth();
    const navigate = useNavigate();
    const currentUser = useSelector((state) => state.user.value);
    const postWithHashtags = post.content.replace(/(#\w+)/g, '<span class="text-indigo-600">$1</span>')

    const handleLike = async () => {

        const alreadyLiked = likes.includes(currentUser._id);
        if (!alreadyLiked)
        {
            setShowHeart(true);
            setTimeout(() => setShowHeart(false), 1000)
        }

        try {
            const {data} = await api.post(`/api/post/like`, {postId: post._id}, {
                headers: {
                    Authorization: `Bearer ${await getToken()}`
                }
            })

            if(data.success)
            {
                setLikes(prev => {
                    if(prev.includes(currentUser._id))
                    {
                        return prev.filter(id => id !== currentUser._id)
                    }
                    else
                    {
                        return [...prev, currentUser._id]
                    }
                })
            }
            else
            {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

  return (
    <div className='bg-white rounded-xl shadow p-4 space-y-4 w-full max-w-2xl'>
        
        {/* User Info */}
        <div onClick={() => navigate(`/profile/${post.user._id}`)} className='inline-flex items-center gap-3 cursor-pointer'>
            <img src={post.user.profile_picture} alt="Profile Picture" className='w-10 h-10 rounded-full shadow' />
            <div>
                <div className='flex items-center space-x-1'>
                    <span>{post.user.full_name}</span>
                    <BadgeCheck className='w-4 h-4 text-blue-500' />
                </div>
                <div className='text-gray-500 text-sm'>@{post.user.username} • {moment(post.createdAt).fromNow()}</div>
            </div>
        </div>

        {/* Content */}
        {
            post.content && <div className='text-gray-800 text-sm whitespace-pre-line' dangerouslySetInnerHTML={{__html: postWithHashtags}} />
        }

        {/* Images */}
        <div className='relative grid grid-cols-2 gap-2' onDoubleClick={handleLike}>
            {
                post.image_urls.map((img, index) => (
                    <img src={img} key={index} alt="Post Images" className={`w-full h-48 object-cover rounded-lg ${post.image_urls.length === 1 && "col-span-2 h-auto"}`} />
                ))
            }

            {/* Heart Animation */}
            {
                showHeart && (
                    <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                        <svg className='w-24 h-24 animate-heart-pop' viewBox="0 0 24 24">
                        <defs>
                            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{stopColor:'#ec4899', stopOpacity:1}} />
                            <stop offset="50%" style={{stopColor:'#ef4444', stopOpacity:1}} />
                            <stop offset="100%" style={{stopColor:'#8b5cf6', stopOpacity:1}} />
                            </linearGradient>
                        </defs>
                        <path fill="url(#grad1)" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                    </div>
                )
            }
        </div>

        {/* Actions */}
        <div className='flex items-center gap-4 text-gray-600 text-sm pt-2 border-t border-gray-300'>
            <div className='flex items-center gap-1'>
                <Heart className={`w-4 h-4 cursor-pointer ${likes.includes(currentUser._id) && "text-red-500 fill-red-500"}`} onClick={handleLike}/>
                <span>{likes.length}</span>
            </div>

            <div className='flex items-center gap-1'>
                <MessageCircle className='w-4 h-4' />
                <span>{12}</span>
            </div>

            <div className='flex items-center gap-1'>
                <Send className='w-4 h-4' />
                <span>{7}</span>
            </div>
        </div>
    </div>
  )
}

export default PostCard
