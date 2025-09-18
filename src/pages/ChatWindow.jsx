import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom"; // 👈 import useParams
import axios from "axios";
import Pusher from "pusher-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
export default function ChatScreen() {
  const { id } = useParams(); 
  let friendId = id;
  const navigate = useNavigate();
  const [allMessages, setAllMessages] = useState([]);
  const [chatUser, setChatUser] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const myUserId = user?._id;
  const accessToken = localStorage.getItem("accessToken");

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const pusherRef = useRef(null);

  // ✅ Scroll helper
  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // ✅ Mark messages read API
  const markAsRead = async () => {
    if (!accessToken || !chatUser?._id) return;
    try {
    await axios.patch(
        `https://globe-chat-api.vercel.app/api/v1/message/chat/${chatUser._id}/read`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
   
    } catch (err) {
      console.error("Mark as read failed:", err);
    }
  };

  // ✅ Fetch messages
  const fetchMessages = async (limit = 100, currentSkip = skip) => {
    if (!accessToken || !friendId || !hasMore) return;
    try {
      const res = await axios.get(
        `https://globe-chat-api.vercel.app/api/v1/message/chat/${friendId}?limit=${limit}&skip=${currentSkip}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const msgs = res.data.data || [];
      msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      if (msgs.length < limit) setHasMore(false);

      setAllMessages((prev) => {
        const ids = new Set(prev.map((m) => m._id));
        const unique = msgs.filter((m) => !ids.has(m._id));
        return [...prev, ...unique];
      });

      setSkip((prev) => prev + msgs.length);

      if (currentSkip === 0) {
        setTimeout(() => scrollToBottom("auto"), 100);
        // ✅ Mark as read immediately when loading chat
        markAsRead();
      }
    } catch (err) {
      console.error("Fetch messages failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch chat user & first batch of messages
  useEffect(() => {
    setAllMessages([]);
    setSkip(0);
    setHasMore(true);
    setLoading(true);

    const fetchChatUser = async () => {
      try {
        const res = await axios.get(
          `https://globe-chat-api.vercel.app/api/v1/users/getuserdetails/${friendId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        setChatUser(res.data.data);
      } catch (err) {
        console.error("Fetch user failed:", err);
      }
    };

    fetchChatUser();
    fetchMessages(100, 0);
  }, [friendId, accessToken]);

  // ✅ Infinite scroll
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container || !hasMore) return;
    if (container.scrollTop < 50) fetchMessages(100, skip);
  };

  // ✅ Pusher setup
  useEffect(() => {
    if (!accessToken || !myUserId) return;

    const pusher = new Pusher("f154a4e3ab24faa32519", {
      cluster: "ap2",
      authEndpoint: `https://globe-chat-api.vercel.app/api/v1/users/pusher/auth`,
      auth: { headers: { Authorization: `Bearer ${accessToken}` } },
      forceTLS: true,
    });
    pusherRef.current = pusher;

    const channel = pusher.subscribe(`private-chat-${myUserId}`);

    const handleNewMessage = (msg) => {
      setAllMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      // ✅ Mark read if new message is from current chat user
      if (msg.senderId === chatUser?._id) {
        markAsRead();
      }

      setTimeout(() => scrollToBottom("auto"), 50);
    };

    channel.bind("new-message", handleNewMessage);

    // Typing indicator
    const presence = pusher.subscribe("presence-globchat");
    presence.bind(`client-typing-${myUserId}`, (data) => {
      if (data.senderId === chatUser?._id) {
        setTyping(true);
        setTimeout(() => setTyping(false), 1200);
      }
    });

    return () => {
      channel.unbind("new-message", handleNewMessage);
      channel.unsubscribe();
      presence.unbind_all();
      presence.unsubscribe();
    };
  }, [accessToken, myUserId, chatUser]);

  // ✅ Send message with optimistic update
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !chatUser) return;

    const tempId = `temp-${Date.now()}`;
    const newMsg = {
      _id: tempId,
      senderId: myUserId,
      receiverId: chatUser._id,
      message: inputValue,
      createdAt: new Date().toISOString(),
    };

    setAllMessages((prev) => [...prev, newMsg]);
    setInputValue("");

    setTimeout(() => scrollToBottom("auto"), 50);

    try {
      const res = await axios.post(
        `https://globe-chat-api.vercel.app/api/v1/message/send/${chatUser._id}`,
        { message: newMsg.message },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      setAllMessages((prev) =>
        prev.map((m) => (m._id === tempId ? res.data.data : m))
      );
    } catch (err) {
      console.error("Send message failed:", err);
    }
  };
function timeAgo(ts) {
  if (!ts) return "";
  const t = new Date(ts);
  const diff = new Date() - t;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec} sec ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day > 1 ? 's' : ''} ago`;
}
  // ✅ Typing trigger
  const handleTyping = () => {
    if (!pusherRef.current || !chatUser) return;
    const channel = pusherRef.current.channel("presence-globchat");
    if (channel) {
      channel.trigger(`client-typing-${chatUser._id}`, { senderId: myUserId });
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background border-x border-border">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border sticky top-0 z-10 bg-background mb-13">
        <Button onClick={()=>navigate("/menu/inbox")} variant="ghost" size="icon">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        {loading ? (
          <Skeleton className="h-10 w-32" />
        ) : chatUser ? (
          <>
            <Avatar className="h-10 w-10">
              <AvatarImage src={chatUser.avatar} alt={chatUser.name} />
              <AvatarFallback>{chatUser.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-foreground">{chatUser.name}</h2>
              <p className="text-xs text-muted-foreground">
                {(typing ? "Typing..." : (chatUser.isOnline ? "Active Now" : `Active ${timeAgo(chatUser.lastSeen)}`))}
              </p>
            </div>
          </>
        ) : null}
      </div>

     {/* Messages */}
<div
  ref={messagesContainerRef}
  onScroll={handleScroll}
  className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4 scrollbar-none"
>
  {loading ? (
    <>
      <Skeleton className="h-12 w-2/3 rounded-2xl" />
      <Skeleton className="h-12 w-2/3 rounded-2xl self-end" />
            <Skeleton className="h-12 w-2/3 rounded-2xl" />
      <Skeleton className="h-12 w-2/3 rounded-2xl self-end" />
            <Skeleton className="h-12 w-2/3 rounded-2xl" />
      <Skeleton className="h-12 w-2/3 rounded-2xl self-end" />
            <Skeleton className="h-12 w-2/3 rounded-2xl" />
      <Skeleton className="h-12 w-2/3 rounded-2xl self-end" />
    </>
  ) : (
    allMessages.map((msg, index) => {
      const isMe = msg.senderId === myUserId;
      const isLastMyMessage =
        isMe &&
        index === allMessages.length - 1; // last message and sent by me

      return (
        <div
          key={msg._id}
          className={`flex flex-col ${
            isMe ? "items-end" : "items-start"
          }`}
        >
          <div
            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
              isMe
                ? "bg-black text-white rounded-br-none"
                : "bg-white text-black border rounded-bl-none"
            }`}
          >
            <p>{msg.message}</p>
            <p
              className={`text-xs mt-1 ${
                isMe ? "text-gray-300" : "text-gray-500"
              }`}
            >
              {new Date(msg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* ✅ Show seen status for the last message I sent */}
          {isLastMyMessage && msg.isRead && (
            <p className="text-xs text-blue-500 mt-1">
              Seen at{" "}
              {msg.updatedAt
                ? new Date(msg.updatedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </p>
          )}
        </div>
      );
    })
  )}
  <div ref={messagesEndRef} />
</div>


      {/* Input */}
      <div className="p-4 border-t border-border bg-background flex items-center gap-2 sticky bottom-0">
        <Input
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSendMessage();
            } else handleTyping();
          }}
        />
        <Button
          onClick={handleSendMessage}
          size="icon"
          disabled={!inputValue.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
