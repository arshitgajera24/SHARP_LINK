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
            const fetchedMessages = action.payload || [];

            // Map server messages by id
            const serverMap = new Map(fetchedMessages.map(m => [m._id, m]));

            // Build merged map:
            //  - take server messages (merge with existing local message if present to preserve flags like `seen`)
            //  - keep any local optimistic messages (temp-ids) that server doesn't know about
            const mergedMap = new Map();

            // First, add/merge server messages.
            fetchedMessages.forEach(serverMsg => {
            const localMsg = state.messages.find(m => m._id === serverMsg._id);
            // Merge so we preserve any local-only flags (e.g. seen or sending -> but sending typically won't exist on server)
            mergedMap.set(serverMsg._id, { ...(localMsg || {}), ...serverMsg });
            });

            // Then, preserve local optimistic messages (temp ids) that the server doesn't return
            state.messages.forEach(localMsg => {
            if (!mergedMap.has(localMsg._id)) {
                // keep it only if it's a temp/optimistic message (id pattern you use), or you want to keep drafts etc.
                if (typeof localMsg._id === 'string' && localMsg._id.startsWith('temp-')) {
                mergedMap.set(localMsg._id, localMsg);
                }
            }
            });

            // Convert to array and sort once.
            const mergedMessages = Array.from(mergedMap.values()).sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );

            state.messages = mergedMessages;
        })
    }
})

export const {setMessages, addMessage, markMessageSeen, resetMessages, deleteMessage} = messagesSlice.actions;
export default messagesSlice.reducer