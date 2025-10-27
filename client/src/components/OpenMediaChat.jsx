import { ArrowLeft } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import Loading from './Loading';

const OpenMediaChat = ({setShowMedia, showMedia}) => {

    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, []);

  return (
    <div className='fixed inset-0 z-[9999] bg-black/90 text-white flex flex-col items-center justify-center p-4 transition-opacity duration-300'>
        <div className='w-full max-w-md flex flex-col'>
            <div className='flex items-center justify-between mb-4'>
                <button onClick={() => setShowMedia(null)} className='text-white p-2 cursor-pointer'>
                    <ArrowLeft />
                </button>
                <span className='w-10'></span>
            </div>

            <div className='relative w-full h-[80vh] flex items-center justify-center bg-black rounded-lg overflow-hidden'>
                {
                    !loaded && <Loading />
                }
                {
                    showMedia && <img src={showMedia} alt="Chat Media" className={`object-contain max-h-full max-w-full transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`} decoding="async" onLoad={() => setLoaded(true)} />
                }
            </div>
        </div>
    </div>
  )
}

export default OpenMediaChat
