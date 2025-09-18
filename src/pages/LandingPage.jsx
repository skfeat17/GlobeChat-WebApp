import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* Navbar */}
      <header className="flex items-center justify-between px-4 py-4 shadow-sm">
        <div className="flex items-center space-x-2">
        <img src="/icon.png" alt="" className="w-8 h-8"/>
        <h1 className="text-xl sm:text-2xl font-bold text-black-700">GlobeChat</h1>
        </div>
        <nav className="space-x-2 sm:space-x-4">
          <Button variant="ghost" size="sm" onClick={()=>navigate("/login")}>Login</Button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col-reverse lg:flex-row items-center justify-center flex-1 text-center lg:text-left px-4 sm:px-8 py-12 gap-10">
        {/* Text */}
        <div className="flex-1">
          <p className="uppercase text-sm font-semibold text-blue-600 mb-2 tracking-wide">
            Chat without boundaries
          </p>
          <h2 className="text-3xl sm:text-5xl font-bold mb-4 leading-tight">
            Connect with Anyone, Anywhere 
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-lg mb-6">
            GlobeChat lets you message anyone instantly. Meet random people online,
            chat in real time, and stay connected with friends across the world — 
            all in one app designed for speed, fun, and privacy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button onClick={()=>navigate("/register")} size="lg">Start Chatting</Button>
          </div>
          <p className="mt-4 text-xs sm:text-sm text-gray-500">
            ✅ Free • 🔒 Secure • 🌍 Global
          </p>
        </div>

        {/* Image */}
        <div className="flex-1 flex justify-center">
          <img
            src="/hero.jpg"
            alt="GlobeChat Hero"
            className="max-h-80 sm:max-h-96 w-full max-w-md object-contain"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-4 sm:px-8 py-12 bg-gray-50">
        <Card>
          <CardContent className="p-6 text-center">
            <img src="/instant.jpg" alt="Instant" className="mx-auto h-40 w-full max-w-xs mb-4 object-contain" />
            <h3 className="font-semibold text-lg sm:text-xl mb-2">💬 Instant Messaging</h3>
            <p className="text-gray-600 text-sm sm:text-base">
              Send and receive messages in real-time with zero delays.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <img src="/global.jpg" alt="Global users" className="mx-auto h-40 w-full max-w-xs mb-4 object-contain" />
            <h3 className="font-semibold text-lg sm:text-xl mb-2">🌍 Global Users</h3>
            <p className="text-gray-600 text-sm sm:text-base">
              Connect with people from different countries and cultures.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <img src="/privacy.jpg" alt="Privacy" className="mx-auto h-40 w-full max-w-xs mb-4 object-contain" />
            <h3 className="font-semibold text-lg sm:text-xl mb-2">🔒 Privacy First</h3>
            <p className="text-gray-600 text-sm sm:text-base">
              Secure chats with end-to-end encryption to protect your privacy.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Stats Section */}
      {/* <section className="px-4 sm:px-8 py-12 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <h3 className="text-3xl sm:text-5xl font-bold text-blue-600">50K+</h3>
            <p className="mt-2 text-gray-600 text-sm sm:text-base">Total Users</p>
          </div>
          <div>
            <h3 className="text-3xl sm:text-5xl font-bold text-green-600">5K+</h3>
            <p className="mt-2 text-gray-600 text-sm sm:text-base">Active Now</p>
          </div>
          <div>
            <h3 className="text-3xl sm:text-5xl font-bold text-purple-600">2M+</h3>
            <p className="mt-2 text-gray-600 text-sm sm:text-base">Messages Sent</p>
          </div>
        </div>
      </section> */}

      {/* Footer */}
      <footer className="px-4 py-6 text-center text-gray-500 text-xs sm:text-sm border-t">
        © {new Date().getFullYear()} GlobeChat. All rights reserved.
      </footer>
    </div>
  )
}
