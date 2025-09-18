import React from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "@/components/ui/BottomNav";

const ChatLayout = () => {
  return (
    <div className="min-h-screen pb-16 bg-gray-50">
      <Outlet />
      <BottomNav />
    </div>
  );
};

export default ChatLayout;
