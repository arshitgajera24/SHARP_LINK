import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, UserCheck, UserPlus, UserRoundPen, Users } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '@clerk/clerk-react';
import { fetchConnections } from '../features/connections/connectionsSlice.js';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

const Connections = () => {

  const [currTab, setCurrTab] = useState("Followers");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {getToken} = useAuth();

  const { connections, pendingConnections, followers, following } = useSelector((state) => state.connections);

  const dataArray = [
    { label: "Followers", value: followers, icon: Users },
    { label: "Following", value: following, icon: UserCheck },
    { label: "Pending", value: pendingConnections, icon: UserRoundPen },
    { label: "Connections", value: connections, icon: UserPlus },
  ]

  const handleUnfollow = async (userId) => {
    try {
      const {data} = await api.post("/api/user/unfollow", {id: userId}, {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      })

      if(data.success)
      {
        toast.success(data.message)
        dispatch(fetchConnections(await getToken()))
      }
      else
      {
        toast(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const acceptConnection = async (userId) => {
    try {
      const {data} = await api.post("/api/user/accept", {id: userId}, {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      })

      if(data.success)
      {
        toast.success(data.message)
        dispatch(fetchConnections(await getToken()))
      }
      else
      {
        toast(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const rejectConnection = async (userId) => {
    try {
      const {data} = await api.post("/api/user/reject", {id: userId}, {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      })

      if(data.success)
      {
        toast.success(data.message)
        dispatch(fetchConnections(await getToken()))
      }
      else
      {
        toast(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const removeConnection = async (userId) => {
    try {
      const {data} = await api.post("/api/user/remove", {id: userId}, {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      })

      if(data.success)
      {
        toast.success(data.message)
        dispatch(fetchConnections(await getToken()))
      }
      else
      {
        toast(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const removeFollower = async (userId) => {
    try {
      const {data} = await api.post("/api/user/removeFollower", {id: userId}, {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      })

      if(data.success)
      {
        toast.success(data.message)
        dispatch(fetchConnections(await getToken()))
      }
      else
      {
        toast(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    getToken().then((token) => {
      dispatch(fetchConnections(token))
    })
  }, [])

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='max-w-6xl mx-auto p-6'>

        {/* Title */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-slate-900 mb-2'>Connections</h1>
          <p className='hidden md:block text-slate-600'>Manage Your Network and Discover New Connections</p>
        </div>

        {/* Tabs */}
        <div className='inline-flex flex-wrap items-center border border-gray-200 rounded-2xl md:rounded-full bg-white shadow-sm overflow-hidden px-2 sm:px-3 md:px-4 py-1 md:py-2 w-full sm:w-auto justify-center sm:justify-start'>
          {dataArray.map((tab, index) => (
            <button onClick={() => setCurrTab(tab.label)} key={index} className={`flex items-center px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer rounded-2xl md:rounded-full m-1 sm:m-1.5 md:m-2 sm:text-sm md:text-base ${currTab === tab.label ? "bg-indigo-600 text-white shadow-md scale-105" : "text-gray-500 hover:text-black hover:bg-gray-100"} m-1`}>
              <tab.icon className={`w-4 h-4 ${currTab === tab.label ? "text-white" : "text-gray-500"}`} />
              <span className='ml-2'>{tab.label}</span>
              {
                tab.value?.length !== undefined && (
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium
                    ${currTab === tab.label ? "bg-white text-indigo-600" : "bg-gray-100 text-gray-700"}`}>
                    {tab.value.length}
                  </span>
                )
              }
            </button>
          ))}
        </div>

        {/* Connections */}
        <div className='flex flex-wrap gap-6 mt-6'>
          {
            dataArray.find((item) => item.label === currTab).value.map((user) => (
              <div onClick={() => navigate(`/profile/${user._id}`)} key={user._id} className={`w-full max-w-88 flex gap-5 p-6 bg-white shadow rounded-md ${currTab === "Pending" ? "cursor-pointer" : ""}`}>
                <img src={user.profile_picture} alt="Profile Picture" className='rounded-full w-12 h-12 shadow-md mx-auto' />
                <div className='flex-1'>
                  <p className='font-medium text-slate-700'>{user.full_name}</p>
                  <p className='text-slate-500'>@{user.username}</p>
                  <p className='text-sm text-slate-600'>{user.bio.slice(0, 30)}...</p>
                  <div className='flex max-sm:flex-col gap-2 mt-4'>
                    {
                      currTab !== "Pending" && currTab !== "Connections" &&
                      <button onClick={(e) => {e.stopPropagation(); navigate(`/profile/${user._id}`)}} className='w-full p-2 text-sm rounded bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition text-white cursor-pointer'>
                        View profile
                      </button>
                    }
                    {
                      currTab === "Followers" &&
                      <button onClick={(e) => {e.stopPropagation(); removeFollower(user._id)}} className='w-full p-2 text-sm rounded bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition cursor-pointer'>
                        Remove
                      </button>
                    }
                    {
                      currTab === "Pending" &&
                      <button onClick={(e) => {e.stopPropagation(); acceptConnection(user._id)}} className='w-full p-2 text-sm rounded bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition text-white cursor-pointer'>
                        Accept
                      </button>
                    }
                    {
                      currTab === "Following" && (
                        <button onClick={(e) => {e.stopPropagation(); handleUnfollow(user._id)}} className='w-full p-2 text-sm rounded bg-slate-100 hover:bg-slate-200 text-black active:scale-95 transition cursor-pointer'>
                          Unfollow
                        </button>
                      )
                    }
                    {
                      currTab === "Pending" && (
                        <button onClick={(e) => {e.stopPropagation(); rejectConnection(user._id)}} className='w-full p-2 text-sm rounded bg-slate-100 hover:bg-slate-200 text-black active:scale-95 transition cursor-pointer'>
                          Reject
                        </button>
                      )
                    }
                    {
                      currTab === "Connections" && (
                        <>
                          <button onClick={(e) => {e.stopPropagation(); navigate(`/messages/${user._id}`)}} className='w-full p-2 text-sm rounded bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition text-white cursor-pointer flex items-center justify-center gap-1'>
                            <MessageSquare className='w-4 h-4' />
                            Message
                          </button>
                          <button onClick={(e) => {e.stopPropagation(); removeConnection(user._id)}} className='w-full p-2 text-sm rounded bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition cursor-pointer'>
                            Remove
                          </button>
                        </>
                      )
                    }
                  </div>
                </div>
              </div>
            ))
          }
        </div>

      </div>
    </div>
  )
}

export default Connections
