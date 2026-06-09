import { BsFillSendFill } from 'react-icons/bs';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
// import useAuth from "../../contexts/Auth";
import { FaFileAlt } from 'react-icons/fa';
import { IoIosAttach } from 'react-icons/io';
import socket, { CustomSocket } from '../../socket';
import dateFormat from 'dateformat';
import { IoClose, IoArrowBack } from 'react-icons/io5';
import { AiOutlineFilePdf } from 'react-icons/ai';
import { useParams } from 'react-router-dom';
import DefaultLayout from '../../layout/DefaultLayout';
import Breadcrumb from '../Breadcrumbs/Breadcrumb';
import User from './User';
import { toast } from 'react-toastify';

// Define types for better clarity and type safety
interface ChatUser {
  _id: string;
  name: string;
  userID: string;
  self: boolean;
  connected: boolean;
  newMessages: number;
}

interface ChatMessage {
  _id?: string;
  sender: string;
  to: string;
  message: string;
  timestamp: string;
  attachment?: string;
  filePath?: string;
}

export default function Chat() {
  const { id, name } = useParams();
  const [adminId] = useState(() => localStorage.getItem('adminID'));

  const [userId, setUserId] = useState<{ sender: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formdataValue, setFormdataValue] = useState(false);
  const [message, setMessages] = useState('');
  const [userChats, setUserChats] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);

  const activeUserIdRef = useRef<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [filePath, setFilePath] = useState(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const handleFileChange = (event: any) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log(file);
      setFilePath(file.name);
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setFormdataValue(true);
    }
  };

  const handleClick = (pdfUrl: any) => {
    window.open(
      `${import.meta.env.VITE_API_URL}/public/attachments/${pdfUrl}`,
      '_blank',
    );
  };

  // Helper function to convert File to Base64
  const fileToBase64 = (file: File): Promise<string | ArrayBuffer | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onerror = (error) => reject(error);
      reader.onload = () => resolve(reader.result);
    });
  };

  const handleMessage = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessages(e.target.value);
    },
    [],
  );

  const handleSubmitMessage = useCallback(async () => {
    if (!userId?.sender) {
      toast.error('Please select a user to chat with.');
      return;
    }
    const trimmedMessage = message.trim();
    if (!trimmedMessage && !selectedFile) {
      return;
    }

    try {
      let fileContentBase64: string | ArrayBuffer | null = null;
      if (selectedFile) {
        fileContentBase64 = await fileToBase64(selectedFile);
      }

      const messagePayload = {
        message: trimmedMessage,
        fileContent: fileContentBase64, // Send Base64 content
        filePath: filePath, // Send original file name
        to: userId.sender,
      };

      socket.emit('private message', messagePayload);

      // Optimistic update for UI responsiveness
      const localMsg: ChatMessage = {
        sender: adminId!,
        to: userId.sender,
        message: trimmedMessage,
        timestamp: new Date().toISOString(),
        filePath: filePath || undefined,
      };
      setUserChats((prev) => [...prev, localMsg]);

      setMessages('');
      setFilePreview(null);
      setSelectedFile(null);
      setFormdataValue(false);
    } catch (error) {
      toast.error('Failed to send message.');
    }
  }, [message, selectedFile, filePath, userId, adminId]);

  const handleId = useCallback((id: string) => {
    const selected = { sender: id };
    setUserId(selected);
    activeUserIdRef.current = id;
    setFilePreview(null);
    setSelectedFile(null);
    setFormdataValue(false); // Reset formdataValue
    socket.emit('messages', id);
  }, []);

  // Initialize selection from URL params
  useEffect(() => {
    if (id) handleId(id);
  }, [id, handleId]);

  const initSocketConnection = useCallback(() => {
    const storedId = localStorage.getItem('adminID');
    const storedName = localStorage.getItem('adminName');

    if (
      !storedId ||
      storedId === 'null' ||
      !storedName ||
      storedName === 'null'
    ) {
      return;
    }

    const currentSocket = socket as CustomSocket;
    if (currentSocket.connected) currentSocket.disconnect();

    const sessionID = localStorage.getItem('sessionID');

    currentSocket.auth = sessionID
      ? { sessionID }
      : { username: storedName, userId: storedId };

    currentSocket.connect();

    currentSocket.on('messages', (data: ChatMessage[]) => {
      setUserChats(data);
    });

    currentSocket.on('private message', (data: ChatMessage) => {
      const activeId = activeUserIdRef.current;
      // Only handle messages FROM the other user (sent messages are handled by optimistic update) or messages to us
      if (activeId && (data.sender === activeId || data.to === storedId)) {
        setUserChats((prevChats) => [...prevChats, data]);
      }

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === data.sender && user._id !== activeId
            ? { ...user, newMessages: user.newMessages + 1 }
            : user,
        ),
      );
    });

    currentSocket.on('session', ({ sessionID, userID }) => {
      currentSocket.auth = { sessionID };
      localStorage.setItem('sessionID', sessionID);
    });

    currentSocket.on('connect_error', (err: Error) => {
      console.error('Socket connection error:', err.message);
      if (
        err.message === 'invalid username' ||
        err.message === 'Session ID unknown'
      ) {
        localStorage.removeItem('sessionID');
        // Force update auth for next retry attempt
        const name = localStorage.getItem('adminName');
        const id = localStorage.getItem('adminID');
        if (name && id) {
          currentSocket.auth = { username: name, userId: id };
          currentSocket.connect(); // Force reconnection
        }
      }
    });

    currentSocket.on('users', (socketUsers: ChatUser[]) => {
      setUsers((prevUsers) => {
        return socketUsers.map((socketUser) => {
          const existingUser = prevUsers.find(
            (u) => u.userID === socketUser.userID,
          );
          return {
            ...socketUser,
            newMessages: existingUser ? existingUser.newMessages : 0,
            connected: socketUser.connected,
          };
        });
      });
    });

    return () => {
      currentSocket.off('messages');
      currentSocket.off('private message');
      currentSocket.off('session');
      currentSocket.off('connect_error');
      currentSocket.off('users');
      currentSocket.disconnect();
    };
  }, []); // Dependencies removed as localStorage is read inside

  useEffect(() => {
    return initSocketConnection();
  }, [initSocketConnection]);

  const groupedMessages = useMemo(() => {
    return userChats.reduce(
      (acc, message) => {
        const date = dateFormat(message.timestamp, 'd mmmm yyyy');
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(message);
        return acc;
      },
      {} as Record<string, ChatMessage[]>,
    );
  }, [userChats]);

  // Scroll to bottom whenever userChats changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [userChats]);

  const activeUser = users.find((u) => u._id === userId?.sender);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmitMessage();
      }
    },
    [handleSubmitMessage],
  );

  return (
    <DefaultLayout>
      <Breadcrumb pageName={`Chat with ${name || 'User'}`} />
      <div className="flex h-[calc(100vh-200px)] overflow-hidden rounded-xl border border-stroke bg-white shadow-card dark:border-strokedark dark:bg-boxdark">
        {/* Sidebar: User List */}
        <div
          className={`${
            userId ? 'hidden lg:block' : 'w-full'
          } lg:w-80 border-r border-stroke dark:border-strokedark overflow-y-auto bg-gray-2 dark:bg-meta-4/10`}
        >
          <User handleId={handleId} userId={userId?.sender} users={users} />
        </div>

        {/* Chat Area */}
        {userId ? (
          <div className="relative flex flex-col flex-grow bg-white dark:bg-boxdark w-full lg:w-3/4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-stroke dark:border-strokedark bg-white dark:bg-boxdark sticky top-0 z-10">
              <button
                onClick={() => setUserId(null)}
                className="lg:hidden flex items-center gap-1 text-primary font-medium transition-colors hover:text-opacity-70"
              >
                <IoArrowBack size={20} />
                <span>Back</span>
              </button>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-black dark:text-white leading-none">
                    {name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        activeUser?.connected ? 'bg-success' : 'bg-danger'
                      }`}
                    ></span>
                    <span className="text-xs font-medium uppercase text-body dark:text-bodydark">
                      {activeUser?.connected ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {userChats?.length > 0 ? (
              <div
                ref={chatContainerRef}
                className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar"
              >
                {Object.keys(groupedMessages).map((date, index) => (
                  <div key={index} className="space-y-4">
                    <div className="flex justify-center my-4">
                      <span className="rounded-full bg-gray-2 dark:bg-meta-4 px-4 py-1 text-[10px] uppercase tracking-wider font-bold text-bodydark dark:text-bodydark2 shadow-sm">
                        {date}
                      </span>
                    </div>
                    {groupedMessages[date].map((chat: any) => (
                      <div
                        key={chat._id || chat.timestamp}
                        className={`flex ${
                          // Use currentAdminId for comparison
                          chat.sender === adminId
                            ? 'justify-end'
                            : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                            chat.sender === adminId
                              ? 'bg-primary text-white rounded-tr-none'
                              : 'bg-gray-2 dark:bg-meta-4 text-black dark:text-white rounded-tl-none'
                          }`}
                        >
                          {chat.attachment ? (
                            <div className="mb-2 bg-black/20 rounded-lg p-2 flex justify-center border border-white/10">
                              <button
                                className="flex items-center gap-2 text-sm font-medium hover:underline"
                                onClick={() => handleClick(chat.attachment)}
                              >
                                View Attachment <FaFileAlt size={16} />
                              </button>
                            </div>
                          ) : null}
                          <p className="text-sm leading-relaxed">
                            {chat.message}
                          </p>
                          <p
                            className={`text-[10px] mt-1 text-right opacity-70`}
                          >
                            {dateFormat(chat.timestamp, 'h:MM TT')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col flex-grow items-center justify-center opacity-50">
                {' '}
                {/* This block is rendered when userChats.length is 0 or less */}
                <>
                  <img
                    src="image/noChat.png"
                    alt="No Chat"
                    className="w-48 mb-4 grayscale"
                  />
                  <p className="text-black dark:text-white">
                    Start a new conversation
                  </p>
                </>
              </div>
            )}
            {filePreview && (
              <div className="absolute bottom-24 lg:bottom-20 left-4 right-4 bg-gray-2 dark:bg-meta-4 rounded-lg p-4 z-10 border border-stroke dark:border-strokedark shadow-lg">
                <button
                  className="absolute right-2 top-2 text-black dark:text-white"
                  onClick={() => {
                    setFilePreview(null);
                    setSelectedFile(null);
                  }}
                >
                  <IoClose className="" size={30} />
                </button>
                <div className="flex h-32 lg:h-40 justify-center items-center overflow-hidden">
                  {selectedFile?.type?.startsWith('image/') ? (
                    <div className="flex flex-col gap-y-1 items-center">
                      <p className="text-black dark:text-white">
                        {selectedFile.name}
                      </p>
                      <img src={filePreview} alt="Preview" className="h-40" />
                    </div>
                  ) : selectedFile?.type === 'application/pdf' ? (
                    <div className="flex flex-col gap-y-1 items-center">
                      <p className="text-black dark:text-white">
                        {selectedFile.name}
                      </p>
                      <AiOutlineFilePdf size={80} />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-y-1 items-center">
                      <p className="text-black dark:text-white">
                        {selectedFile?.name}
                      </p>
                      <FaFileAlt size={60} />{' '}
                      {/* Reduced size for better fit */}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="p-4 border-t border-stroke dark:border-strokedark bg-white dark:bg-boxdark">
              <div className="flex items-end gap-3 bg-gray-2 dark:bg-meta-4/20 p-2 rounded-2xl border border-stroke dark:border-strokedark focus-within:border-primary transition-all">
                <span className="flex-shrink-0">
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer p-2 hover:bg-white dark:hover:bg-boxdark rounded-full block transition-colors"
                  >
                    <IoIosAttach size={24} />
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    name="attachment"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </span>

                <textarea
                  placeholder="Type Message..."
                  className="flex-grow bg-transparent py-2 px-1 text-black outline-none dark:text-white resize-none max-h-32 text-sm leading-relaxed"
                  name="message"
                  value={message}
                  rows={1}
                  style={{ height: 'auto' }}
                  onChange={handleMessage}
                  onKeyDown={handleKeyDown}
                />

                <button
                  className={`flex items-center gap-2 rounded-lg bg-primary py-3 px-6 font-medium text-white hover:bg-opacity-90 transition-all ${
                    !message.trim() && !formdataValue
                      ? 'opacity-50 cursor-not-allowed'
                      : 'active:scale-95'
                  }`}
                  onClick={handleSubmitMessage}
                  disabled={!message.trim() && !formdataValue}
                >
                  <span className="hidden sm:inline">Send</span>
                  <BsFillSendFill />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex flex-grow flex-col justify-center items-center bg-gray-2 dark:bg-meta-4/10">
            <img
              src="image/chatimage.png"
              alt="Chat"
              className="w-1/2 max-w-[200px] mb-6 opacity-40"
            />
            <p className="text-xl font-medium text-black dark:text-white">
              Select a user to start chatting
            </p>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}
