import { BsFillSendFill } from 'react-icons/bs';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { FaFileAlt } from 'react-icons/fa';
import { IoIosAttach } from 'react-icons/io';
import socket, { CustomSocket } from '../../socket'; // Import CustomSocket type
import dateFormat from 'dateformat';
import { IoClose, IoArrowBack } from 'react-icons/io5';
import { AiOutlineFilePdf } from 'react-icons/ai';
import DefaultLayout from '../../layout/DefaultLayout';
import Breadcrumb from '../Breadcrumbs/Breadcrumb';
import User from './User';
import { toast } from 'react-toastify';

// Define types for better clarity and type safety
interface ChatUser {
  _id: string; // User ID from database
  name: string;
  userID: string; // Socket.io user ID
  self: boolean;
  connected: boolean; // Online status
  newMessages: number;
}

interface ChatMessage {
  _id?: string; // Optional, might not exist for unsent messages
  sender: string; // User ID of the sender (adminId or userId.sender)
  to: string; // User ID of the receiver
  message: string;
  timestamp: string; // ISO string or similar
  attachment?: string; // URL to attachment
  filePath?: string; // Original file name
}

export default function AdminChat() {
  const currentAdminId = localStorage.getItem('adminID');
  const currentAdminName = localStorage.getItem('adminName');
  const [userId, setUserId] = useState<{ sender: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formdataValue, setFormdataValue] = useState(false);
  const [message, setMessages] = useState('');
  const [userChats, setUserChats] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]); // Use ChatUser type

  // Using useRef for activeUserId to avoid re-renders when it changes, but still accessible in effects
  const activeUserIdRef = useRef<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [filePath, setFilePath] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const handleFileChange = (event: any) => {
    const file = event.target.files?.[0];
    if (file) {
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
      // Corrected type to HTMLTextAreaElement
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

      // Optimistic update
      const localMsg: ChatMessage = {
        sender: currentAdminId || 'me', // Use currentAdminId
        to: userId.sender,
        message: trimmedMessage,
        timestamp: new Date().toISOString(),
        filePath: filePath || undefined, // Display file name if present
      };
      setUserChats((prev) => [...prev, localMsg]);

      setMessages('');
      setFilePreview(null);
      setSelectedFile(null);
      setFormdataValue(false);
    } catch (error) {
      toast.error('Failed to send message.');
      console.error('Error sending message:', error);
    }
  }, [message, selectedFile, filePath, userId]); // adminId is not a direct dependency of the callback itself, but its value is read inside.

  const handleId = useCallback(
    (id: string) => {
      // userId is not a direct dependency for this function's logic
      const selected = { sender: id };
      // setUserId updates state, but the callback itself doesn't directly use userId from its closure
      setUserId(selected);
      activeUserIdRef.current = id;
      setFilePreview(null);
      setSelectedFile(null);
      setFormdataValue(false); // Reset formdataValue
      socket.emit('messages', id);
    },
    [], // Removed userId from dependencies as it's not directly used in the callback's logic
  );

  const initSocketConnection = useCallback(() => {
    const currentAdminId = localStorage.getItem('adminID');
    const currentAdminName = localStorage.getItem('adminName');

    if (!currentAdminId || !currentAdminName || currentAdminId === 'null') {
      console.error(
        'Admin credentials missing. Redirecting to login or preventing connection.',
      );
      toast.error('Admin credentials missing. Please log in.');
      return;
    }
    const currentSocket = socket as CustomSocket; // Cast to CustomSocket

    // Important: Disconnect before changing auth to avoid "invalid username" cache
    if (currentSocket.connected) currentSocket.disconnect();

    const sessionID = localStorage.getItem('sessionID');

    // Set initial auth. If session exists, try it; otherwise use credentials.
    currentSocket.auth = sessionID
      ? { sessionID }
      : { username: currentAdminName, userId: currentAdminId };

    currentSocket.connect();

    currentSocket.on('messages', (data: ChatMessage[]) => {
      setUserChats(data);
    });

    currentSocket.on('private message', (data: ChatMessage) => {
      const activeId = activeUserIdRef.current;
      // Only add message if it's for the currently active chat or from the active user
      // For AdminChat, we want to see messages from the active user and our own sent messages.
      // Optimistic update handles our own messages, so this should primarily catch incoming.
      if (
        activeId &&
        (data.sender === activeId || data.to === currentAdminId)
      ) {
        // Check if message is for us
        setUserChats((prevChats) => {
          // Use currentAdminId
          return [...prevChats, data];
        });
      }
      // Also update new message count for the sender in the user list
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
        // Force update auth with credentials so the next retry attempt succeeds
        const name = localStorage.getItem('adminName');
        const id = localStorage.getItem('adminID');
        if (name && id) {
          currentSocket.auth = { username: name, userId: id };
        }
      }
    });

    currentSocket.on('users', (socketUsers: ChatUser[]) => {
      // Update the users list, preserving existing newMessages count if user is already known
      setUsers((prevUsers) => {
        const updatedUsers = socketUsers.map((socketUser) => {
          const existingUser = prevUsers.find(
            (u) => u.userID === socketUser.userID,
          );
          return {
            ...socketUser,
            newMessages: existingUser ? existingUser.newMessages : 0, // Preserve newMessages count
            connected: socketUser.connected, // Ensure connected status is updated
          };
        });
        return updatedUsers;
      });
    });
  }, []);

  useEffect(() => {
    initSocketConnection();

    return () => {
      socket.off('messages');
      socket.off('private message');
      socket.off('session');
      socket.off('connect_error');
      socket.off('users');
      socket.disconnect();
    };
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
      // Corrected type to HTMLTextAreaElement
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmitMessage();
      }
    },
    [handleSubmitMessage],
  );
  return (
    <DefaultLayout>
      <Breadcrumb pageName="Admin Chat" />
      <div className="flex h-[calc(100vh-200px)] overflow-hidden rounded-xl border border-stroke bg-white shadow-card dark:border-strokedark dark:bg-boxdark">
        {/* Sidebar: Hidden on mobile when a chat is active */}
        <div
          className={`${
            userId ? 'hidden lg:block' : 'w-full'
          } lg:w-80 border-r border-stroke dark:border-strokedark overflow-y-auto bg-gray-2 dark:bg-meta-4/10 flex-shrink-0`}
        >
          <User handleId={handleId} userId={userId?.sender} users={users} />
        </div>

        {/* Chat Area: Full width on mobile when active */}
        {userId ? (
          <div className="relative flex flex-col flex-grow bg-white dark:bg-boxdark w-full lg:w-3/4">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-stroke dark:border-strokedark bg-white dark:bg-boxdark sticky top-0 z-10">
              <button
                onClick={() => setUserId(null)}
                className="lg:hidden flex items-center gap-1 text-primary font-medium transition-colors"
              >
                <IoArrowBack size={20} />
                <span>Back</span>
              </button>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                  {activeUser?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="font-semibold text-black dark:text-white leading-none">
                    {activeUser?.name || 'Loading...'}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        activeUser?.connected ? 'bg-success' : 'bg-danger'
                      }`}
                    ></span>
                    <span className="text-[10px] text-body font-medium uppercase">
                      {activeUser?.connected ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {userChats?.length > 0 ? (
              <div
                ref={chatContainerRef}
                className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar" // Added custom-scrollbar
              >
                {Object.keys(groupedMessages).map((date, index) => (
                  <div key={index} className="space-y-4">
                    <div className="flex justify-center my-4">
                      <span className="rounded-full bg-gray-2 dark:bg-meta-4 px-4 py-1 text-[10px] uppercase font-bold tracking-widest text-bodydark shadow-sm">
                        {date}
                      </span>
                    </div>
                    {groupedMessages[date].map((chat: any) => (
                      <div
                        key={chat._id || `${chat.sender}-${chat.timestamp}`} // Fallback key for unsent messages
                        className={`flex ${
                          // Use currentAdminId for comparison
                          chat.sender === currentAdminId // Check if the message was sent by the current admin
                            ? 'justify-end'
                            : 'justify-start'
                        }`}
                      >
                        {chat.sender !== currentAdminId && ( // Display avatar for received messages
                          <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold mr-2 flex-shrink-0">
                            {users
                              .find((u) => u._id === chat.sender)
                              ?.name?.charAt(0)
                              .toUpperCase() || 'U'}
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-2 shadow-sm animate-fade-in-up ${
                            chat.sender === currentAdminId
                              ? 'bg-primary text-white rounded-br-none' // Admin's message
                              : 'bg-gray-2 dark:bg-meta-4 text-black dark:text-white rounded-bl-none' // User's message
                          }`}
                        >
                          {chat.attachment ? (
                            <div className="mb-2 bg-black/10 dark:bg-white/10 rounded-lg p-3 flex flex-col items-center gap-2 border border-white/10">
                              {chat.attachment.match(
                                /\.(jpeg|jpg|gif|png)$/i,
                              ) ? (
                                <img
                                  src={`${
                                    import.meta.env.VITE_API_URL
                                  }/public/attachments/${chat.attachment}`}
                                  alt="Attachment"
                                  className="max-h-40 rounded"
                                />
                              ) : (
                                <FaFileAlt size={32} className="opacity-40" />
                              )}
                              <button
                                className="flex items-center gap-2 text-xs font-bold hover:underline"
                                onClick={() => handleClick(chat.attachment)}
                              >
                                {chat.filePath || 'View Attachment'}
                                {chat.attachment.endsWith('.pdf') ? (
                                  <AiOutlineFilePdf size={14} />
                                ) : (
                                  <FaFileAlt size={14} />
                                )}
                              </button>
                            </div>
                          ) : null}
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {chat.message}
                          </p>
                          <p className="text-[10px] mt-1 text-right opacity-70">
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
                <div className="bg-gray-2 dark:bg-meta-4 p-8 rounded-full mb-4">
                  <BsFillSendFill size={40} className="text-primary/30" />
                </div>
                <p className="text-black dark:text-white">
                  Start a new conversation
                </p>
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
                      {' '}
                      {/* Reduced gap-y */}
                      <p className="text-black dark:text-white">
                        {selectedFile.name}
                      </p>
                      <img src={filePreview} alt="Preview" className="h-40" />
                    </div>
                  ) : selectedFile?.type === 'application/pdf' ? (
                    <div className="flex flex-col gap-y-1 items-center">
                      {' '}
                      {/* Reduced gap-y */}
                      <p className="text-black dark:text-white">
                        {selectedFile.name}
                      </p>
                      <AiOutlineFilePdf size={60} />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-y-1 items-center">
                      {' '}
                      {/* Reduced gap-y */}
                      <p className="text-black dark:text-white">
                        {selectedFile.name}
                      </p>
                      <FaFileAlt size={60} />
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="p-4 border-t border-stroke dark:border-strokedark bg-white dark:bg-boxdark">
              <div className="flex items-end gap-3 bg-gray-2 dark:bg-meta-4/10 p-2 rounded-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <span className="flex-shrink-0">
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer p-2 hover:bg-white dark:hover:bg-boxdark rounded-full block transition-all"
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
                  className="flex-grow bg-transparent py-2 px-1 text-black outline-none dark:text-white resize-none text-sm"
                  name="message"
                  value={message}
                  onChange={handleMessage}
                  onKeyDown={handleKeyDown}
                  rows={1}
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
