import { ArrowLeft } from 'lucide-react'
import { createPortal } from 'react-dom'
import React, { useEffect, useState } from 'react'

const OpenMediaChat = ({setShowMedia, showMedia}) => {

    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, []);

    useEffect(() => {
        setLoaded(false);
    }, [showMedia]);

  const modal = (
    <div className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowMedia(null); } }}>
        <div className='relative w-full max-w-3xl flex flex-col items-center' onClick={(e) => e.stopPropagation()}>
            <div className='flex items-center justify-between mb-4 cursor-pointer'>
                <button onClick={() => setShowMedia(null)} className='absolute top-3 left-3 bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md z-50'>
                    <ArrowLeft className="text-white w-6 h-6" />
                </button>
                <span className='w-10'></span>
            </div>

            <div className='w-full max-h-[90vh] flex items-center justify-center bg-black rounded-lg overflow-hidden relative'>
                {
                    !loaded && (
                        <div className="absolute inset-0 flex items-center justify-center z-30">
                            <div className="w-10 h-10 border-4 border-white/40 border-t-white rounded-full animate-spin"></div>
                        </div>
                    )
                }
                {
                    showMedia && <img src={showMedia} alt="Chat Media" className={`w-auto h-auto max-h-[85vh] max-w-[100vw] object-contain transition-opacity duration-300`} onLoad={() => setLoaded(true)} draggable={false} />
                }
            </div>
        </div>
    </div>
  )

  return createPortal(modal, document.body);
}

export default OpenMediaChat
