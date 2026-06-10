import { useEffect, useState, useMemo } from 'react';
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
import socket from './socket';
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

  // Global Notification Logic
  const notificationSound = useMemo(() => {
    const audio = new Audio(
      'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
    );
    audio.load();
    return audio;
  }, []);

  // Unlock audio on first user interaction
  useEffect(() => {
    const unlockAudio = () => {
      notificationSound
        .play()
        .then(() => {
          notificationSound.pause();
          notificationSound.currentTime = 0;
        })
        .catch(() => {});
      document.removeEventListener('click', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    return () => document.removeEventListener('click', unlockAudio);
  }, [notificationSound]);

  useEffect(() => {
    if (!islogin) {
      socket.disconnect();
      return;
    }

    const storedId = localStorage.getItem('adminID');
    const storedName = localStorage.getItem('adminName');
    const token = localStorage.getItem('token');

    if (storedId && storedName) {
      socket.auth = { token, name: storedName, userId: storedId };
      if (!socket.connected) socket.connect();
    }

    const handlePrivateMessage = (data: any) => {
      const myId = localStorage.getItem('adminID');
      const isFromMe =
        String(data.from) === String(myId) ||
        String(data.sender) === String(myId);

      // Play notification sound for any incoming message not from the admin themselves.
      // The unread count will be handled by the chat component marking messages as read
      // if the chat is active, and by the messageList event otherwise.
      if (!isFromMe) {
        // Reset and play notification sound
        notificationSound.currentTime = 0;
        notificationSound
          .play()
          .catch((e) =>
            console.warn('Audio playback blocked: Interaction required', e),
          );
        // Request updated list to recalculate total unread
        socket.emit('messageList');
      }
    };

    const handleMessageList = (conversations: any[]) => {
      const total = conversations.reduce(
        (acc, u) => acc + (u.newMessages || 0),
        0,
      );
      localStorage.setItem('totalUnread', total.toString());
      window.dispatchEvent(new Event('unread-count-update'));
    };

    socket.on('private message', handlePrivateMessage);
    socket.on('messageList', handleMessageList);

    return () => {
      socket.off('private message', handlePrivateMessage);
      socket.off('messageList', handleMessageList);
    };
  }, [islogin, notificationSound]);

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
