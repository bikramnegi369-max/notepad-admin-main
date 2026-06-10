// Define types for props
interface UserProps {
  handleId: (id: string) => void;
  userId: string | null | undefined; // userId can be null
  users: ChatUser[];
}

interface ChatUser {
  id: string; // Standardized to 'id'
  name: string;
  lastMessage?: string;
  updatedAt?: string;
  newMessages: number;
  isOnline: boolean; // Standardized to 'isOnline'
  typing?: boolean;
}

export default function User({ handleId, userId, users }: UserProps) {
  return (
    <div className="p-4 h-full flex flex-col">
      <h1 className="text-xl font-bold text-black dark:text-white mb-4">
        Messages
      </h1>
      {users.map((e, i) => (
        <div
          className="mb-2 cursor-pointer"
          key={i}
          onClick={() => handleId(e.id)}
        >
          <div
            className={`flex gap-3 items-center p-3 rounded-lg transition-all ${
              userId === e.id
                ? 'bg-primary text-white shadow-md'
                : 'hover:bg-white dark:hover:bg-boxdark'
            }`}
          >
            <div
              className={`h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${
                userId === e?.id
                  ? 'bg-white text-primary'
                  : 'bg-primary text-white'
              } `}
            >
              {e.name?.charAt(0).toUpperCase()}
              {e.isOnline && (
                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-success ring-2 ring-white dark:ring-boxdark"></span>
              )}
            </div>
            <div className="flex  items-center justify-between w-full">
              <p
                className={`font-semibold text-sm ${
                  userId === e.id ? 'text-white' : 'text-black dark:text-white'
                }`}
              >
                {e?.name}
              </p>
              {e?.typing ? (
                <span className="text-[10px] italic">Typing...</span>
              ) : (
                e.newMessages > 0 && (
                  <div className=" flex justify-center items-center text-xs bg-danger text-white w-5 h-5 rounded-full">
                    {e?.newMessages}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
