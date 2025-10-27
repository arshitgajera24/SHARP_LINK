import { ArrowLeft } from 'lucide-react'
import React, { useState } from 'react'

const OpenMediaChat = ({setShowMedia, showMedia}) => {

    const [loaded, setLoaded] = useState(false);

  return (
    <div className='fixed inset-0 z-110 min-h-screen bg-black/50 backdrop-blur text-white flex items-center justify-center p-4'>
        <div className='w-full max-w-md'>
            <div className='text-center mb-4 flex items-center justify-between'>
                <button onClick={() => setShowMedia(null)} className='text-white p-2 cursor-pointer'>
                    <ArrowLeft />
                </button>
                <span className='w-10'></span>
            </div>

            <div className='rounded-lg h-140 sm:h-140 md:h-160 flex items-center justify-center relative bg-black'>
                {
                    showMedia && <img src={showMedia} alt="Chat Media" className='object-contain max-h-full' loading='lazy' decoding="async" onLoad={() => setLoaded(true)} style={{filter: loaded ? "none" : "blur(20px)", transition: "filter 0.3s ease-out"}} />
                }
            </div>
        </div>
    </div>
  )
}

export default OpenMediaChat
