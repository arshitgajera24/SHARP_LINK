import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import api from "../../api/axios.js"

const initialState = {
    messages: [],
}

export const fetchMessages = createAsyncThunk("messages/fetchMessages", async ({token, userId}) => {
    const {data} = await api.post("/api/message/get", { to_user_id: userId }, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    if (!data.success) throw new Error(data.message || "Failed to fetch messages");
    return data.messages;
})

const messagesSlice = createSlice({
    name: "messages",
    initialState,
    reducers: {
        setMessages: (state, action) => {
            state.messages = action.payload;
        },
        addMessage: (state, action) => {
            const newMessage = action.payload;

            if (!state.messages.some((msg) => msg._id === newMessage._id)) {
                state.messages.push(newMessage);
            }
        },
        markMessageSeen: (state, action) => {
            const { messageIds } = action.payload;
            state.messages = state.messages.map((msg) =>
                messageIds.includes(msg._id) ? { ...msg, seen: true } : msg
            );
        },
        resetMessages: (state) => {
            state.messages = [];
        },
        deleteMessage: (state, action) => {
            const { messageId } = action.payload;
            state.messages = state.messages.filter((msg) => msg._id !== messageId);
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchMessages.fulfilled, (state, action) => {
            const newMessages = action.payload;
            const merged = [...state.messages];

            newMessages.forEach(msg => {
                const existingIndex = merged.findIndex(m => m._id === msg._id);
                if (existingIndex === -1)
                {
                    merged.push(msg);
                }
                else
                {
                    merged[existingIndex] = {
                        ...merged[existingIndex],
                        ...msg,
                        seen: merged[existingIndex].seen || msg.seen,
                    };
                }
            })

            state.messages = merged.sort(
                (a,b) => new Date(a.createdAt) - new Date(b.createdAt)
            )
        })
    }
})

export const {setMessages, addMessage, markMessageSeen, resetMessages, deleteMessage} = messagesSlice.actions;
export default messagesSlice.reducer