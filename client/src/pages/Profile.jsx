import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Loading from '../components/Loading';
import UserProfileInfo from '../components/UserProfileInfo';
import PostCard from '../components/PostCard';
import moment from 'moment';
import ProfileModel from '../components/ProfileModel';
import { useAuth } from '@clerk/clerk-react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers } from '../features/user/userSlice.js';
import { MessageCircle, Plus, UserPlus } from 'lucide-react';
import { fetchConnections } from '../features/connections/connectionsSlice.js';
import { openChatWithUser } from '../features/chat/chatUISlice.js';

const Profile = () => {

  const currentUser = useSelector((state) => state.user.value)
  const {getToken} = useAuth();
  const {profileId} = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("Posts");
  const [showEdit, setShowEdit] = useState(false);
  const [isFollowing, setIsFollowing] = useState(currentUser?.following?.includes(profileId) ? true : false);
  const [loaded, setLoaded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [userConnections, setUserConnections] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();  

  const fetchUserConnections = async (profileId) => {
    try {
      const token = await getToken();
      const { data } = await api.post("/api/user/connections", { profileId }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setUserConnections(data.connections);        
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleFollow = async () => {
    try {
      setIsFollowing(true);
      const {data} = await api.post("/api/user/follow", {id: profileId}, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });

      if(data.success){
        toast.success(data.message);
        dispatch(fetchUsers(await getToken()));
        await fetchUser(profileId);
        dispatch(fetchConnections(await getToken()));
      } else {
        toast.error(data.message);
        setIsFollowing(false);
      }
    } catch (err) {
      toast.error(err.message);
      setIsFollowing(false);
    }
  };

  const handleUnfollow = async (userId) => {
      try {
        setIsFollowing(false);
        const {data} = await api.post("/api/user/unfollow", {id: userId}, {
          headers: {
            Authorization: `Bearer ${await getToken()}`
          }
        })
  
        if(data.success)
        {
          toast.success(data.message);
          dispatch(fetchUsers(await getToken()));
          await fetchUser(userId);
          dispatch(fetchConnections(await getToken()))
        }
        else
        {
          toast(data.message);
          setIsFollowing(true);
        }
      } catch (error) {
        toast.error(error.message);
        setIsFollowing(true);
      }
    }

  const handleConnectionRequest = async () => {
    if(connectionStatus === "accepted") {
      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        navigate(`/messages`);
        dispatch(openChatWithUser(profileId));
      } else {
        dispatch(openChatWithUser(profileId));
      }
      return;
    }

    try {
      setConnectionStatus("pending");
      const {data} = await api.post("/api/user/connect", {id: profileId}, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });

      if(data.success)
      {
        toast(data.message, {
          icon: "👥"
        });
      }
      else 
      {
        toast.error(data.message);
        setConnectionStatus(null);
      }
    } catch (err) {
      toast.error(err.message);
      setConnectionStatus(null);
    }
  };

  const fetchUser = async (profileId) => {
    const token = await getToken();
    try {
      const { data } = await api.post("/api/user/profiles", {profileId}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if(data.success)
      {
        setUser(data.profile);
        setPosts(data.posts);
        setConnectionStatus(data.connectionStatus);
      }
      else
      {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error)
    }
  }

  const handleDeleteFromProfile = (postId) => {
    setPosts((prev) => prev.filter((post) => post._id !== postId));
  };

  useEffect(() => {
    if(profileId)
    {
      fetchUser(profileId);
      fetchUserConnections(profileId);
    }
    else
    {
      fetchUser(currentUser._id);
      fetchUserConnections(currentUser._id);
    }

    if (profileId) {
      setIsFollowing(currentUser?.following?.includes(profileId) ? true : false);
    }
  }, [profileId, currentUser, getToken]);

  useEffect(() => {
    if (profileId && currentUser?.following) {
      setIsFollowing(currentUser.following.includes(profileId));
    }
  }, [currentUser?.following, profileId]);


  return user ? (
    <div className='relative h-full bg-gray-50 p-6 md:overflow-y-scroll'>
      <div className='max-w-3xl mx-auto'>
        
        {/* Profile Card */}
        <div className='bg-white rounded-2xl shadow overflow-hidden'>
          
          {/* Cover Photo */}
          <div className='h-40 md:h-56 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200'>
            {
              user.cover_photo && <img src={user.cover_photo} alt="Cover Photo" className='w-full h-full object-cover' loading='lazy' decoding="async" onLoad={() => setLoaded(true)} style={{filter: loaded ? "none" : "blur(20px)", transition: "filter 0.3s ease-out"}} />
            }
          </div>

          {/* User Info */}
          <UserProfileInfo user={user} posts={posts} profileId={profileId} setShowEdit={setShowEdit} />

          {
            profileId && profileId !== currentUser._id && 
            <div className="flex flex-col sm:flex-row justify-end items-center mb-6 sm:items-start gap-3 mt-4 px-4 sm:px-6">
              {/* Follow / Unfollow */}
              <button onClick={() => {isFollowing ? handleUnfollow(profileId) : handleFollow()}} className="w-full sm:w-auto py-2 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-md transition active:scale-95 flex justify-center items-center gap-2 cursor-pointer">
                <UserPlus className="w-5 h-5"/>
                {isFollowing ? "Following" : "Follow"}
              </button>

              {/* Connection Request / Message */}
              <button onClick={handleConnectionRequest} disabled={connectionStatus === "pending"} className={`w-full sm:w-auto py-2 px-6 rounded-md transition active:scale-95 flex justify-center items-center gap-2 ${connectionStatus === "accepted" ? "border border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer" : connectionStatus === "pending" ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "border border-gray-300 text-gray-700 hover:bg-gray-100"}`}>
                {
                  connectionStatus === "accepted"
                  ? <><MessageCircle className="w-5 h-5"/> Send Message </>
                  : connectionStatus === "pending"
                    ? <><Plus className="w-5 h-5"/> Pending </>
                    : <><Plus className="w-5 h-5"/> Connect </>
                }
              </button>
            </div>
          }
          
        </div>

        {/* Tabs */}
        <div className="mt-6 mb-14">
          <div className='bg-white rounded-xl shadow p-1 flex max-w-md mx-auto'>
            {["Posts", "Media", "Connections"].map((tab) => (
                <button onClick={() => setActiveTab(tab)} key={tab} className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${activeTab === tab ? "bg-indigo-600 text-white" : "text-gray-600 hover:text-gray-900"}`}>
                  {tab}
                </button>
            ))}
          </div>

          {/* Posts */}
          {
            activeTab === "Posts"
            && (posts.length > 0 ? (
              <div className='mt-6 flex flex-col items-center gap-6'>
                {
                  posts.map((post) => (<PostCard key={post._id} post={post} onDelete={handleDeleteFromProfile} />))
                }
              </div>
            ) : (
              <div className="mt-6 bg-white p-6 rounded-xl shadow">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Posts</h2>
                <p className="text-gray-500 text-center mt-4">No Posts yet 👀</p>
              </div>
            ))
          }

          {/* Media */}
          {
            activeTab === "Media"
            && (posts.length > 0 ? (
              <div className='flex flex-wrap mt-6 max-w-6xl'>
                {
                  posts.filter((post) => post.image_urls.length > 0).map((post, index) => (
                    <div key={index}>
                      {
                        post.image_urls.map((image, index) => (
                          <Link target="_blank" to={image} key={index} className='relative group'>
                            <img key={index} src={image} alt="Image" className='w-64 aspect-video object-cover' loading='lazy' decoding="async" onLoad={() => setLoaded(true)} style={{filter: loaded ? "none" : "blur(20px)", transition: "filter 0.3s ease-out"}} />
                            <p className='absolute bottom-0 right-0 text-xs p-1 px-3 backdrop-blur-xl text-white opacity-0 group-hover:opacity-100 transition duration-300'>Posted {moment(post.createdAt).fromNow()}</p>
                          </Link>
                        ))
                      }
                    </div>
                  ))
                }
              </div>
            ) : (
              <div className="mt-6 bg-white p-6 rounded-xl shadow">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Media</h2>
                <p className="text-gray-500 text-center mt-4">No Posts or Media yet 📭😔</p>
              </div>
            ))
          }

          {/* Connections */}
          {
            activeTab === "Connections" && (
              <div className="mt-6 bg-white p-6 rounded-xl shadow">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Connections</h2>

                {
                  userConnections.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {userConnections.map((connection) => (
                        <div key={connection._id} onClick={() => navigate(`/profile/${connection._id}`)} className="flex flex-col items-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow hover:shadow-md hover:-translate-y-1 transition cursor-pointer border border-indigo-100">
                          <img src={connection.profile_picture || "/default-avatar.png"}alt={connection.full_name}className="w-14 h-14 rounded-full object-cover border border-purple-200 mb-2" loading='lazy' decoding="async" onLoad={() => setLoaded(true)} style={{filter: loaded ? "none" : "blur(20px)", transition: "filter 0.3s ease-out"}} />
                          <p className="text-sm font-semibold text-gray-800 text-center truncate w-full">{connection.full_name}</p>
                          {
                            connection.username && (
                              <p className="text-xs text-gray-500">@{connection.username}</p>
                            )
                          }
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center mt-4">No connections yet 👥</p>
                  )
                }
              </div>
            )
          }
        </div>
      </div>
      {
        showEdit && <ProfileModel setShowEdit={setShowEdit} />
      }
    </div>
  ) : (
    <Loading />
  )
}

export default Profile
