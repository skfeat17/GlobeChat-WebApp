import { useEffect, useState } from "react";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster, toast } from "react-hot-toast";
import { UserPlus, MessageSquare, UserMinus, Loader2 } from "lucide-react";
import BottomNav from "@/components/ui/BottomNav";

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState({});
  const [currentUser, setCurrentUser] = useState(null); // holds logged-in user

  const accessToken = localStorage.getItem("accessToken");
  const baseurl = "https://globe-chat-api.vercel.app/api/v1";

  // ✅ Fetch current user (to get friends array)
  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get(`${baseurl}/users/profile`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setCurrentUser(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch profile");
    }
  };

  // ✅ Fetch users by query
  const fetchUsers = async (search) => {
    if (!search.trim()) {
      setUsers([]);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${baseurl}/users/search?q=${search}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setUsers(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  // ⌨️ Debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchUsers(query);
    }, 500);
    return () => clearTimeout(delay);
  }, [query]);

  // 🔃 Load current user on mount
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // ➕ Add friend
  const handleAddFriend = async (user) => {
    setProcessing((prev) => ({ ...prev, [user._id]: true }));
    try {
      await axios.post(
        `${baseurl}/users/friends/add/${user._id}`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      // Update local friends array
      setCurrentUser((prev) => ({
        ...prev,
        friends: [...prev.friends, user._id],
      }));

      toast.success(`${user.name} has been added to your friend list`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add friend");
    } finally {
      setProcessing((prev) => ({ ...prev, [user._id]: false }));
    }
  };

  // ➖ Remove friend
  const handleRemoveFriend = async (user) => {
    setProcessing((prev) => ({ ...prev, [user._id]: true }));
    try {
      await axios.post(
        `${baseurl}/users/friends/remove/${user._id}`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      // Update local friends array
      setCurrentUser((prev) => ({
        ...prev,
        friends: prev.friends.filter((id) => id !== user._id),
      }));

      toast.success(`${user.name} has been removed from your friend list`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove friend");
    } finally {
      setProcessing((prev) => ({ ...prev, [user._id]: false }));
    }
  };

  // 💬 Start chat
  const handleStartChat = (user) => {
    toast.success(`Starting chat with ${user.name}...`);
    // TODO: Navigate to chat later
  };

  return (
    <div className="max-w-md mx-auto p-4 mb-20">
      <Toaster position="top-right" reverseOrder={false} />

      {/* Title */}
      <h2 className="text-3xl font-semibold mb-4">Discover</h2>

      {/* Search bar */}
      <Input
        type="text"
        placeholder="Search users..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-4"
      />

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : users.length === 0 && query ? (
        <p className="text-muted-foreground">No users found</p>
      ) : (
        <div className="space-y-3">
          {users.map((user) => {
            const isFriend =
              currentUser?.friends?.includes(user._id) || false;

            return (
              <div
                key={user._id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                {/* User Info */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {/* Online status dot */}
                    <span
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                        user.isOnline ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {processing[user._id] ? (
                    <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
                  ) : isFriend ? (
                    <UserMinus
                      className="w-5 h-5 text-red-500 cursor-pointer"
                      onClick={() => handleRemoveFriend(user)}
                    />
                  ) : (
                    <UserPlus
                      className="w-5 h-5 text-green-500 cursor-pointer"
                      onClick={() => handleAddFriend(user)}
                    />
                  )}

                  {/* Start chat */}
                  <MessageSquare
                    className="w-5 h-5 text-blue-500 cursor-pointer"
                    onClick={() => handleStartChat(user)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
