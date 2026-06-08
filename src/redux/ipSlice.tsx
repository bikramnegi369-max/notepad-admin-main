import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiUrl } from './api';
import { toast } from 'react-toastify';

export const getBlockedIPs = createAsyncThunk('ip/getAll', async () => {
  const response = await apiUrl.get('/admin/blocked-ips');
  return response.data;
});

export const addBlockedIP = createAsyncThunk(
  'ip/add',
  async (data: { ip: string; isActive: boolean }) => {
    const response = await apiUrl.post('/admin/block-ip', data);
    return response.data;
  },
);

export const updateIPStatus = createAsyncThunk(
  'ip/updateStatus',
  async (data: { id: string; isActive: boolean }) => {
    const response = await apiUrl.put(`/admin/blocked-ip/${data.id}`, {
      isActive: data.isActive,
    });
    return { id: data.id, isActive: data.isActive, data: response.data };
  },
);

export const deleteBlockedIP = createAsyncThunk(
  'ip/delete',
  async (id: string) => {
    const response = await apiUrl.delete(`/admin/blocked-ip/${id}`);
    return { id, data: response.data };
  },
);

export const getSecurityStatus = createAsyncThunk('ip/getStatus', async () => {
  const response = await apiUrl.get('/admin/security-status');
  return response.data;
});

export const toggleSecurityStatus = createAsyncThunk(
  'ip/toggleStatus',
  async (status: boolean) => {
    const response = await apiUrl.post('/admin/toggle-security', { status });
    return response.data;
  },
);

interface IPState {
  ips: any[];
  isGlobalBlocked: boolean;
  isLoading: boolean;
  isError: boolean;
}

const initialState: IPState = {
  ips: [],
  isGlobalBlocked: false,
  isLoading: false,
  isError: false,
};

const ipSlice = createSlice({
  name: 'ip',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Get IPs
    builder.addCase(getBlockedIPs.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getBlockedIPs.fulfilled, (state, action) => {
      state.isLoading = false;
      state.ips = action.payload.data || [];
    });
    builder.addCase(getBlockedIPs.rejected, (state) => {
      state.isLoading = false;
      state.isError = true;
    });

    // Global Security Status
    builder.addCase(getSecurityStatus.fulfilled, (state, action) => {
      state.isGlobalBlocked = action.payload.data?.isGlobalBlocked || false;
    });

    builder.addCase(toggleSecurityStatus.pending, (state, action) => {
      state.isGlobalBlocked = action.meta.arg; // Optimistic update
    });
    builder.addCase(toggleSecurityStatus.fulfilled, (state, action) => {
      toast.success(action.payload.message || 'Security mode updated');
    });
    builder.addCase(toggleSecurityStatus.rejected, (state) => {
      state.isGlobalBlocked = !state.isGlobalBlocked; // Rollback on failure
      toast.error('Failed to update security status');
    });

    // Add IP
    builder.addCase(addBlockedIP.fulfilled, (state, action) => {
      toast.success(action.payload.message || 'IP Blocked successfully');
      // Refreshing the list logic is usually handled by re-dispatching in the component
    });
    builder.addCase(addBlockedIP.rejected, (state, action: any) => {
      toast.error(action.error.message || 'Failed to block IP');
    });

    // Update IP Status
    builder.addCase(updateIPStatus.fulfilled, (state, action) => {
      const index = state.ips.findIndex((ip) => ip._id === action.payload.id);
      if (index !== -1) {
        state.ips[index].isActive = action.payload.isActive;
      }
      toast.success('IP Status updated successfully');
    });

    // Delete IP
    builder.addCase(deleteBlockedIP.fulfilled, (state, action) => {
      state.ips = state.ips.filter((ip) => ip._id !== action.payload.id);
      toast.success('IP Unblocked successfully');
    });
  },
});

export default ipSlice.reducer;
