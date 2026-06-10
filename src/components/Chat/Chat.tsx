import { BsFillSendFill } from 'react-icons/bs';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { IoIosAttach } from 'react-icons/io';
import socket, { CustomSocket } from '../../socket';
import dateFormat from 'dateformat';
import { IoArrowBack } from 'react-icons/io5';
import { useParams } from 'react-router-dom';
import DefaultLayout from '../../layout/DefaultLayout';
import Breadcrumb from '../Breadcrumbs/Breadcrumb';
import User from './User';
import { toast } from 'react-toastify';
import { AttachmentBubble } from './AttachmentBubble';
import { AttachmentTray } from './AttachmentTray';

// Define types for better clarity and type safety
interface ChatUser {
  id: string; // Standardized to 'id'
  name: string;
  lastMessage?: string;
  updatedAt?: string;
  newMessages: number;
  isOnline: boolean; // Standardized to 'isOnline'
  typing?: boolean;
}

interface ChatMessage {
  _id?: string;
  from: string; // The actual sender's ID (user or admin)
  to: string; // The recipient's ID
  sender: string;
  message: string;
  attachment?: string;
  attachmentName?: string;
  createdAt: string; // Standardized to 'createdAt'
}

export default function Chat() {
  const { id, name } = useParams();
  const [adminId] = useState(() => localStorage.getItem('adminID'));
  const [adminName] = useState(() => localStorage.getItem('adminName'));

  const [userId, setUserId] = useState<{ sender: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessages] = useState('');
  const [userChats, setUserChats] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);

  // Timer to clear typing status
  const typingTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const activeUserIdRef = useRef<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Production validation: prevent oversized uploads (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
    // reset so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMessage = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessages(e.target.value);

      if (userId?.sender) {
        socket.emit('typing', { to: userId.sender });
      }
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

    // Capture before clearing state
    const fileSnap = selectedFile;
    const previewSnap = filePreview;

    setMessages('');
    setFilePreview(null);
    setSelectedFile(null);

    try {
      let fileData: { name: string; type: string; data: string } | null = null;
      if (fileSnap) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(fileSnap);
        });
        fileData = { name: fileSnap.name, type: fileSnap.type, data: base64 };
      }

      const optimisticId = `optimistic-${Date.now()}`;
      const localMsg: ChatMessage = {
        _id: optimisticId,
        from: adminId || adminName || 'Admin',
        sender: adminId || adminName || 'Admin',
        to: userId.sender,
        message: trimmedMessage,
        attachment: previewSnap || undefined,
        attachmentName: fileSnap?.name,
        createdAt: new Date().toISOString(),
      };
      setUserChats((prev) => [...prev, localMsg]);

      socket.emit('private message', {
        message: trimmedMessage,
        selectedFile: fileData,
        filePath: fileSnap?.name || null,
        to: userId.sender,
        sender: adminId || adminName || 'Admin',
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId.sender
            ? {
                ...u,
                lastMessage: trimmedMessage || '📎 Attachment',
                updatedAt: new Date().toISOString(),
              }
            : u,
        ),
      );
    } catch (error) {
      toast.error('Failed to send message.');
    }
  }, [message, selectedFile, filePreview, userId, adminId, adminName]);

  const handleId = useCallback((id: string) => {
    const selected = { sender: id };
    setUserId(selected);
    activeUserIdRef.current = id;
    setFilePreview(null);
    setSelectedFile(null);

    // Reset unread count locally when entering the chat
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, newMessages: 0 } : u)),
    );

    socket.emit('messages', id);
  }, []);

  // Initialize selection from URL params
  useEffect(() => {
    if (id) handleId(id);
  }, [id, handleId]);

  const initSocketConnection = useCallback(() => {
    const storedId = localStorage.getItem('adminID');
    const storedName = localStorage.getItem('adminName');
    const token = localStorage.getItem('token');

    if (
      !storedId ||
      storedId === 'null' ||
      !storedName ||
      storedName === 'null'
    ) {
      console.warn('Socket aborted: Missing credentials.');
      return;
    }

    const currentSocket = socket as CustomSocket;
    if (currentSocket.connected) currentSocket.disconnect();

    const sessionID = localStorage.getItem('sessionID');

    currentSocket.auth = {
      sessionID: sessionID || undefined,
      token: token || undefined,
      name: storedName || undefined,
      userId: storedId || undefined,
    };

    currentSocket.connect();

    currentSocket.on('connect', () => {
      currentSocket.emit('messageList');
      currentSocket.emit('getOnlineUsers');
    });

    currentSocket.on('messages', (data: ChatMessage[]) => {
      setUserChats(data);
    });

    currentSocket.on('private message', (data: ChatMessage) => {
      const activeId = activeUserIdRef.current;
      const myId = localStorage.getItem('adminID');
      const myName = localStorage.getItem('adminName');
      const isFromMe =
        data.from === myId ||
        data.sender === myId ||
        data.from === myName ||
        data.sender === myName;
      const isFromActive = data.from === activeId || data.sender === activeId;

      if (isFromMe) {
        setUserChats((prev) => {
          const idx = prev.findIndex((m) => {
            const isOptimistic = m._id?.startsWith('optimistic-');
            const messagesMatch =
              (m.message || '').trim() === (data.message || '').trim();
            // Match if both have attachments or both don't
            const attachmentStatusMatch =
              !!m.attachmentName === !!(data.attachmentName || data.attachment);

            return isOptimistic && messagesMatch && attachmentStatusMatch;
          });

          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = {
              ...data,
              // Preserve the local file name if server doesn't provide it
              attachmentName:
                data.attachmentName || updated[idx].attachmentName,
            };
            return updated;
          }

          // Fallback: If no optimistic match found, prevent duplicate if ID exists, else append
          if (data._id && prev.some((m) => m._id === data._id)) return prev;
          return [...prev, data];
        });
      } else if (activeId && isFromActive) {
        setUserChats((prevChats) => [...prevChats, data]);
      }

      const otherPartyId = isFromMe ? data.to : data.from || data.sender;
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === otherPartyId
            ? {
                ...user,
                lastMessage: data.message || '📎 Attachment',
                updatedAt: data.createdAt,
                newMessages:
                  !isFromMe && user.id !== activeId
                    ? user.newMessages + 1
                    : user.id === activeId
                    ? 0
                    : user.newMessages,
              }
            : user,
        ),
      );
    });

    currentSocket.on('messageList', (conversations: ChatUser[]) => {
      const activeId = activeUserIdRef.current;
      setUsers(
        conversations.map((u) =>
          u.id === activeId ? { ...u, newMessages: 0 } : u,
        ),
      );
    });

    currentSocket.on('getOnlineUsers', (onlineUsers: ChatUser[]) => {
      setUsers((prev) =>
        prev.map((u) => ({
          ...u,
          isOnline: onlineUsers.some((online) => online.id === u.id),
        })),
      );
    });

    currentSocket.on('typing', ({ from }: { from: string }) => {
      setUsers((prev) =>
        prev.map((u) => (u.id === from ? { ...u, typing: true } : u)),
      );
      if (typingTimers.current[from]) clearTimeout(typingTimers.current[from]);
      typingTimers.current[from] = setTimeout(() => {
        setUsers((prev) =>
          prev.map((u) => (u.id === from ? { ...u, typing: false } : u)),
        );
      }, 3000);
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

    return () => {
      Object.values(typingTimers.current).forEach(clearTimeout);
      currentSocket.off('messageList');
      currentSocket.off('getOnlineUsers');
      currentSocket.off('typing');
      currentSocket.off('messages');
      currentSocket.off('private message');
      currentSocket.off('session');
      currentSocket.off('connect_error');
      currentSocket.off('users');
      currentSocket.disconnect();
    };
  }, [adminId, adminName]);

  useEffect(() => {
    return initSocketConnection();
  }, [initSocketConnection]);

  const groupedMessages = useMemo(() => {
    return userChats.reduce(
      (acc, message) => {
        const date = dateFormat(message.createdAt, 'd mmmm yyyy');
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

  const activeUser = users.find((u) => u.id === userId?.sender);

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
            userId ? 'hidden lg:block' : 'w-full' // Hide sidebar on mobile if a user is selected
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
                        // Online/Offline indicator
                        activeUser?.isOnline ? 'bg-success' : 'bg-danger'
                      }`}
                    ></span>
                    <span className="text-xs font-medium uppercase text-body dark:text-bodydark">
                      {activeUser?.isOnline ? 'Online' : 'Offline'}
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
                    {groupedMessages[date].map((chat: ChatMessage) => {
                      const isFromMe =
                        chat.from === adminId ||
                        chat.sender === adminId ||
                        chat.from === adminName ||
                        chat.sender === adminName;

                      return (
                        <div
                          key={chat._id || `${chat.from}-${chat.createdAt}`}
                          className={`flex ${
                            isFromMe ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-2 shadow-sm animate-fade-in-up ${
                              isFromMe
                                ? 'bg-primary text-white rounded-br-none'
                                : 'bg-gray-2 dark:bg-meta-4 text-black dark:text-white rounded-bl-none'
                            }`}
                          >
                            {chat.attachment ? (
                              <AttachmentBubble
                                url={chat.attachment}
                                fileName={chat.attachmentName}
                                isSender={isFromMe}
                                isOptimistic={chat._id?.startsWith(
                                  'optimistic-',
                                )}
                              />
                            ) : null}
                            <p className="text-sm leading-relaxed">
                              {chat.message}
                            </p>
                            <p
                              className={`text-[10px] mt-1 text-right opacity-70`}
                            >
                              {dateFormat(chat.createdAt, 'h:MM TT')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
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
            {activeUser?.typing && (
              <div className="px-4 py-2 text-xs italic text-bodydark2 animate-pulse">
                {activeUser.name} is typing...
              </div>
            )}

            {filePreview && selectedFile && (
              <AttachmentTray
                file={selectedFile}
                preview={filePreview}
                onRemove={() => {
                  setFilePreview(null);
                  setSelectedFile(null);
                }}
              />
            )}
            <div className="p-4 border-t border-stroke dark:border-strokedark bg-white dark:bg-boxdark">
              <div className="flex items-end gap-3 bg-gray-2 dark:bg-meta-4/10 p-2 rounded-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <span className="flex-shrink-0">
                  <label
                    htmlFor="file-upload-chat"
                    className="cursor-pointer p-2 hover:bg-white dark:hover:bg-boxdark rounded-full block transition-all"
                  >
                    <IoIosAttach size={24} />
                  </label>
                  <input
                    ref={fileInputRef}
                    id="file-upload-chat"
                    type="file"
                    name="attachment"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </span>

                <textarea
                  placeholder="Type Message..." // Changed placeholder for clarity
                  className="flex-grow bg-transparent py-2 px-1 text-black outline-none dark:text-white resize-none text-sm"
                  name="message"
                  value={message}
                  rows={1}
                  style={{ height: 'auto' }}
                  onChange={handleMessage}
                  onKeyDown={handleKeyDown}
                />

                <button
                  className={`flex items-center gap-2 rounded-lg bg-primary py-3 px-6 font-medium text-white hover:bg-opacity-90 transition-all ${
                    !message.trim() && !selectedFile
                      ? 'opacity-50 cursor-not-allowed'
                      : 'active:scale-95'
                  }`}
                  onClick={handleSubmitMessage}
                  disabled={!message.trim() && !selectedFile}
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
