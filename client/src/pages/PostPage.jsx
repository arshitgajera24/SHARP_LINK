import { useAuth } from '@clerk/clerk-react';
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios.js';
import Loading from '../components/Loading.jsx';
import PostCard from '../components/PostCard.jsx';
import { ArrowLeft } from 'lucide-react';

const PostPage = () => {

    const { postId } = useParams();
    const { getToken } = useAuth();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();    

    const fetchPost = async () => {
        try {
                setLoading(true);
                const token = await getToken();
                const { data } = await api.get(`/api/post/${postId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
            if (data.success)
            {
                setPost(data.post);
            } 
            else 
            {
                toast.error(data.message);
                navigate(-1);
            }
        } catch (err) {
            toast.error(err.message);
            navigate(-1);
        }
        setLoading(false)
    };

    useEffect(() => {
        fetchPost();
    }, [postId]);

    if (loading) return <Loading />;

  return (
    <div>
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex justify-center">
            <div className="w-full max-w-2xl">
                {
                    post 
                    ?   (
                        <div className="flex flex-col gap-3 px-4 sm:px-6 py-2 max-w-2xl mx-auto mt-3">
                            <button onClick={() => navigate(-1)} className="flex justify-start items-center gap-2 max-w-20 cursor-pointer text-gray-600 hover:text-indigo-800 transition duration-200">
                                <ArrowLeft className="w-5 h-5" />
                                <span className="text-md font-medium hidden sm:inline">Back</span>
                            </button>
                            <PostCard post={post} />
                        </div>
                    )
                    :   <div className="flex items-center justify-center h-screen">
                            <p className="text-gray-500">Post not found</p>
                        </div>
                }
            </div>
        </div>
    </div>
  )
}

export default PostPage
