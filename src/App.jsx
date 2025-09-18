import React, { useEffect } from "react";
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

const USER_API = "https://globe-chat-api.vercel.app/api/v1/users";

async function markOnline() {
  const token = localStorage.getItem("accessToken");
  if (!token) return;
  try {
    await fetch(`${USER_API}/mark-online`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("✅ Marked Online");
  } catch (err) {
    console.error("Failed to mark online:", err);
  }
}

async function markOffline() {
  const token = localStorage.getItem("accessToken");
  if (!token) return;
  try {
    await fetch(`${USER_API}/mark-offline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("❌ Marked Offline");
  } catch (err) {
    console.error("Failed to mark offline:", err);
  }
}

function App() {
  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      // 🚨 User not logged in → ensure marked offline
      markOffline();
      return;
    }

    // 🟢 User logged in → set online and listen for events
    const handleFocus = () => markOnline();
    const handleBlur = () => markOffline();

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        markOnline();
      } else {
        markOffline();
      }
    });

    // Mark online immediately
    markOnline();

    // Mark offline before closing the tab
    window.addEventListener("beforeunload", markOffline);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("beforeunload", markOffline);
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
        <Route path="/menu" element={<ChatLayout />}>
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
