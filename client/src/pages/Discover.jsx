import { useCallback, useEffect, useState } from 'react'
import { Search } from 'lucide-react';
import UserCard from '../components/UserCard';
import Loading from '../components/Loading';
import api from '../api/axios.js';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { fetchUsers } from '../features/user/userSlice.js';
import debounce from "lodash/debounce"

const Discover = () => {

  const dispatch = useDispatch();
  const {getToken} = useAuth();
  const [input, setInput] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (input) => {
      if (input.length < 1) {
        setUsers([]);
        return;
      }

      try {
        setUsers([])
        setLoading(true);

        const {data} = await api.post("/api/user/discover", {input}, {
          headers: {
            Authorization: `Bearer ${await getToken()}`
          }
        })
        
        data.success ? setUsers(data.users) : toast.error(data.message);
        setLoading(false)
      } catch (error) {
        toast.error(error.message)
      }
      setLoading(false)
  }

  const debouncedSearch = useCallback(debounce((value) => handleSearch(value), 100), []);

  const handleChange = (e) => {
    const value = e.target.value;
    setInput(value);
    debouncedSearch(value)
  }

  useEffect(() => {
    getToken().then((token) => {
      dispatch(fetchUsers(token))
    })
  }, [])

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 to-white mb-14'>
      <div className='max-w-6xl mx-auto p-6'>

        {/* Title */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-slate-900 mb-2'>Discover People</h1>
          <p className='hidden md:block text-slate-600'>Connect with Amazing People and Grow Your Network</p>
        </div>

        {/* Search Bar */}
        <div className='mb-8 shadow border border-slate-200/60 bg-white/80'>
          <div className='p-6'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5' />
              <input type="text" placeholder='Name, Username, Bio or Location...' onChange={handleChange} value={input} className='pl-10 sm:pl-12 py-2 w-full border border-gray-300 rounded-md max-sm:text-sm' />
            </div>
          </div>
        </div>

        <div className='flex flex-wrap gap-6'>
          {
            users.map((user) => (
              <UserCard user={user} key={user._id} />
            ))
          }
        </div>

        {
          loading && (<Loading height='60vh' />)
        }
      </div>
    </div>
  )
}

export default Discover
