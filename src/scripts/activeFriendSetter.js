// onlineFriends.js
import Pusher from "pusher-js";
import axios from "axios";

class OnlineFriendsManager {
  constructor() {
    this.activeFriends = [];
    this.accessToken = localStorage.getItem("accessToken");
    this.init();
  }

  init() {
    if (!this.accessToken) return;

    const pusher = new Pusher("f154a4e3ab24faa32519", {
      cluster: "ap2",
      authEndpoint: "https://globe-chat-api.vercel.app/api/v1/pusher/auth",
      auth: { headers: { Authorization: `Bearer ${this.accessToken}` } },
      forceTLS: true,
    });

    this.channel = pusher.subscribe("presence-global");

    this.channel.bind("pusher:subscription_succeeded", (members) => {
      this.updateActiveFriends(Object.values(members.members || {}));
    });

    this.channel.bind("pusher:member_added", (member) => {
      this.addActiveFriend(member);
    });

    this.channel.bind("pusher:member_removed", (member) => {
      this.removeActiveFriend(member);
    });
  }

  async updateActiveFriends(members) {
    const onlineUsers = members.map((m) => ({
      _id: m.id,
      name: m.info.name,
      avatar: m.info.avatar,
    }));

    try {
      const res = await axios.get(
        "https://globe-chat-api.vercel.app/api/v1/users/friends",
        { headers: { Authorization: `Bearer ${this.accessToken}` } }
      );
      const friends = res.data.data || [];
      this.activeFriends = friends.filter((f) =>
        onlineUsers.some((u) => u._id === f._id)
      );
    } catch {
      this.activeFriends = onlineUsers; // fallback if API fails
    }

    this.saveToLocalStorage();
  }

  addActiveFriend(member) {
    if (!this.activeFriends.some((f) => f._id === member.id)) {
      this.activeFriends.push({
        _id: member.id,
        name: member.info.name,
        avatar: member.info.avatar,
      });
      this.saveToLocalStorage();
    }
  }

  removeActiveFriend(member) {
    this.activeFriends = this.activeFriends.filter((f) => f._id !== member.id);
    this.saveToLocalStorage();
  }

  saveToLocalStorage() {
    localStorage.setItem("activeFriends", JSON.stringify(this.activeFriends));
  }

  getActiveFriends() {
    // Always return latest from localStorage
    const stored = localStorage.getItem("activeFriends");
    return stored ? JSON.parse(stored) : [];
  }
}

// Singleton instance
const onlineFriendsManager = new OnlineFriendsManager();
export default onlineFriendsManager;
