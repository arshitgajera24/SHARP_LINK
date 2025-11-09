import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { MessageCircle, Heart } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux'
import MobileBottomNav from '../components/MobileBottomNav'
import { assets } from '../assets/assets.js';
import Loading from '../components/Loading.jsx';
import { useAuth, useClerk, UserButton } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { closeChat } from '../features/chat/chatUISlice.js';
import Chatbox from './Chatbox.jsx';

const Layout = () => {
  const user = useSelector((state) => state.user.value);
  const {getToken} = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const pathName = location.pathname;

  const { selectedUserId } = useSelector((state) => state.chatUI);
  const dispatch = useDispatch();

  const [counts, setCounts] = useState({
    unreadMessages: 0,
    unreadNotifications: 0,
    pendingConnections: 0,
  });

    const fetchActivitySummary = async () => {
      try {
        const token = await getToken();
        const { data } = await api.get("/api/user/summary", {
          headers: { 
            Authorization: `Bearer ${token}` 
          },
        });

        if (data.success)
        {
          setCounts(data.data);
        }
        else
        {
          toast.error(data.message)
        }
      } catch (err) {
        console.error("Error fetching activity summary:", err);
        toast.error(err.message)
      }
    };

    useEffect(() => {
      fetchActivitySummary();
      const interval = setInterval(fetchActivitySummary, 3000);
      return () => clearInterval(interval);
    }, [user, getToken])

  return user ? (
    <div className='w-full flex h-screen no-scrollbar overflow-x-hidden'>
      {/* Sidebar for md+ screens */}
      <aside className='hidden md:flex'>
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} counts={counts} />
      </aside>

      {/* Main area */}
      <div className='flex-1 flex flex-col bg-slate-50 max-h-full'>
        {/* TOP BAR (mobile & tablet) */}
        <header className={`w-full md:hidden flex items-center justify-between px-4 py-2 border-b bg-white ${pathName === "/messages" ? "hidden" : ""}`}>
          <div className="flex items-center gap-3">
            <img src={assets.link_navbar_logo_removebg} alt="Logo" className="h-8 cursor-pointer" onClick={() => navigate("/")} fetchPriority='high' decoding="async" onLoad={() => setLoaded(true)} style={{filter: loaded ? "none" : "blur(20px)", transition: "filter 0.3s ease-out"}} />
          </div>

          <div className="flex items-center gap-2">
            {/* messages icon only */}
            <button className="relative p-1 cursor-pointer" onClick={() => navigate("/notifications")}>
              <Heart className='w-6 h-6 text-gray-700' />
              {
                counts.unreadNotifications > 0 && (
                    <span className="absolute top-1.5 left-5 w-2 h-2 bg-red-500 rounded-full"></span>
                )
              }
            </button>
            <button className="relative p-1 cursor-pointer" onClick={() => navigate("/messages")}>
              <MessageCircle className='w-6 h-6 text-gray-700' />
              {
                counts.unreadMessages > 0 && (
                    <span className="absolute top-1.5 left-5 w-2 h-2 bg-red-500 rounded-full"></span>
                )
              }
            </button>
            {
              pathName === "/profile"
              && (
                  <UserButton className='w-5.5 hover:scale-120 transition cursor-pointer'/>
              )
            }
          </div>
        </header>

        {/* CONTENT */}
        <main className='relative flex-1 flex flex-col xl:overflow-y-auto md:overflow-y-auto'>
          <Outlet />
          {
            selectedUserId && (pathName === "/" || pathName.startsWith("/profile/")) && (
              <div className="fixed bottom-4 right-4 w-96 shadow-2xl rounded-2xl bg-white border border-gray-200 z-50">
                <Chatbox
                  selectedUserId={selectedUserId}
                  onBack={() => dispatch(closeChat())}
                />
              </div>
            )
          }
        </main>

        {/* Bottom navigation for mobile */}
        <MobileBottomNav counts={counts} />
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
