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
import Chat from './components/Chat/Chat.tsx';
import AdminChat from './components/Chat/AdminChat.tsx';
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
                <PageTitle title="DashBoard | Notepad - Create, Edit, Update & Delete Notes" />
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
              <PageTitle title="Tables | Notepad - Create, Edit, Update & Delete Notes" />
              <Tables />
            </>
          }
        />
        <Route
          path="/adduser"
          element={
            <>
              <PageTitle title="Add User | Notepad - Create, Edit, Update & Delete Notes" />
              <Adduser />
            </>
          }
        />
        <Route
          path="/adminchat"
          element={
            <>
              <PageTitle title="Admin Chat | Notepad - Create, Edit, Update & Delete Notes" />
              <AdminChat />
            </>
          }
        />
        <Route
          path="/login"
          element={
            !islogin ? (
              <>
                <PageTitle title="Signin | Notepad - Create, Edit, Update & Delete Notes" />
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
              <PageTitle title="Signup | Notepad - Create, Edit, Update & Delete Notes" />
              <SignUp />
            </>
          }
        />
        <Route
          path="/chat/:id/:name"
          element={
            <>
              <PageTitle title="Chat | Notepad - Create, Edit, Update & Delete Notes" />
              <Chat />
            </>
          }
        />
        <Route
          path="/backup"
          element={
            <>
              <PageTitle title="Backup | Notepad - Create, Edit, Update & Delete Notes" />
              <BackupData />
            </>
          }
        />
        <Route path="/singleUserNote/:id" element={<SingleUser />} />
      </Routes>
    </>
  );
}

export default App;
