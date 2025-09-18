import React from "react";
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

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/set-avatar" element={<AvatarUploadPage />} />
        <Route path="/chat/:id" element={<ChatScreen/>} />
        {/* Protected (chat area with bottom nav) */}
        <Route path="/menu" element={<ChatLayout />}>
          <Route path="inbox" index element={<Inbox />} />
          <Route path="friends" element={<FriendsPage />} />
          <Route path="discover" element={<DiscoverPage />} />
          <Route path="profile" element={<MyProfile />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
