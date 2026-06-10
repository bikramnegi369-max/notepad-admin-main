import { useEffect, useState } from 'react';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom';

import Loader from './common/Loader';
import PageTitle from './components/PageTitle';
import SignIn from './pages/Authentication/SignIn';
import SignUp from './pages/Authentication/SignUp';
import Tables from './pages/Tables';
import SingleUser from './pages/singleUserNote';
import Adduser from './pages/adduser';
import Dashboard from './pages/Dashboard/Dashboard';
import BackupData from './pages/Backup.tsx';
import BlockIP from './pages/BlockIP.tsx';
import Chat from './components/Chat/Chat.tsx';
import AdminChat from './components/Chat/AdminChat.tsx';
import AdminConversations from './components/Chat/AdminConversations.tsx';
function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const [islogin, setIslogin] = useState(false);
  useEffect(() => {
    const tokenGet = () => {
      const token = localStorage.getItem('token');
      if (token) {
        setIslogin(true);
      } else {
        setIslogin(false);
      }
    };
    tokenGet();
  }, [localStorage.getItem('token')]);
  return loading ? (
    <Loader />
  ) : (
    <>
      <Routes>
        <Route
          path="/"
          element={
            islogin ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
          }
          index
        />
        <Route
          path="/dashboard"
          element={
            islogin ? (
              <>
                <PageTitle title="DashBoard | Notepad - Manage User, See Chats and Toggle Security " />
                {/* <Tables /> */}
                <Dashboard />
              </>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/tables"
          element={
            <>
              <PageTitle title="Tables | Notepad - Manage User, See Chats and Toggle Security " />
              <Tables />
            </>
          }
        />
        <Route
          path="/adduser"
          element={
            <>
              <PageTitle title="Add User | Notepad - Manage User, See Chats and Toggle Security " />
              <Adduser />
            </>
          }
        />
        <Route
          path="/adminchat"
          element={
            <>
              <PageTitle title="Admin Chat | Notepad - Manage User, See Chats and Toggle Security " />
              <AdminChat />
            </>
          }
        />
        <Route
          path="/conversations"
          element={
            <>
              <PageTitle title="Conversations | Notepad Admin" />
              <AdminConversations />
            </>
          }
        />
        <Route
          path="/login"
          element={
            !islogin ? (
              <>
                <PageTitle title="Signin | Notepad - Manage User, See Chats and Toggle Security " />
                <SignIn />
              </>
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        <Route
          path="/auth/signup"
          element={
            <>
              <PageTitle title="Signup | Notepad - Manage User, See Chats and Toggle Security " />
              <SignUp />
            </>
          }
        />
        <Route
          path="/chat/:id/:name"
          element={
            <>
              <PageTitle title="Chat | Notepad - Manage User, See Chats and Toggle Security " />
              <Chat />
            </>
          }
        />
        <Route
          path="/backup"
          element={
            <>
              <PageTitle title="Backup | Notepad - Manage User, See Chats and Toggle Security " />
              <BackupData />
            </>
          }
        />
        <Route
          path="/block-ip"
          element={
            <>
              <PageTitle title="Block IP | Notepad Admin" />
              <BlockIP />
            </>
          }
        />
        <Route path="/singleUserNote/:id" element={<SingleUser />} />
      </Routes>
    </>
  );
}

export default App;
