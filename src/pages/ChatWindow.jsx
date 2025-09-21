import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Pusher from "pusher-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send } from "lucide-react";
import { useFriends } from "../context/FriendsContext";


// 🔹 Helper: normalize all messages
const normalizeMessage = (msg, myUserId) => ({
  _id: msg._id || `temp-${Date.now()}`,
  senderId: msg.senderId,
  receiverId: msg.receiverId,
  message: msg.message,
  createdAt:
    msg.createdAt && !isNaN(new Date(msg.createdAt))
    ? msg.createdAt
    : new Date().toISOString(),
  updatedAt: msg.updatedAt || null,
  isRead: msg.isRead ?? false,
  isMe: msg.senderId === myUserId,
});

export default function ChatScreen() {
  const { activeFriends } = useFriends();
  const { id } = useParams();
  const friendId = id;
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
  const myChannelRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // ---------------- Fetch Chat User ----------------
  useEffect(() => {
    setAllMessages([]);
    setSkip(0);
    setHasMore(true);
    setLoading(true);

    const fetchChatUser = async () => {
      try {
        console.log("[Fetch User] Fetching chat user...");
        const res = await axios.get(
          `https://globe-chat-api.vercel.app/api/v1/users/getuserdetails/${friendId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        console.log("[Fetch User] Success:", res.data.data);
        setChatUser(res.data.data);
      } catch (err) {
        console.error("[Fetch User] Error:", err);
      }
    };

    fetchChatUser();
    fetchMessages(100, 0);
  }, [friendId, accessToken]);

  // ---------------- Fetch Messages ----------------
  const fetchMessages = async (limit = 100, currentSkip = skip) => {
    if (!accessToken || !friendId || !hasMore) return;

    try {
      console.log(`[Fetch Messages] Fetching messages skip=${currentSkip}`);
      const res = await axios.get(
        `https://globe-chat-api.vercel.app/api/v1/message/chat/${friendId}?limit=${limit}&skip=${currentSkip}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const msgs = (res.data.data || []).map((m) => normalizeMessage(m, myUserId));

      msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      console.log("[Fetch Messages] Received:", msgs);

      if (msgs.length < limit) setHasMore(false);

      setAllMessages((prev) => {
        const ids = new Set(prev.map((m) => m._id));
        const unique = msgs.filter((m) => !ids.has(m._id));
        return [...prev, ...unique];
      });

      setSkip((prev) => prev + msgs.length);

      if (currentSkip === 0) {
        setTimeout(() => scrollToBottom("auto"), 100);
        markAsRead();
      }
    } catch (err) {
      console.error("[Fetch Messages] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!accessToken || !chatUser?._id) return;
    try {
      console.log("[Mark As Read] Marking messages as read...");
      await axios.patch(
        `https://globe-chat-api.vercel.app/api/v1/message/chat/${chatUser._id}/read`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      console.log("[Mark As Read] Done");
    } catch (err) {
      console.error("[Mark As Read] Error:", err);
    }
  };

  // ---------------- Infinite Scroll ----------------
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container || !hasMore) return;
    if (container.scrollTop < 50) fetchMessages(100, skip);
  };
  useEffect(() => {
  if (!accessToken || !myUserId || !friendId) return;

  console.log("[Pusher] Initializing...");
  const pusher = new Pusher("f154a4e3ab24faa32519", {
    cluster: "ap2",
    authEndpoint: `https://globe-chat-api.vercel.app/api/v1/users/pusher/auth`,
    auth: { headers: { Authorization: `Bearer ${accessToken}` } },
    forceTLS: true,
  });
  pusherRef.current = pusher;

  const myChannel = pusher.subscribe(`private-chat-${myUserId}`);
  myChannelRef.current = myChannel;

  // ✅ Incoming message
  myChannel.bind("client-new-message", (msg) => {
    const normalized = normalizeMessage(msg, myUserId);
    if (!normalized) return;

    setAllMessages((prev) => {
      if (prev.some((m) => m._id === normalized._id)) return prev;
      return [...prev, normalized];
    });

    // 👇 auto scroll
    setTimeout(() => scrollToBottom("smooth"), 50);
  });

  // ✅ Typing event
  myChannel.bind("client-typing", (data) => {
    if (data.senderId !== myUserId) {
      setTyping(true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTyping(false), 1500);
    }
  });

  return () => {
    console.log("[Pusher] Cleaning up...");
    myChannel.unbind_all();
    myChannel.unsubscribe();
    pusher.disconnect();
  };
}, [accessToken, myUserId, friendId]);


  // ---------------- Send Message ----------------
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !chatUser) return;

    const tempId = `temp-${Date.now()}`;
    const newMsg = normalizeMessage(
      {
        _id: tempId,
        senderId: myUserId,
        receiverId: chatUser._id,
        message: inputValue,
      },
      myUserId
    );

    console.log("[Send Message] Sending:", newMsg);

    // 1️⃣ Optimistic UI
    setAllMessages((prev) => [...prev, newMsg]);
    setInputValue("");
 setTimeout(() => scrollToBottom("auto"), 50);

    // 2️⃣ Trigger Pusher event
    const friendChannel = pusherRef.current?.subscribe(`private-chat-${chatUser._id}`);
    if (friendChannel) {
      console.log("[Send Message] Triggering client-new-message via Pusher");
      friendChannel.trigger("client-new-message", newMsg);
    }

    // 3️⃣ Save to DB
    try {
      const res = await axios.post(
        `https://globe-chat-api.vercel.app/api/v1/message/send/${chatUser._id}`,
        { message: newMsg.message },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      console.log("[Send Message] Saved to DB:", res.data.data);

      // setAllMessages((prev) =>
      //   prev.map((m) => (m._id === tempId ? normalizeMessage(res.data.data, myUserId) : m))
      // );
    } catch (err) {
      console.error("[Send Message] Save failed:", err);
    }
  };

  // ---------------- Typing ----------------
const handleTyping = () => {
  if (!chatUser) return;
  const friendChannel = pusherRef.current?.channel(`private-chat-${chatUser._id}`);
  if (friendChannel) {
    console.log("[Typing] Sending typing event");
    friendChannel.trigger("client-typing", { senderId: myUserId });
  }
};


useEffect(()=>{
  console.log(activeFriends)
},[activeFriends])

  // ---------------- Helper ----------------
  const timeAgo = (ts) => {
    if (!ts) return "";
    const t = new Date(ts);
    if (isNaN(t)) return "";
    const diff = new Date() - t;
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec} sec ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} min ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} hr ago`;
    const day = Math.floor(hr / 24);
    return `${day} day${day > 1 ? "s" : ""} ago`;
  };

  // ---------------- Render ----------------
  return (
  <div className="flex flex-col h-screen max-w-md mx-auto bg-background border-x border-border overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border sticky top-0 z-10 bg-background mb-13">
        <Button onClick={() => navigate("/menu/inbox")} variant="ghost" size="icon">
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
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 flex flex-col space-y-4 scrollbar-none"
      >
        {loading ? (
          <>
            <Skeleton className="h-12 w-2/3 rounded-2xl" />
            <Skeleton className="h-12 w-2/3 rounded-2xl self-end" />
          </>
        ) : (
          allMessages.map((msg, index) => {
            const isLastMyMessage = msg.isMe && index === allMessages.length - 1;

            return (
              <div key={msg._id} className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.isMe
                      ? "bg-black text-white rounded-br-none"
                      : "bg-white text-black border rounded-bl-none"
                    }`}
                >
                  <p className="break-words whitespace-pre-wrap">
                    {msg.message}
                  </p>

                  <p className={`text-xs mt-1 ${msg.isMe ? "text-gray-300" : "text-gray-500"}`}>
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      : ""}
                  </p>
                </div>
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
        <Button onClick={handleSendMessage} size="icon" disabled={!inputValue.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
