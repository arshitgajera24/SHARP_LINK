import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, MessageCircle, LogOut } from 'lucide-react';
import { useSelector } from 'react-redux'
import MobileBottomNav from '../components/MobileBottomNav'
import { assets } from '../assets/assets.js';
import Loading from '../components/Loading.jsx';
import { useClerk } from '@clerk/clerk-react';

const Layout = () => {
  const user = useSelector((state) => state.user.value);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const pathName = location.pathname;
  const {signOut} = useClerk();

  return user ? (
    <div className='w-full flex h-screen'>
      {/* Sidebar for md+ screens */}
      <aside className='hidden md:flex'>
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      </aside>

      {/* Main area */}
      <div className='flex-1 flex flex-col bg-slate-50 max-h-screen'>
        {/* TOP BAR (mobile & tablet) */}
        <header className="w-full md:hidden flex items-center justify-between px-4 py-2 border-b bg-white">
          <div className="flex items-center gap-3">
            <img src={assets.link_navbar_logo_removebg} alt="Logo" className="h-8 cursor-pointer" onClick={() => navigate("/")} />
          </div>

          <div className="flex items-center gap-2">
            {/* messages icon only */}
            <button className="p-1" onClick={() => navigate("/messages")}>
              <MessageCircle className='w-6 h-6 text-gray-700' />
            </button>
            {
              pathName === "/profile"
              && (
                <LogOut onClick={signOut} className='w-5.5 text-black hover:text-gray-700 hover:scale-120 transition cursor-pointer' />
              )
            }
          </div>
        </header>

        {/* CONTENT */}
        <main className='flex-1 flex flex-col xl:overflow-y-auto overflow-y-clip'>
          <Outlet />
        </main>

        {/* Bottom navigation for mobile */}
        <MobileBottomNav />
      </div>

      {/* Mobile drawer: render Sidebar as an absolute panel when sidebarOpen (optional) */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white border-r">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          </div>
        </div>
      )}
    </div>
  ) : (
    <Loading />
  )
}

export default Layout
