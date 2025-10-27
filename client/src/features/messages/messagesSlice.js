import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import api from "../../api/axios.js"

const initialState = {
    messages: [],
    cache: {},
}

export const fetchMessages = createAsyncThunk("messages/fetchMessages", async ({token, userId}, {getState}) => {
    const existing = getState().messages.cache[userId];
    if(existing && !getState().messages.forceRefresh) 
    {
        return { fromCache: true, userId, messages: existing };
    }
    const {data} = await api.post("/api/message/get", { to_user_id: userId }, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    if (!data.success) return null;
    return { fromCache: false, userId, messages: data.messages };
})

const messagesSlice = createSlice({
    name: "messages",
    initialState,
    reducers: {
        setMessages: (state, action) => {
            state.messages = action.payload;
        },
        addMessage: (state, action) => {
            const newMessages = Array.isArray(action.payload) ? action.payload : [action.payload];
            state.messages = [...state.messages, ...newMessages];

            newMessages.forEach(message => {
                const userId =
                message.from_user_id === message.currentUserId
                    ? message.to_user_id
                    : message.from_user_id;

                if (!state.cache[userId]) state.cache[userId] = [];
                state.cache[userId].push(message);
            });
        },
        markMessageSeen: (state, action) => {
            const { messageIds } = action.payload;
            state.messages = state.messages.map(msg => {
                if(messageIds.includes(msg._id)) {
                    return { ...msg, seen: true };
                }
                return msg;
            });
        },
        resetMessages: (state) => {
            state.messages = [];
            state.cache = {};
        },
        deleteMessage: (state, action) => {
            const { messageId, from_user_id, to_user_id, currentUserId } = action.payload;
            state.messages = state.messages.filter(msg => msg._id !== messageId);

            const otherUserId = from_user_id === currentUserId ? to_user_id : from_user_id;

            Object.keys(state.cache).forEach(uid => {
                if (uid === otherUserId || uid === from_user_id || uid === to_user_id) {
                state.cache[uid] = state.cache[uid].filter(msg => msg._id !== messageId);
                }
            });
        },
        forceRefreshMessages: (state) => {
            state.forceRefresh = !state.forceRefresh;
        }
    },
    extraReducers: (builder) => {
        builder.addCase(fetchMessages.fulfilled, (state, action) => {
            if(action.payload)
            {
                const { userId, messages, fromCache } = action.payload;

                state.messages = [...messages].sort(
                    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
                );

                if (!fromCache) {
                    state.cache[userId] = messages;
                }
            }
        })
    }
})

export const {setMessages, addMessage, markMessageSeen, resetMessages, deleteMessage, forceRefreshMessages} = messagesSlice.actions;
export default messagesSlice.reducer