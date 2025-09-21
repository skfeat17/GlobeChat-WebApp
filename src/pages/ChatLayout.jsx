// ChatLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "@/components/ui/BottomNav";

const ChatLayout = ({ activeFriends }) => {
  return (
    <div className="min-h-screen pb-16 bg-gray-50">
      {/* pass object (or value) via Outlet's context */}
      <Outlet context={{ activeFriends }} />
      <BottomNav />
    </div>
  );
};

export default ChatLayout;
