
const Loading = ({height = '100vh'}) => {
  return (
    <div  style={{height}} className="flex items-center justify-center h-screen">
      <svg className="ip" viewBox="0 0 256 128" width="256" height="128" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5F27CD" />
            <stop offset="33%" stopColor="#8E2DE2" />
            <stop offset="67%" stopColor="#9B51E0" />
            <stop offset="100%" stopColor="#BB6BD9" />
          </linearGradient>

          <linearGradient id="grad2" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="#BB6BD9" />
            <stop offset="33%" stopColor="#9B51E0" />
            <stop offset="67%" stopColor="#8E2DE2" />
            <stop offset="100%" stopColor="#5F27CD" />
          </linearGradient>
        </defs>
        <g fill="none" strokeLinecap="round" strokeWidth="16">
          <g className="ip__track" stroke="#ddd">
            <path d="M8,64s0-56,60-56,60,112,120,112,60-56,60-56" />
            <path d="M248,64s0-56-60-56-60,112-120,112S8,64,8,64" />
          </g>
          <g strokeDasharray="180 656">
            <path className="ip__worm1" stroke="url(#grad1)" strokeDashoffset="0" d="M8,64s0-56,60-56,60,112,120,112,60-56,60-56" />
            <path className="ip__worm2" stroke="url(#grad2)" strokeDashoffset="358" d="M248,64s0-56-60-56-60,112-120,112S8,64,8,64" />
          </g>
        </g>
      </svg>
    </div>
  )
}

export default Loading
