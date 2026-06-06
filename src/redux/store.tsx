import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import adminReducer from "./loginSlice";
import backupReducer from "./backupSlice";
import messagesUset from "./messagesSlice";
export const store = configureStore({
    reducer:{
        user:userReducer,
        admin:adminReducer,
        backup:backupReducer,
        message:messagesUset
    }
})
export type AppDispatch = typeof store.dispatch;