import { useEffect, useState } from "react";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import toast, { Toaster } from "react-hot-toast";
import { UserMinus, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState(null);

  const accessToken = localStorage.getItem("accessToken");
  const baseurl = "https://globe-chat-api.vercel.app/api/v1";
  const navigate = useNavigate();

  // ✅ Fetch friends
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await axios.get(`${baseurl}/users/friends`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setFriends(res.data.data || []);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to fetch friends");
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, [accessToken]);

  // ✅ Remove friend
  const handleRemoveFriend = async (friend) => {
    try {
      await axios.post(
        `${baseurl}/users/friends/remove/${friend._id}`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      // Update state immediately
      setFriends((prev) => prev.filter((f) => f._id !== friend._id));

      toast.success(`${friend.name} has been removed from the friend list`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove friend");
    } finally {
      setSelectedFriend(null);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <Toaster position="top-right" reverseOrder={false} />
      <h2 className="text-3xl font-semibold mb-4">Friends</h2>

      {loading ? (
        <div className="space-y-3">
          {Array(6)
            .fill(null)
            .map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
        </div>
      ) : friends.length === 0 ? (
        <p className="text-muted-foreground">No friends yet</p>
      ) : (
        <div className="space-y-3">
          {friends.map((friend) => (
            <div
              key={friend._id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={friend.avatar} alt={friend.name} />
                  <AvatarFallback>{friend.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="font-medium">{friend.name}</p>
              </div>

              <div className="flex items-center gap-3">
           
                {/* ✅ Remove Icon */}
                <UserMinus
                  className="w-5 h-5 text-red-500 cursor-pointer"
                  onClick={() => setSelectedFriend(friend)}
                />
                     {/* ✅ Chat Icon */}
                <MessageCircle
                  className="w-5 h-5 text-blue-500 cursor-pointer"
                  onClick={() => navigate(`/chat/${friend._id}`)}
                />

              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ Confirmation Dialog */}
      <AlertDialog
        open={!!selectedFriend}
        onOpenChange={() => setSelectedFriend(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to remove{" "}
              {selectedFriend?.name || "this friend"}?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => handleRemoveFriend(selectedFriend)}
            >
              Yes, Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
