import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import dateFormat from 'dateformat';
import {
  HiOutlineChatAlt2,
  HiOutlineUsers,
  HiOutlineSearch,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineArrowLeft,
} from 'react-icons/hi';
import DefaultLayout from '../../layout/DefaultLayout';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { apiUrl } from '../../redux/api';
import { AttachmentBubble } from './AttachmentBubble';

// --- Interfaces ---
interface Participant {
  userId: string;
  name: string;
}

interface Conversation {
  conversationId: string;
  conversationName: string;
  participants: Participant[];
  participantCount: number;
  lastMessage?: {
    messageId: string;
    message: string;
    senderId: string;
    senderName: string;
    timestamp: string;
    attachment: string | null;
  };
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  messageId: string;
  senderId: string;
  senderName: string;
  receiverId?: string;
  receiverName?: string;
  message: string;
  attachment?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

interface ConversationsResponse {
  success: boolean;
  message: string;
  data: {
    conversations: Conversation[];
    pagination: PaginationInfo;
  };
}

interface MessagesResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    conversationName: string;
    participants: Participant[];
    messages: Message[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalMessages: number;
      limit: number;
    };
  } & Partial<Conversation>;
}

// --- Main Component ---
const AdminConversations: React.FC = () => {
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // Detail View State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagePage, setMessagePage] = useState(1);
  const [messagePagination, setMessagePagination] = useState<
    PaginationInfo | any
  >(null);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Determine sides based on participants for consistent alignment
  const firstParticipantId = useMemo(() => {
    return currentConversation?.participants?.[0]?.userId;
  }, [currentConversation]);

  // Debounce search for production-grade performance
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Ref to track search term changes to prevent stale page fetches and race conditions
  const lastSearchRef = useRef(debouncedSearch);

  // Fetch Conversations List
  const fetchConversations = useCallback(async (pageNum: number, q: string) => {
    setLoadingList(true);
    setError(null);
    try {
      const response = await apiUrl.get<ConversationsResponse>(
        `/admin/conversation?page=${pageNum}&limit=20&search=${q}`,
      );

      // Guard: If the search term has changed since this request started, ignore it
      if (q !== lastSearchRef.current) return;

      if (response.data.success) {
        let fetched = response.data.data.conversations || [];

        // Enforce search filtering on the client side for guaranteed correctness
        if (q.trim()) {
          const term = q.toLowerCase();
          fetched = fetched.filter(conv => 
            conv.conversationName.toLowerCase().includes(term)
          );
        }

        setConversations((prev) => {
          const combined = pageNum === 1 ? fetched : [...prev, ...fetched];
          // Deduplicate by conversationId to prevent corruption if server pagination overlaps
          return combined.filter((item, index, self) =>
            index === self.findIndex((t) => t.conversationId === item.conversationId)
          );
        });
        setPagination(response.data.data.pagination);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch conversations');
    } finally {
      setLoadingList(false);
    }
  }, []);

  // Fetch Messages for Selected Conversation
  const fetchMessages = useCallback(async (id: string, pageNum: number) => {
    setLoadingMessages(true);
    try {
      const response = await apiUrl.get<MessagesResponse>(
        `/admin/get-conversation/${id}?page=${pageNum}&limit=50`,
      );
      if (response.data.success) {
        const detail = response.data.data;
        const fetchedMessages = detail.messages || [];
        setMessages((prev) =>
          pageNum === 1 ? fetchedMessages : [...prev, ...fetchedMessages],
        );
        setMessagePagination(detail.pagination || null);
        // Map 'id' to 'conversationId' to keep state compatible with Conversation type
        setCurrentConversation({
          ...detail,
          conversationId: detail.id,
        } as any);
      }
    } catch (err: any) {
      console.error('Failed to fetch messages', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Infinite Scroll Handler: Automatically fetch next page
  const handleSidebarScroll = () => {
    if (!sidebarRef.current || loadingList || !pagination) return;
    const { scrollTop, scrollHeight, clientHeight } = sidebarRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      if (page < pagination.totalPages) {
        setPage((prev) => prev + 1);
      }
    }
  };

  // Chat Infinite Scroll: Load more messages
  const handleChatScroll = () => {
    if (!chatContainerRef.current || loadingMessages || !messagePagination)
      return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      if (messagePage < messagePagination.totalPages) {
        setMessagePage((prev) => prev + 1);
      }
    }
  };

  useEffect(() => {
    // When the search term changes, we MUST reset pagination and clear results
    if (lastSearchRef.current !== debouncedSearch) {
      lastSearchRef.current = debouncedSearch;
      setConversations([]); 
      setPagination(null);   // Stop infinite scroll until new results for page 1 arrive
      if (page !== 1) {
        setPage(1);
        return; // The next effect cycle (triggered by setPage(1)) will perform the fetch
      }
    }

    fetchConversations(page, debouncedSearch);
  }, [page, debouncedSearch, fetchConversations]);

  useEffect(() => {
    if (selectedId) fetchMessages(selectedId, messagePage);
  }, [selectedId, messagePage, fetchMessages]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current && messagePage === 1) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, loadingMessages, messagePage]);

  const groupedMessages = useMemo(() => {
    return messages.reduce(
      (acc, msg) => {
        const date = msg.createdAt
          ? dateFormat(msg.createdAt, 'd mmmm yyyy')
          : 'Recent Messages';
        if (!acc[date]) acc[date] = [];
        acc[date].push(msg);
        return acc;
      },
      {} as Record<string, Message[]>,
    );
  }, [messages]);

  const handleSelectConversation = (conv: Conversation) => {
    setMessages([]);
    setMessagePage(1);
    setMessagePagination(null);
    setSelectedId(conv.conversationId);
    setCurrentConversation(conv);
  };

  return (
    <DefaultLayout>
      <Breadcrumb pageName="User Conversations" />

      <div className="flex h-[calc(100vh-190px)] overflow-hidden rounded-xl border border-stroke bg-white shadow-card dark:border-strokedark dark:bg-boxdark">
        {/* Left Sidebar: Conversation List */}
        <div
          className={`${
            selectedId ? 'hidden lg:flex' : 'flex'
          } w-full lg:w-96 flex-col border-r border-stroke dark:border-strokedark bg-gray-2 dark:bg-meta-4/10`}
        >
          <div className="p-4 border-b border-stroke dark:border-strokedark">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-bodydark2">
                <HiOutlineSearch size={18} />
              </span>
              <input
                type="text"
                placeholder="Search chats..."
                className="w-full bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg py-2 pl-10 pr-4 outline-none focus:border-primary text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div
            ref={sidebarRef}
            onScroll={handleSidebarScroll}
            className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-1"
          >
            {conversations.length === 0 && !loadingList ? (
              <div className="p-10 text-center text-sm opacity-50 italic">
                No chats found
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.conversationId}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                    selectedId === conv.conversationId
                      ? 'bg-primary/10 border-l-4 border-primary'
                      : 'hover:bg-white dark:hover:bg-boxdark border-l-4 border-transparent group'
                  }`}
                >
                  <div
                    className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 font-bold ${
                      selectedId === conv.conversationId
                        ? 'bg-primary text-white'
                        : 'bg-gray-3 dark:bg-meta-4 text-bodydark2 group-hover:bg-primary/20 group-hover:text-primary'
                    }`}
                  >
                    {conv.conversationName?.charAt(0).toUpperCase() || 'C'}
                  </div>
                  <div className="min-w-0 flex-grow">
                    <div className="flex justify-between items-start mb-0.5">
                      <h4
                        className={`font-semibold text-sm truncate pr-2 ${
                          selectedId === conv.conversationId
                            ? 'text-primary'
                            : 'text-black dark:text-white'
                        }`}
                      >
                        {conv.conversationName}
                      </h4>
                      <span
                        className={`text-[10px] whitespace-nowrap ${
                          selectedId === conv.conversationId
                            ? 'text-primary/80'
                            : 'text-bodydark2'
                        }`}
                      >
                        {(conv.lastMessage?.timestamp || conv.updatedAt) ? 
                          dateFormat(conv.lastMessage?.timestamp || conv.updatedAt, 'h:MM TT') 
                          : ''
                        }
                      </span>
                    </div>
                    <p className="text-xs text-bodydark truncate">
                      {conv.lastMessage?.message || 'No messages yet'}
                    </p>
                  </div>
                </button>
              ))
            )}
            {loadingList && (
              <div className={page === 1 ? '' : 'opacity-60'}>
                <LoadingSkeleton count={page === 1 ? 8 : 2} />
              </div>
            )}
          </div>
        </div>

        {/* Right Main: Message Detail View */}
        <div
          className={`${
            !selectedId ? 'hidden lg:flex' : 'flex'
          } flex-1 flex-col bg-white dark:bg-boxdark relative`}
        >
          {selectedId ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-stroke dark:border-strokedark sticky top-0 z-10 bg-white/80 dark:bg-boxdark/80 backdrop-blur-sm">
                <button
                  onClick={() => setSelectedId(null)}
                  className="lg:hidden p-2 -ml-2 text-primary"
                >
                  <HiOutlineArrowLeft size={24} />
                </button>
                <div className="flex-grow flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {currentConversation?.conversationName
                      ?.charAt(0)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-black dark:text-white leading-tight">
                      {currentConversation?.conversationName}
                    </h3>
                    <p className="text-[10px] uppercase font-bold text-bodydark2 tracking-wider">
                      {currentConversation?.participantCount} Participants
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-success bg-success/10 px-3 py-1 rounded-full">
                  {messages.length} Messages Logged
                </div>
              </div>

              {/* Messages Area */}
              <div
                ref={chatContainerRef}
                onScroll={handleChatScroll}
                className="flex-grow overflow-y-auto p-6 custom-scrollbar space-y-8 bg-gray-2/30 dark:bg-transparent"
              >
                {loadingMessages && messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
                    <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-medium">
                      Fetching conversation history...
                    </p>
                  </div>
                ) : (
                  Object.keys(groupedMessages).map((date) => (
                    <div key={date} className="space-y-4">
                      <div className="flex justify-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-bodydark2 bg-white dark:bg-meta-4 px-4 py-1 rounded-full shadow-sm border border-stroke dark:border-strokedark">
                          {date}
                        </span>
                      </div>
                      {groupedMessages[date].map((msg) => {
                        // If sender is the first participant, put on the left.
                        // Otherwise (second participant/admin), put on the right.
                        const sId = msg.senderId;
                        const isRightSide =
                          sId && firstParticipantId
                            ? sId !== firstParticipantId
                            : false;

                        // Fallback: If msg.sender.name is missing, find it in participants list
                        const displayName =
                          msg.senderName ||
                          currentConversation?.participants?.find(
                            (p) => String(p.userId) === String(sId),
                          )?.name ||
                          'User';

                        return (
                          <div
                            key={msg.messageId}
                            className={`flex flex-col ${
                              isRightSide ? 'items-end' : 'items-start'
                            }`}
                          >
                            <div
                              className={`flex items-center gap-2 mb-1 px-1 ${
                                isRightSide ? 'flex-row-reverse' : ''
                              }`}
                            >
                              <span className="text-[10px] font-bold text-bodydark2 uppercase">
                                {displayName}
                              </span>
                              <span className="text-[10px] text-bodydark opacity-60 font-medium">
                                {msg.createdAt
                                  ? dateFormat(msg.createdAt, 'h:MM TT')
                                  : ''}
                              </span>
                            </div>
                            <div
                              className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl shadow-sm transition-transform hover:scale-[1.01] ${
                                isRightSide
                                  ? 'bg-primary text-white rounded-tr-none'
                                  : 'bg-white dark:bg-meta-4 border border-stroke dark:border-strokedark text-black dark:text-white rounded-tl-none'
                              }`}
                            >
                              {msg.attachment && (
                                <AttachmentBubble
                                  url={msg.attachment}
                                  isSender={isRightSide}
                                />
                              )}
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {msg.message}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                {loadingMessages && messages.length > 0 && (
                  <div className="flex justify-center p-4">
                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </DefaultLayout>
  );
};

// --- Sub-Components ---
const LoadingSkeleton = ({ count = 5 }: { count?: number }) => (
  <>
    {[...Array(count)].map((_, i) => (
      <div key={i} className="animate-pulse p-3 flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-gray-2 dark:bg-meta-4"></div>
        <div className="flex-grow space-y-2">
          <div className="h-3 bg-gray-2 dark:bg-meta-4 rounded w-1/3"></div>
          <div className="h-2 bg-gray-2 dark:bg-meta-4 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-full opacity-40 p-10 text-center">
    <div className="bg-gray-2 dark:bg-meta-4 p-10 rounded-full mb-6">
      <HiOutlineChatAlt2 size={64} className="text-primary/40" />
    </div>
    <h3 className="text-xl font-bold text-black dark:text-white mb-2">
      Select a Conversation
    </h3>
    <p className="text-sm max-w-xs">
      Choose a conversation from the list on the left to view the full message
      history between users.
    </p>
  </div>
);

export default AdminConversations;
