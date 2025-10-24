import { BadgeCheck, Heart, MessageCircle, Send, SendHorizonal, X } from 'lucide-react'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { dummyUserData } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@clerk/clerk-react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { addMessage } from '../features/messages/messagesSlice.js';

const PostCard = ({post}) => {

    const [likes, setLikes] = useState(post.likes_count);
    const [showHeart, setShowHeart] = useState(false);
    const [showComments, setShowComments] = useState(false)
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState("")
    const [loadingComments, setLoadingComments] = useState(false)
    const [showShare, setShowShare] = useState(false);

    const [connectionsList, setConnectionsList] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);

    const { getToken } = useAuth();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const currentUser = useSelector((state) => state.user.value);
    const connections = useSelector((state) => state.connections.connections);
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

    const loadComments = async () => {
        try {
            const {data} = await api.get(`/api/comment/${post._id}`, {
                headers: {
                    Authorization: `Bearer ${await getToken()}`
                }
            })
            
            if(data.success) 
            {
                setComments(data.comments);
            }
            else
            {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const openComments = async () => {
        setShowComments(true);
        setLoadingComments(true);
        loadComments();
        setLoadingComments(false);
    }

    const handleAddComment = async (e) => {
        e.preventDefault();
        if(!newComment.trim()) return;

        try {
            const {data} = await api.post("/api/comment/add", {
                postId: post._id,
                text: newComment,
            }, {
                headers: {
                    Authorization: `Bearer ${await getToken()}`
                }
            })

            if(data.success)
            {
                setComments(prev => [data.comments, ...prev]);
                setNewComment("");
            }
            else
            {
                toast.error(error.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(() => {
        loadComments();
    }, [comments, currentUser])

    const toggleSelectUser = (userId) => {
        setSelectedUsers((prev) =>
        prev.includes(userId)
            ? prev.filter((id) => id !== userId)
            : [...prev, userId]
        );
    };

    const handleSend = async () => {
        if (selectedUsers.length === 0) return;

        try {
            const token = await getToken();
            let response;

            for (const id of selectedUsers) {
                response = await api.post("/api/message/send",
                    {
                        to_user_id: id,
                        text: post.content || "",
                        message_type: post.image_urls.length ? "post" : "text",
                        media_url: post.image_urls[0] || "",
                        post_id: post._id,
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
            }

            if(response.data.success)
            {
                toast.success("Post Sent Successfully!");
                dispatch(addMessage({
                    ...response.data.message,
                    from_user_id: currentUser,
                    to_user_id: selectedUsers[0], // loop if multiple
                }));
            }
            else
            {
                toast.error(response.data.message)
            }
            setShowShare(false);
        } catch (error) {
            toast.error(error.message);
        }
    };    

    useEffect(() => {
        if (currentUser) {
            setConnectionsList(connections);
        }
        setSelectedUsers([])
    }, [connections, currentUser, showShare]);

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

            <div className='flex items-center gap-1 cursor-pointer' onClick={openComments}>
                <MessageCircle className='w-4 h-4' />
                <span>{comments.length}</span>
            </div>

            <div className='flex items-center gap-1 cursor-pointer' onClick={() => setShowShare(true)}>
                <Send className='w-4 h-4' />
            </div>
        </div>

        {/* Comments Drawer */}
        {
            showComments && (
                <div className='fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 mb-12'>
                    <div className='bg-white w-full md:w-[500px] h-[80vh] md:h-[70vh] rounded-t-2xl md:rounded-2xl flex flex-col'>
                        {/* Header */}
                        <div className='flex justify-between items-center p-4 border-b'>
                            <h2 className='font-semibold text-lg'>Comments</h2>
                            <X className='cursor-pointer' onClick={() => setShowComments(false)} />
                        </div>

                        {/* Comments List */}
                        <div className='flex-1 overflow-y-auto p-4 space-y-4'>
                            {
                                loadingComments
                                ?   (
                                    <p className='text-center text-gray-500'>Loading comments...</p>
                                ) : 
                                    comments.length > 0
                                    ?   (
                                        comments.map((comment, index) => (
                                            <div key={index} className='flex gap-3'>
                                                <img src={comment?.user?.profile_picture} alt="User" className='w-9 h-9 rounded-full' />
                                                <div className='flex flex-col'>
                                                    <div className='flex items-center gap-2'>
                                                        <span className='font-semibold text-sm'>{comment?.user?.full_name}</span>
                                                        <span className='text-xs text-gray-400'>@{comment?.user?.username}</span>
                                                        <span className='text-xs text-gray-400'>• {moment(comment?.createdAt).fromNow()}</span>
                                                    </div>
                                                    <p className='text-sm text-gray-700'>{comment?.text}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className='text-center text-gray-500'>No comments yet. Be the First!</p>
                                    )
                            }
                        </div>
                        <form onSubmit={handleAddComment} className='flex items-center gap-2 p-3 border-t bg-gray-50'>
                            <input type="text" placeholder="Add a Comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className='flex-1 bg-white border rounded-full px-4 py-2 text-sm focus:outline-none'/>
                            <button type="submit" className='bg-indigo-600 text-white p-2 rounded-full font-semibold text-sm cursor-pointer'><SendHorizonal /></button>
                        </form>
                    </div>
                </div>
            )
        }

        {/* Share Popup Component */}
        {
            showShare && (
                <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 mb-12">
                    <div className="bg-white w-full md:w-[500px] h-[70vh] rounded-t-2xl md:rounded-2xl flex flex-col">
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="font-semibold text-lg">Share Post</h2>
                            <X className="cursor-pointer" onClick={() => setShowShare(false)} />
                        </div>

                        {/* Connections List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {
                                connectionsList.length > 0
                                ?   (
                                    connectionsList.map((u) => (
                                        <div key={u._id} onClick={() => toggleSelectUser(u._id)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 ${selectedUsers.includes(u._id) ? "bg-indigo-50" : "" }`}>
                                            <img src={u.profile_picture} alt="profile" className="w-10 h-10 rounded-full"/>
                                            <div className="flex-1">
                                                <p className="font-medium">{u.full_name}</p>
                                                <p className="text-sm text-gray-500">@{u.username}</p>
                                            </div>
                                            {
                                                selectedUsers.includes(u._id) && (
                                                    <div className="text-indigo-600 font-bold">✓</div>
                                                )
                                            }
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-400 text-center">No connections found</p>
                                )
                            }
                        </div>

                        {/* Send Button */}
                        {
                            selectedUsers.length > 0 && (
                                <div className="p-4 border-t bg-white shadow flex justify-end animate-slide-up">
                                    <button onClick={handleSend} className="bg-indigo-600 text-white px-6 py-2 rounded-full flex items-center gap-2 cursor-pointer">
                                        Send <SendHorizonal />
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

export default PostCard
