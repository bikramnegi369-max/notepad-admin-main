import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiUrl } from "./api";

export const loginAdmin = createAsyncThunk(
    "auth/login",
    async (data:any) => {
        const roleAlsoAdd = {
            role: "manager",
            ...data
        }
        const response = await apiUrl.post("/admin/login", roleAlsoAdd);
        return response;
    }
)


const loginSlice = createSlice({
    name: "login",
    initialState: {
        admin:{},
        isLoading: false,
        isError: false,
        toastMessage: null
    },
    reducers:{},

    extraReducers: (builder) => {
        builder.addCase(loginAdmin.fulfilled, (state, action) => {
            console.log(action.payload.data)
            localStorage.setItem("token", action.payload.data.token);
            localStorage.setItem("adminID", action.payload.data.id);
            localStorage.setItem("adminName", action.payload.data.name);
            state.admin = action.payload.data;
            state.toastMessage = action.payload.data.message;
            state.isLoading = false;
            state.isError = false;

        });
        builder.addCase(loginAdmin.pending, (state) => {
            state.isLoading = true;
        });
        builder.addCase(loginAdmin.rejected, (state) => {
            state.isError = true;
        });
    },
});

export default loginSlice.reducer;