import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { apiUrl } from "./api"
import { toast } from "react-toastify"

export const backupData = createAsyncThunk(
    "backup/data",
    async()=>{
        const response = await apiUrl.get('/backup/notesbackup')
        return response
    }
)


export const loginBackup = createAsyncThunk(
    "backup/login",
    async()=>{
        const response = await apiUrl.get('/backup/loginbackup')
        return response
    }
)

const backupSlice = createSlice({
    name: "backup",
    initialState:{
        backupData:[],
        isLoading:false,
        isError:false
    },
    reducers:{},
    extraReducers: (builder) => {
        builder.addCase(backupData.fulfilled, (state, action) => {
            toast.success(action.payload.data.message)
            state.backupData = action.payload.data
            state.isLoading = false
            state.isError = false
        });
        builder.addCase(backupData.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(backupData.rejected, (state) => {
            state.isError = true
        });

        builder.addCase(loginBackup.fulfilled, (state, action) => {
            toast.success(action.payload.data.message)
            state.backupData = action.payload.data
            state.isLoading = false
            state.isError = false
        });
        builder.addCase(loginBackup.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(loginBackup.rejected, (state) => {
            state.isError = true
        });
    },
})


export default backupSlice.reducer;
