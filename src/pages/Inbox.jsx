import React, { useEffect, useState } from "react"
import axios from "axios"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useNavigate } from "react-router-dom";


export default function Inbox() {
  const navigate = useNavigate();

  const [chats, setChats] = useState([])
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken")
        if (!accessToken) {
          setError("No access token found. Please login again.")
          setLoading(false)
          return
        }

        const [inboxRes, friendsRes] = await Promise.all([
          axios.get("https://globe-chat-api.vercel.app/api/v1/message/inbox", {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get("https://globe-chat-api.vercel.app/api/v1/users/friends", {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ])

        setChats(inboxRes.data.data || [])
        setFriends(friendsRes.data.data || [])
      } catch (err) {
        console.error(err)
        setError(err.response?.data?.message || "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col h-screen p-4 space-y-6">
        {/* Header skeleton */}
        <Skeleton className="h-8 w-32" />

        {/* Online friends skeleton */}
        <div className="flex space-x-4 overflow-x-auto">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <Skeleton className="w-14 h-14 rounded-full" />
              <Skeleton className="w-12 h-3 mt-2" />
            </div>
          ))}
        </div>

        {/* Chats skeleton */}
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
    )
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <h1 className="text-4xl sm:text-4xl font-bold text-black-500 p-2 mt-5 ms-3">Inbox</h1>

           {/* Online Friends */}
      <div className="px-4 py-2 my-3">
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {/* Always show current user as "You" */}
          {(() => {
            try {
              const user = JSON.parse(localStorage.getItem("user"))
              if (user) {
                return (
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <Avatar className="w-14 h-14">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name?.charAt(0) || "Y"}</AvatarFallback>
                      </Avatar>
                      {/* Always show green dot for yourself */}
                      <span className="absolute bottom-0 right-0 block w-3 h-3 rounded-full bg-green-500 border-2 border-white"></span>
                    </div>
                    <p className="mt-1 text-xs text-center w-16 truncate">You</p>
                  </div>
                )
              }
            } catch (err) {
              console.error("Failed to load user from localStorage", err)
            }
            return null
          })()}

          {/* Other online friends */}
          {friends.filter(f => f.isOnline).map(friend => (
            <div key={friend._id} className="flex flex-col items-center">
              <div className="relative">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={friend.avatar} alt={friend.name} />
                  <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 block w-3 h-3 rounded-full bg-green-500 border-2 border-white"></span>
              </div>
              <p className="mt-1 text-xs text-center w-16 truncate">{friend.name}</p>
            </div>
          ))}
        </div>
      </div>


      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 pb-16">
        <h1 className="text-xl sm:text-xl font-bold text-black-700 mb-2">Recent Chats</h1>
        {chats.map((chat) => (
        <Card
  key={chat._id}
  onClick={() => navigate(`/chat/${chat.participant._id}`)}
  className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
>
  <div className="relative">
    <Avatar>
      <AvatarImage src={chat.participant.avatar} alt={chat.participant.name} />
      <AvatarFallback>{chat.participant.name?.charAt(0)}</AvatarFallback>
    </Avatar>
    {/* Online status dot */}
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
        {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
    <p className="text-sm text-gray-600 dark:text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap">
      {chat.lastMessage.message}
    </p>
  </div>
</Card>

        ))}
      </div>
    </div>
  )
}
