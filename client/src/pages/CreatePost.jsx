import { useRef, useState } from 'react'
import { Image, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useAuth } from '@clerk/clerk-react';
import api from '../api/axios.js';
import { useNavigate } from 'react-router-dom';

const CreatePost = () => {

  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const mediaInputRef = useRef(null);

  const user = useSelector((state) => state.user.value);
  const {getToken} = useAuth();

  const handleSubmit = async () => {
    if(!images.length && !content)
    {
      toast.error("Post Content is Empty");
      return;
    }
    setLoading(true);

    const postType = video && content ? "text_with_video" : video ? "video" : images.length && content ? "text_with_image" : images.length ? "image" : "text";

      const formData = new FormData();
      formData.append("content", content);
      formData.append("post_type", postType);
      if(video) formData.append("video", video);
      images.map((image) => {
        formData.append("images", image);
      })

      await toast.promise(
        (async () => {
            const {data} = await api.post("/api/post/add", formData, {
              headers: {
                Authorization: `Bearer ${await getToken()}`,
              }
            })

            if(data.success)
            {
              navigate("/")
            }
            else 
            {
              console.log(data.message)
              throw new Error(data.message)
            }
        })(),
        {
          loading: "Uploading...", 
          success: <p>Post Uploaded Successfully</p>, 
          error: <p>Post Uploading Failed</p>
        }
      )

      
    setLoading(false)
  }


  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 to-white'>
      <div className='max-w-6xl mx-auto p-6'>

        {/* Title */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-slate-900 mb-2'>Create Post</h1>
          <p className='text-slate-600'>Share your Thoughts With The World</p>
        </div>

        {/* Form */}
        <div className='max-w-xl bg-white p-4 sm:p-8 sm:pb-3 rounded-xl shadow-md space-y-4 mb-12'>
          {/* Header */}
          <div className='flex items-center gap-3'>
            <img src={user.profile_picture} alt="Profile Picture" className='w-12 h-12 rounded-full shadow' loading='lazy' decoding="async" onLoad={() => setLoaded(true)} style={{filter: loaded ? "none" : "blur(20px)", transition: "filter 0.3s ease-out"}} />
            <div>
              <h2 className='font-semibold'>{user.full_name}</h2>
              <p className='text-sm text-gray-500'>@{user.username}</p>
            </div>
          </div>

          {/* TextArea */}
          <textarea onChange={(e) => setContent(e.target.value)} value={content} className='w-full resize-none max-h-20 mt-4 text-sm outline-none placeholder-gray-400' placeholder="What's Happening?" />

          {/* Images */}
          {
            video ? (
              <div className='relative group'>
                <video autoPlay loop className='w-full rounded-md mt-4'>
                  <source src={URL.createObjectURL(video)} type={video.type} />
                  Your browser does not support the video tag.
                </video>
                <div onClick={() => {setVideo(null); if(mediaInputRef.current) mediaInputRef.current.value = null;}} className='absolute hidden group-hover:flex justify-center items-center top-0 right-0 bottom-0 left-0 bg-black/40 rounded-md cursor-pointer'>
                  <X className='w-6 h-6 text-white'/>
                </div>
              </div>
            ) : (
              images.length > 0 && (
                <div className='flex flex-wrap gap-2 mt-4'>
                {
                  images.map((image, index) => (
                    <div key={index} className='relative group'>
                      <img src={URL.createObjectURL(image)} alt="Posting Image" className='h-20 rounded-md' loading='lazy' decoding="async" onLoad={() => setLoaded(true)} style={{filter: loaded ? "none" : "blur(20px)", transition: "filter 0.3s ease-out"}} />
                      <div onClick={() => {setImages(images.filter((_, i) => i !== index)); if(mediaInputRef.current) mediaInputRef.current.value = null;}} className='absolute hidden group-hover:flex justify-center items-center top-0 right-0 bottom-0 left-0 bg-black/40 rounded-md cursor-pointer'>
                        <X className='w-6 h-6 text-white'/>
                      </div>
                    </div>
                  ))
                }
                </div>
              )
            )
          }

          {/* Bottom Bar */}
          <div className='flex items-center justify-between pt-3 border-t border-gray-300'>
            <label htmlFor="media" className='flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition cursor-pointer'>
              <Image className='size-6' />
            </label>
            <input type="file" id="media" accept='image/*,video/*' ref={mediaInputRef} hidden multiple onChange={(e) => {
                const selectedFiles = Array.from(e.target.files);
                const videoFile = selectedFiles.find(f => f.type.startsWith("video/"));

                if(videoFile) {
                  setVideo(videoFile);
                  setImages([]);
                }
                else
                {
                  const totalFiles = images.length + selectedFiles.length;

                  if(totalFiles > 4)
                  {
                    toast.error("You can upload a maximum of 4 images per post");
                    return;
                  }
                  setImages([...images, ...selectedFiles]);
                  setVideo(null)
                }                
              }
              
            }/>
            <input type="file" id="images" accept='video/*' hidden onChange={(e) => {
              const file = e.target.files[0];
              if(file)
              {
                setImages([]);
                setVideo(file);
              }
            }} />
            <button disabled={loading} onClick={handleSubmit} className='text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition text-white fron-medium px-8 py-2 rounded-md cursor-pointer'>
              Publish Post
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreatePost
