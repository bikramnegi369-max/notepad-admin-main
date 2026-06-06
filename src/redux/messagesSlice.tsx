import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiUrl } from "./api";

export const getAllUsersName = createAsyncThunk(
    'admin/users',
    async ()=>{
        const response = await apiUrl.get('/admin/alluser')
        return response
    }
)

export const getMessagesUser = createAsyncThunk(
    'admin/messages',
    async (id)=>{
        const response = await apiUrl.post(`/admin/allmessages/${id}`)
        return response
    }
)

const UserManagementSlice = createSlice({
    name:"chats",
    initialState:{
        users:[],
        messages:[],
        isLoading:false,
        isError:false
},
reducers:{},
extraReducers:(builder)=>{
    builder.addCase(getAllUsersName.fulfilled, (state, action) => {
        state.users = action.payload.data.data
        state.isLoading = false
        state.isError = false
    })
    builder.addCase(getAllUsersName.pending, (state) => {
        state.isLoading = true
    })
    builder.addCase(getAllUsersName.rejected, (state) => {
        state.isError = true
    })

    builder.addCase(getMessagesUser.fulfilled, (state, action) => {
        state.messages = action.payload.data
        state.isLoading = false
        state.isError = false
    })
    builder.addCase(getMessagesUser.pending, (state) => {
        state.isLoading = true
    })
    builder.addCase(getMessagesUser.rejected, (state) => {
        state.isError = true
    })
}}
)

export default UserManagementSlice.reducer