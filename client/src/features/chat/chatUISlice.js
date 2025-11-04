import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    open: false,
    selectedUserId: null,
    isLoading: false
}

const chatUISlice = createSlice({
    name: "chatUI",
    initialState,
    reducers: {
        openChatWithUser: (state, action) => {
            state.open = true;
            state.selectedUserId = action.payload;
            state.isLoading = false;
        },
        closeChat: (state) => {
            state.open = false;
            state.selectedUserId = null;
            state.isLoading = false;
        },
        setChatLoaded: (state) => {
            state.isLoading = false;
        },
    }
})

export const { openChatWithUser, closeChat, setChatLoaded } = chatUISlice.actions;
export default chatUISlice.reducer;