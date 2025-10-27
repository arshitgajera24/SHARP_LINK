import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import api from "../../api/axios.js"

const initialState = {
    messages: [],
    cache: {},
}

export const fetchMessages = createAsyncThunk("messages/fetchMessages", async ({token, userId}, {getState}) => {
    const existing = getState().messages.cache[userId];
    if(existing)
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
    },
    extraReducers: (builder) => {
        builder.addCase(fetchMessages.fulfilled, (state, action) => {
            if(action.payload)
            {
                const { userId, messages, fromCache } = action.payload;

                state.messages = messages;
                if(!fromCache)
                {
                    state.cache[userId] = messages;
                }
            }
        })
    }
})

export const {sendMessages, addMessage, markMessageSeen, resetMessages} = messagesSlice.actions;
export default messagesSlice.reducer