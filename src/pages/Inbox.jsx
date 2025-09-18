import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import Pusher from "pusher-js";

export default function Inbox() {
  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const accessToken = localStorage.getItem("accessToken");
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!accessToken) {
          setError("No access token found. Please login again.");
          setLoading(false);
          return;
        }

        const [inboxRes, friendsRes] = await Promise.all([
          axios.get("https://globe-chat-api.vercel.app/api/v1/message/inbox", {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get("https://globe-chat-api.vercel.app/api/v1/users/friends", {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        setChats(inboxRes.data.data || []);
        setFriends(friendsRes.data.data || []);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accessToken]);

  // ✅ Setup Pusher for real-time messages
  useEffect(() => {
    if (!user?._id) return;

    const pusher = new Pusher("if154a4e3ab24faa32519", {
      cluster: "ap2",
      authEndpoint: "https://globe-chat-api.vercel.app/api/v1/pusher/auth",
      auth: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    });

    // Subscribe to private channel for current user
    const channel = pusher.subscribe(`private-user-${user._id}`);

    channel.bind("new-message", (newMessage) => {
      setChats((prevChats) => {
        let updated = [...prevChats];
        const idx = updated.findIndex(
          (chat) => chat.participant._id === newMessage.sender._id
        );

        if (idx !== -1) {
          // Update existing chat
          updated[idx] = {
            ...updated[idx],
            lastMessage: {
              message: newMessage.message,
              createdAt: newMessage.createdAt,
              isRead: false, // new message = unread
              senderId: newMessage.sender._id,
              receiverId: newMessage.receiver?._id || newMessage.receiverId,
            },
          };
        } else {
          // Add new chat
          updated.unshift({
            _id: newMessage._id,
            participant: newMessage.sender,
            lastMessage: {
              message: newMessage.message,
              createdAt: newMessage.createdAt,
              isRead: false,
              senderId: newMessage.sender._id,
              receiverId: newMessage.receiver?._id || newMessage.receiverId,
            },
          });
        }

        // Sort by latest message
        return updated.sort(
          (a, b) =>
            new Date(b.lastMessage.createdAt) -
            new Date(a.lastMessage.createdAt)
        );
      });
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [user, accessToken]);

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

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error}
      </div>
    );
  }

  const markAsRead = async (chatUserId) => {
    try {
      const res = await axios.patch(
        `https://globe-chat-api.vercel.app/api/v1/message/chat/${chatUserId}/read`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      // Update local state so UI reflects read status immediately
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.participant._id === chatUserId
            ? {
                ...chat,
                lastMessage: {
                  ...chat.lastMessage,
                  isRead: true,
                },
              }
            : chat
        )
      );
    } catch (err) {
      console.error("Failed to mark messages as read", err);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <h1 className="text-4xl font-bold p-2 mt-5 ms-3">Inbox</h1>

      {/* Online Friends */}
      <div className="px-4 py-2 my-3">
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {/* You */}
          {user && (
            <div className="flex flex-col items-center">
              <div className="relative">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name?.charAt(0) || "Y"}</AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 block w-3 h-3 rounded-full bg-green-500 border-2 border-white"></span>
              </div>
              <p className="mt-1 text-xs text-center w-16 truncate">You</p>
            </div>
          )}

          {/* Other online friends */}
          {friends
            .filter((f) => f.isOnline)
            .map((friend) => (
              <div key={friend._id} className="flex flex-col items-center">
                <div className="relative">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={friend.avatar} alt={friend.name} />
                    <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 block w-3 h-3 rounded-full bg-green-500 border-2 border-white"></span>
                </div>
                <p className="mt-1 text-xs text-center w-16 truncate">
                  {friend.name}
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 pb-16">
        <h1 className="text-xl font-bold mb-2">Recent Chats</h1>
        {chats.map((chat) => {
          const last = chat.lastMessage || {};

          // robust extraction of senderId/receiverId (supports senderId or nested sender object)
          const senderId =
            last.senderId ||
            (last.sender && (last.sender._id || last.sender)) ||
            null;
          const receiverId =
            last.receiverId ||
            (last.receiver && (last.receiver._id || last.receiver)) ||
            null;

          // determine if the last message was sent by the current user
          const isSentByMe =
            senderId && user && String(senderId) === String(user._id);

          // Display name: "You" when current user sent it, otherwise participant's first name
          const senderName = isSentByMe
            ? "You"
            : chat.participant?.name?.split(" ")[0] || "Friend";

          // Determine bold: bold only if message was NOT sent by me and is unread
          const isUnreadForMe = !isSentByMe && last.isRead === false;

          // Safely get createdAt time
          const createdAt = last.createdAt || last.createdAt;

          return (
            <Card
              key={chat._id}
              onClick={() => {
                markAsRead(chat.participant._id); // ✅ mark read
                navigate(`/chat/${chat.participant._id}`);
              }}
              className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              <div className="relative">
                <Avatar>
                  <AvatarImage
                    src={chat.participant.avatar}
                    alt={chat.participant.name}
                  />
                  <AvatarFallback>
                    {chat.participant.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                    chat.participant.isOnline ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold truncate max-w-[120px] sm:max-w-[200px]">
                    {chat.participant.name}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {createdAt
                      ? new Date(createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>

                <p
                  className={`text-sm overflow-hidden text-ellipsis whitespace-nowrap ${
                    isUnreadForMe
                      ? "font-bold text-black dark:text-white"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {senderName}: {last.message}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
