import React,{useEffect} from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Register from "./pages/Register";
import LoginPage from "./pages/LogIn";
import AvatarUploadPage from "./pages/SetAvatar";
import ChatLayout from "./pages/ChatLayout";
import Inbox from "./pages/Inbox";
import FriendsPage from "./pages/Friends";
import DiscoverPage from "./pages/Discover";
import MyProfile from "./pages/Profile";
import ChatScreen from "./pages/ChatWindow";
import { FriendsProvider } from "./context/FriendsContext";
import axios from "axios";
import * as PusherPushNotifications from "@pusher/push-notifications-web";


function App() {
  useEffect(() => {
    const userId = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user"))._id : null;
    const beamsClient = new PusherPushNotifications.Client({
      instanceId: "e7c78238-d563-465f-ba04-ef4d1157e744", // from Pusher dashboard
    });

    beamsClient.start()
      .then(() => beamsClient.addDeviceInterest(`chat-${userId}`) // 🔹 subscribe to topic
      .then(() => console.log("Successfully registered and subscribed!"))
      .catch(console.error))
  }, []);




useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    // 🔹 Helper to call backend
    const markOnline = async () => {
      try {
        await axios.post(
          "https://globe-chat-api.vercel.app/api/v1/users/mark-online",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error("markOnline failed:", err);
      }
    };

    const markOffline = async () => {
      try {
        await axios.post(
          "https://globe-chat-api.vercel.app/api/v1/users/mark-offline",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error("markOffline failed:", err);
      }
    };

    // 🔹 Mark online immediately
    markOnline();

    // 🔹 When tab is hidden → offline, visible → online
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        markOffline();
      } else {
        markOnline();
      }
    };

    // 🔹 When browser/tab is closed → offline
    const handleUnload = () => {
      navigator.sendBeacon(
        "https://globe-chat-api.vercel.app/api/v1/users/mark-offline",
        JSON.stringify({})
      );
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleUnload);
      markOffline(); // cleanup just in case
    };
  }, []);













  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/set-avatar" element={<AvatarUploadPage />} />
        <Route path="/chat/:id" element={<ChatScreen />} />

        {/* Protected routes (chat area with bottom nav) */}
        <Route
          path="/menu"
          element={
            <FriendsProvider>
              <ChatLayout />
            </FriendsProvider>
          }
        >
          <Route path="inbox" index element={<Inbox />} />
          <Route path="friends" element={<FriendsPage />} />
          <Route path="discover" element={<DiscoverPage />} />
          <Route path="profile" element={<MyProfile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
