import React, { useEffect, useState } from "react";
import axios from "axios";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Inbox() {
  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


const activeFriends = friends.filter((f) => {
  return f.isOnline;
});

  // Fetch friends & inbox
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
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
    };
    fetchData();
  }, []);

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

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <h1 className="text-4xl font-bold text-black p-2 mt-5 ms-3">Inbox</h1>

      {/* Online friends bar */}
      <div className="px-4 py-2 my-3 overflow-x-auto">
        <div className="flex space-x-4">
          {/* Current user */}
          {currentUser._id && (
            <div className="flex flex-col items-center">
              <div className="relative">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                  <AvatarFallback>
                    {currentUser.name?.charAt(0) || "Y"}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              </div>
              <p className="mt-1 text-xs text-center w-16 truncate">You</p>
            </div>
          )}

          {/* Friends with isOnline check */}
       
          {activeFriends?.map((friend) => (
            <div
              key={friend._id}
              className="flex flex-col items-center cursor-pointer"
              onClick={() => navigate(`/chat/${friend._id}`)}
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
        {chats.map((chat) => {
          const participant = chat.participant;
          return (
            <Card
              key={chat._id}
              className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              onClick={() => navigate(`/chat/${participant._id}`)}
            >
              <div className="relative">
                <Avatar>
                  <AvatarImage src={participant.avatar} alt={participant.name} />
                  <AvatarFallback>{participant.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${participant.isOnline ? "bg-green-500" : "bg-gray-400"
                    }`}
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold truncate max-w-[200px]">
                    {participant.name}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {chat.lastMessage.message}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
