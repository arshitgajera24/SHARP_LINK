import { useAuth } from '@clerk/clerk-react';
import { ArrowLeft, Sparkle, TextIcon, Upload } from 'lucide-react';
import React, { useState } from 'react'
import toast from 'react-hot-toast';
import api from '../api/axios.js';

const StoryModel = ({setShowModel, fetchStories}) => {

    const bgColors = ["#5F27CD", "#FF6B6B", "#FFB800", "#1DD1A1", "#48DBFB", "#FF9FF3", "#00C851", "#FF8800", "#2E86DE", "#F368E0", "#10AC84", "#F8C291", "#6D214F"];

    const {getToken} = useAuth();

    const [mode, setMode] = useState("text");
    const [background, setBackground] = useState(bgColors[0]);
    const [text, setText] = useState("");
    const [media, setMedia] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const MAX_VIDEO_DURATION_SEC = 60;
    const MAX_VIDEO_SIZE_MB = 50;

    const handleMediaUpload = (e) => {
        const file = e.target.files?.[0];
        if(file)
        {
            if(file.type.startsWith("video"))
            {
                if(file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024)
                {
                    toast.error(`Video Size cannot exceed ${MAX_VIDEO_SIZE_MB} MB`);
                    setMedia(null)
                    setPreviewUrl(null)
                    return;
                }
                const video = document.createElement("video");
                video.preload = "metadata";
                video.onloadedmetadata = () => {
                    window.URL.revokeObjectURL(video.src);
                    if(video.duration > MAX_VIDEO_DURATION_SEC)
                    {
                        toast.error("Video Duration cannot exceed 1 Minute");
                        setMedia(null)
                        setPreviewUrl(null)
                    }
                    else
                    {
                        setMedia(file);
                        setPreviewUrl(URL.createObjectURL(file));
                        setText("");
                        setMode("media")
                        setBackground("");
                    }
                }
                video.src = URL.createObjectURL(file)
            }
            else if(file.type.startsWith("image"))
            {
                setMedia(file);
                setPreviewUrl(URL.createObjectURL(file));
                setText("");
                setMode("media")
                setBackground("");
            }
        }
    }

    const handleCreateStory = async () => {
        const media_type = mode === "media" ? media?.type.startsWith("image") ? "image" : "video" : "text";

        if(media_type === "text" && !text)
        {
            toast.error("Please Enter Some Text")
            throw new Error("Please Enter Some Text")
        }

        let formData = new FormData();
        formData.append("content", text);
        formData.append("media_type", media_type);
        formData.append("media", media);
        formData.append("background_color", background);

        const token = await getToken();
        try {
            const {data} = await api.post("/api/story/create", formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if(data.success)
            {
                setShowModel(false)
                toast.success(data.message);
                fetchStories();
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
    <div className='fixed inset-0 z-110 min-h-screen bg-black/80 backdrop-blur text-white flex items-center justify-center p-4'>
        <div className='w-full max-w-md'>
            <div className='text-center mb-4 flex items-center justify-between'>
                <button onClick={() => setShowModel(false)} className='text-white p-2 cursor-pointer'>
                    <ArrowLeft />
                </button>
                <h2 className='text-lg font-semibold'>Create Story</h2>
                <span className='w-10'></span>
            </div>

            <div className='rounded-lg h-96 flex items-center justify-center relative' style={{backgroundColor: background}}>
                {
                    mode === "text" && (
                        <textarea className='bg-transparent text-white w-full h-full p-6 text-lg resize-none focus:outline-none' placeholder="What's in Your Mind?" onChange={(e) => setText(e.target.value)} value={text} />
                    )
                }
                {
                    mode === "media" && previewUrl && (
                        media?.type.startsWith("image")
                        ?   <img src={previewUrl} alt="Story Image" className='object-contain max-h-full' />
                        :   <video src={previewUrl} className='object-contain max-h-full' autoPlay loop playsInline />
                    )
                }
            </div>

            <div className='flex mt-4 gap-2'>
                {
                    bgColors.map((color) => (
                        <button key={color} className='w-6 h-6 rounded-full ring cursor-pointer' style={{backgroundColor: color}} onClick={() => setBackground(color)} />
                    ))
                }
            </div>

            <div className='flex gap-2 mt-4'>
                <button onClick={() => {setMode("text"); setMedia(null); setPreviewUrl(null);}} className={`flex-1 flex items-center justify-center gap-2 p-2 rounded cursor-pointer ${mode === "text" ? "bg-white text-black" : "bg-zinc-800"}`}>
                    <TextIcon size={18} /> Text
                </button>
                <label className={`flex-1 flex items-center justify-center gap-2 p-2 rounded cursor-pointer ${mode === "media" ? "bg-white text-black" : "bg-zinc-800"}`}>
                    <input onChange={handleMediaUpload} type="file" accept='image/*, video/*' className='hidden' />
                    <Upload size={18} /> Photo/Video
                </label>
            </div>

            <button onClick={() => toast.promise(handleCreateStory(), {loading: "Saving..."})} className='flex items-center justify-center gap-2 text-white py-3 mt-4 w-full rounded bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition cursor-pointer'>
                <Sparkle size={18} /> Create Story
            </button>
        </div>
    </div>
  )
}

export default StoryModel
