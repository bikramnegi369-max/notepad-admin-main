import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import adminReducer from './loginSlice';
import backupReducer from './backupSlice';
import messagesUset from './messagesSlice';
import ipReducer from './ipSlice';
export const store = configureStore({
  reducer: {
    user: userReducer,
    admin: adminReducer,
    backup: backupReducer,
    message: messagesUset,
    ip: ipReducer,
  },
});
export type AppDispatch = typeof store.dispatch;
