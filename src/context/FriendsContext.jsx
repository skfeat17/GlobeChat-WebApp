import React, { createContext, useContext, useState, useEffect } from "react";
import Pusher from "pusher-js";
import axios from "axios";

const FriendsContext = createContext({ activeFriends: [] });

export const useFriends = () => useContext(FriendsContext);

export const FriendsProvider = ({ children }) => {
  const [activeFriends, setActiveFriends] = useState([]);
  const accessToken = localStorage.getItem("accessToken");

  useEffect(() => {
    if (!accessToken) return;

    const pusher = new Pusher("f154a4e3ab24faa32519", {
      cluster: "ap2",
      authEndpoint: "https://globe-chat-api.vercel.app/api/v1/pusher/auth",
      auth: { headers: { Authorization: `Bearer ${accessToken}` } },
      forceTLS: true,
    });

    const channel = pusher.subscribe("presence-global");

    channel.bind("pusher:subscription_succeeded", async (members) => {
      const onlineUsers = Object.values(members.members).map((m) => ({
        _id: m.id,
        name: m.info.name,
        avatar: m.info.avatar,
      }));

      try {
        const res = await axios.get(
          "https://globe-chat-api.vercel.app/api/v1/users/friends",
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const friends = res.data.data || [];
        const active = friends.filter((f) =>
          onlineUsers.some((u) => u._id === f._id)
        );
        setActiveFriends(active);
      } catch {
        setActiveFriends(onlineUsers); // fallback
      }
    });

    channel.bind("pusher:member_added", (member) => {
      setActiveFriends((prev) => [...prev, { _id: member.id, name: member.info.name, avatar: member.info.avatar }]);
    });

    channel.bind("pusher:member_removed", (member) => {
      setActiveFriends((prev) => prev.filter((u) => u._id !== member.id));
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("presence-global");
      pusher.disconnect();
    };
  }, [accessToken]);

  return (
    <FriendsContext.Provider value={{ activeFriends }}>
      {children}
    </FriendsContext.Provider>
  );
};
