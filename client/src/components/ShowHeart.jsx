import React from 'react'

const ShowHeart = () => {
  return (
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

export default ShowHeart
