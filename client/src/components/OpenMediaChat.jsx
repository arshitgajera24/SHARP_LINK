import { ArrowLeft } from 'lucide-react'
import React, { useState } from 'react'

const OpenMediaChat = ({setShowMedia, showMedia}) => {

  return (
    <div className='fixed inset-0 z-110 bg-black/70 backdrop-blur-sm text-white flex items-center justify-center p-4'>
        <div className='w-full max-w-md flex flex-col'>
            <div className='flex items-center justify-between mb-4'>
                <button onClick={() => setShowMedia(null)} className='text-white p-2 cursor-pointer'>
                    <ArrowLeft />
                </button>
                <span className='w-10'></span>
            </div>

            <div className='rounded-lg h-[80vh] flex items-center justify-center bg-black'>
                {
                    showMedia && <img src={showMedia} alt="Chat Media" className='object-contain max-h-full max-w-full transition-all' loading='lazy' decoding="async" />
                }
            </div>
        </div>
    </div>
  )
}

export default OpenMediaChat
