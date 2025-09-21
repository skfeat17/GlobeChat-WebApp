import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Inbox() {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("accessToken");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchData = useCallback(async () => {
    try {
      if (!token) throw new Error("No access token");

      const [inboxRes, friendsRes] = await Promise.all([
        axios.get("https://globe-chat-api.vercel.app/api/v1/message/inbox", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("https://globe-chat-api.vercel.app/api/v1/users/friends", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setChats(inboxRes.data.data || []);
      setFriends(friendsRes.data.data || []);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || err.message || "Failed to load data"
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Polling every 5s
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex flex-col h-screen p-4 space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="flex space-x-4 overflow-x-auto">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <Skeleton className="w-14 h-14 rounded-full" />
              <Skeleton className="w-12 h-3 mt-2" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error)
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error}
      </div>
    );

  const activeFriends = friends.filter((f) => f.isOnline);
  const friendsChat = chats.filter((chat) =>
    friends.some((f) => f._id === chat.participant._id)
  );

const handleChatClick = (participantId) => {
  navigate(`/chat/${participantId}`);

  setTimeout(() => {
    axios.patch(
      `https://globe-chat-api.vercel.app/api/v1/message/chat/${participantId}/read`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(fetchData)
      .catch((err) => console.error("Failed to mark as read:", err));
  }, 0);
};


  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <h1 className="text-4xl font-bold text-black p-2 mt-5 ms-3">Inbox</h1>

      {/* Online friends bar */}
      <div className="px-4 py-2 my-3 overflow-x-auto">
        <div className="flex space-x-4">
          {currentUser._id && (
            <div className="flex flex-col items-center">
              <div className="relative">
                <Avatar className="w-14 h-14">
                  <AvatarImage
                    src={currentUser.avatar}
                    alt={currentUser.name}
                  />
                  <AvatarFallback>
                    {currentUser.name?.charAt(0) || "Y"}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              </div>
              <p className="mt-1 text-xs text-center w-16 truncate">You</p>
            </div>
          )}

          {activeFriends?.map((friend) => (
            <div
              key={friend._id}
              className="flex flex-col items-center cursor-pointer"
              onClick={() => handleChatClick(friend._id)}
            >
              <div className="relative">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={friend.avatar} alt={friend.name} />
                  <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${friend.isOnline ? "bg-green-500" : "bg-gray-400"
                    }`}
                />
              </div>
              <p className="mt-1 text-xs text-center w-16 truncate">
                {friend.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 pb-16">
        <h2 className="text-xl font-bold mb-2">Recent Chats</h2>
        {friendsChat.map((chat) => {
          const participant = chat.participant;
          const lastMsg = chat.lastMessage;

          const isSenderMe = lastMsg.senderId === currentUser._id;
          console.table([lastMsg, isSenderMe]);
          const isUnread = !lastMsg.isRead && !isSenderMe;

          // First name only
          const firstName = participant.name?.split(" ")[0] || participant.name;

          // Prefix
          const prefix = isSenderMe
            ? "You: "
            : `${firstName}: `;

          return (
            <Card
              key={chat._id}
              className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              onClick={() => handleChatClick(participant._id)}
            >
              <div className="relative">
                <Avatar>
                  <AvatarImage src={participant.avatar} alt={participant.name} />
                  <AvatarFallback>{firstName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${participant.isOnline ? "bg-green-500" : "bg-gray-400"
                    }`}
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold truncate max-w-[200px]">
                    {firstName}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {new Date(lastMsg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p
                  className={`text-sm truncate ${isUnread
                      ? "font-bold text-black"
                      : "text-gray-600 dark:text-gray-400"
                    }`}
                >
                  {prefix}
                  {lastMsg.message}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
