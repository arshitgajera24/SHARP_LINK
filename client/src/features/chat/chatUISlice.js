import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    open: false,
    selectedUserId: null,
}

const chatUISlice = createSlice({
    name: "chatUI",
    initialState,
    reducers: {
        openChatWithUser: (state, action) => {
            state.open = true;
            state.selectedUserId = action.payload;
        },
        closeChat: (state) => {
            state.open = false;
            state.selectedUserId = null;
        }
    }
})

export const { openChatWithUser, closeChat } = chatUISlice.actions;
export default chatUISlice.reducer;