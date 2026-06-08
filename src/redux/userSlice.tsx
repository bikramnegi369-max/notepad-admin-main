import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiUrl } from '../redux/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
export const userGet = createAsyncThunk('user/get', async () => {
  const response = await apiUrl.get('/admin/notename');
  return response.data;
});

export const redirect = createAsyncThunk('user/redirect', async (id) => {
  const response = await apiUrl.get(`/admin/redirect/${id}`);
  return response.data;
});

export const deleteUser = createAsyncThunk('user/deleteUser', async (id) => {
  const response = await apiUrl.delete(`/admin/deleteuser/${id}`);
  return response.data;
});

export const addUser = createAsyncThunk('user/addUser', async (data: any) => {
  const response = await apiUrl.post('/admin/userregister', data);
  return response.data;
});

export const getTotalNotes = createAsyncThunk(
  'user/getTotalNotes',
  async () => {
    const response = await apiUrl.get('/admin/getallnote');
    return response.data;
  },
);
export const getNotesByUser = createAsyncThunk(
  'user/getNotesByUser',
  async (id: string) => {
    const response = await apiUrl.get(`/admin/getnote/${id}`);
    return response.data;
  },
);
const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    user: [],
    isLoading: false,
    isError: false,
    totalNotes: 0,
    navigate: false,
    singleNote: [],
  },
  reducers: {},

  extraReducers: (builder) => {
    builder.addCase(userGet.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isLoading = false;
      state.isError = false;
    });
    builder.addCase(userGet.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(userGet.rejected, (state) => {
      state.isError = true;
    });
    builder.addCase(getNotesByUser.rejected, (state) => {
      state.isError = true;
      state.isLoading = false;
    });
    builder.addCase(getNotesByUser.pending, (state) => {
      state.singleNote = [];
      state.isLoading = true;
    });
    builder.addCase(getNotesByUser.fulfilled, (state, action) => {
      state.singleNote = action.payload;
      state.isLoading = false;
      state.isError = false;
    });
    builder.addCase(getTotalNotes.fulfilled, (state, action) => {
      state.totalNotes = action.payload?.data?.length;
    });
    builder.addCase(redirect.fulfilled, (state, action) => {
      window.location.href = action.payload.side;
    });
    builder.addCase(deleteUser.pending, (state, action) => {
      // window.location.reload()
      // toast.success('User Deleted Successfully')
    });
    builder.addCase(deleteUser.fulfilled, (state, action) => {
      // window.location.reload()
      toast.success('User Deleted Successfully');
    });
    builder.addCase(deleteUser.rejected, (state, action) => {
      // console.log(action.payload)
    });
    builder.addCase(addUser.fulfilled, (state, action) => {
      if (action.payload.status === 'success') {
        state.navigate = true;
        toast.success(action.payload.message);
      } else {
        toast.error(action.payload.message);
      }
      // window.location.reload()
    });
  },
});

export default adminSlice.reducer;
