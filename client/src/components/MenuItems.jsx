import React from 'react'
import { menuItemsData } from '../assets/assets.js'
import { NavLink } from 'react-router-dom'

const MenuItems = ({setSidebarOpen, counts}) => {

  const getBadgeCount = (label) => {
    if (label === "Notifications") return counts.unreadNotifications;
    if (label === "Messages") return counts.unreadMessages;
    if (label === "Connections") return counts.pendingConnections;
    return 0;
  };

  return (
    <div className='px-6 text-gray-600 space-y-1 font-medium'>
      {
        menuItemsData.map(({to, label, Icon}) => {
          const badgeCount = getBadgeCount(label);          

            return ( 
              <NavLink key={to} to={to} end={to === "/"} onClick={() => setSidebarOpen(false)} className={({isActive}) => `relative px-3.5 py-2 flex items-center gap-3 rounded-xl ${isActive ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'}`}>
                  <Icon className='w-5 h-5'/>
                  {label}
                  {badgeCount > 0 && (
                    <span className="absolute top-2 left-7 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
              </NavLink>
            )
        })
      }
    </div>
  )
}

export default MenuItems
