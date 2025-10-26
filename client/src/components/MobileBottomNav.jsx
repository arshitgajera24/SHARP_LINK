import { Home, Search, Plus, Users, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const MobileBottomNav = ({counts}) => {
    const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
        <div className="max-w-4xl mx-auto px-2">
            <div className="flex items-center justify-between py-2">
            {/* Home */}
            <button onClick={() => navigate("/")} className="flex-1 flex items-center justify-center cursor-pointer">
                <Home className="w-6 h-6 text-gray-700" />
            </button>

            {/* Discover */}
            <button onClick={() => navigate("/discover")} className="flex-1 flex items-center justify-center cursor-pointer">
                <Search className="w-6 h-6 text-gray-700" />
            </button>

            {/* Create Post */}
            <div className="flex-1 flex items-center justify-center -mt-4 cursor-pointer">
                <Link to="/create-post" className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transform active:scale-95" style={{ background: "linear-gradient(90deg,#6366f1,#a78bfa)" }}>
                    <Plus className="w-5 h-5 text-white" />
                </Link>
            </div>

            {/* Connections */}
            <button onClick={() => navigate("/connections")} className="relative flex-1 flex items-center justify-center cursor-pointer">
                <Users className="w-6 h-6 text-gray-700" />
                {
                    counts.pendingConnections > 0 && (
                        <span className="absolute top-0 left-11 w-2 h-2 bg-red-500 rounded-full"></span>
                    )
                }
            </button>

            {/* Profile */}
            <button onClick={() => navigate("/profile")} className="flex-1 flex items-center justify-center cursor-pointer">
                <User className="w-6 h-6 text-gray-700" />
            </button>
            </div>
        </div>
    </nav>
  );
};

export default MobileBottomNav;
