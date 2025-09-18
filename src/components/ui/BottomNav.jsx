import { Home, Users, Search, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const BottomNav = () => {
  const navItems = [
    { to: "/menu/inbox", icon: Home, label: "Chats" },
    { to: "/menu/friends", icon: Users, label: "Friends" },
    { to: "/menu/discover", icon: Search, label: "Discover" },
    { to: "/menu/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="md:hidden border-t bg-white fixed bottom-0 left-0 w-full flex justify-around py-2 z-50">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center text-sm ${
              isActive ? "text-blue-600" : "text-gray-600"
            }`
          }
        >
          <Icon className="w-6 h-6" />
          <span>{label}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default BottomNav;
