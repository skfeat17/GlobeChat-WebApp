import { useEffect, useState } from "react";
import axios from "axios";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, LogOut } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import BottomNav from "@/components/ui/BottomNav";
import { Skeleton } from "@/components/ui/skeleton"; // ✅ import skeleton

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [open, setOpen] = useState(false);

  const accessToken = localStorage.getItem("accessToken");
  const baseurl = "https://globe-chat-api.vercel.app/api/v1";

  // Fetch profile
  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${baseurl}/users/profile`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setProfile(res.data.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Preview file
  useEffect(() => {
    if (!selectedFile) return setPreview(null);
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  // Upload avatar
  const handleAvatarUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select an image");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", selectedFile);

    setUploading(true);
    try {
      const res = await axios.put(`${baseurl}/users/avatar`, formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setProfile((prev) => ({
        ...prev,
        avatar: res?.data?.data?.avatar || prev.avatar,
      }));

      toast.success("Profile picture updated!");
      setSelectedFile(null);
      setPreview(null);
      setOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ✅ Skeleton loader while loading
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex flex-col items-center bg-white rounded-2xl shadow-sm p-6">
          <Skeleton className="w-28 h-28 rounded-full" />
          <Skeleton className="h-5 w-32 mt-4" />
          <Skeleton className="h-4 w-20 mt-2" />
          <Skeleton className="h-6 w-16 mt-3" />
        </div>

        <div className="mt-6 space-y-4">
          {[...Array(5)].map((_, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg shadow-sm px-4 py-3 flex justify-between items-center"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
          <div className="bg-white rounded-lg shadow-sm px-4 py-3 flex justify-center">
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 pb-20">
      <Toaster position="top-right" />

      {/* Profile Header */}
      <div className="flex flex-col items-center bg-white rounded-2xl shadow-sm p-6 relative">
        <div className="relative">
          <Avatar className="w-28 h-28">
            <AvatarImage src={preview || profile.avatar} alt={profile.name} />
            <AvatarFallback>{profile.name?.charAt(0)}</AvatarFallback>
          </Avatar>

          {/* Edit Avatar */}
          <div className="absolute bottom-1 right-1">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <button className="bg-white border p-1 rounded-full shadow hover:bg-gray-50">
                  <Edit className="w-4 h-4 text-blue-600" />
                </button>
              </DialogTrigger>

              <DialogContent className="max-w-sm">
                <DialogHeader className="flex flex-col items-center gap-3">
                  <DialogTitle className="text-lg font-medium">
                    Update Profile Picture
                  </DialogTitle>
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={preview || profile.avatar} alt={profile.name} />
                    <AvatarFallback>{profile.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </DialogHeader>

                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />

                <Button
                  className="w-full mt-4"
                  onClick={handleAvatarUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <h2 className="text-xl font-semibold mt-4">{profile.name}</h2>
        <p className="text-gray-600">@{profile.username}</p>
        <Badge
          className="mt-2 px-2 py-1"
          variant={profile.isOnline ? "success" : "secondary"}
        >
          {profile.isOnline ? "Online" : "Offline"}
        </Badge>
      </div>

      {/* Info Section */}
      <div className="mt-6 space-y-4">
        {[
          { label: "Email", value: profile.email },
          {
            label: "Gender",
            value: profile.gender
              ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)
              : "",
          },
          { label: "Friends", value: profile.friends?.length ?? 0 },
          { label: "Blocked", value: profile.blockedUsers?.length ?? 0 },
          { label: "Joined", value: new Date(profile.createdAt).toLocaleDateString() },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-lg shadow-sm px-4 py-3 flex justify-between items-center"
          >
            <span className="text-gray-500 text-sm">{item.label}</span>
            <span className="text-gray-900 font-medium text-base">
              {item.value}
            </span>
          </div>
        ))}

        {/* Log Out */}
        <div
          className="bg-white rounded-lg shadow-sm px-4 py-3 flex justify-center items-center cursor-pointer hover:bg-red-50 transition"
          onClick={async () => {
            try {
              await axios.post(
                `${baseurl}/users/logout`,
                {},
                { headers: { Authorization: `Bearer ${accessToken}` } }
              );
              localStorage.removeItem("accessToken");
              toast.success("Logged out successfully");
              window.location.href = "/login";
            } catch (err) {
              toast.error(err?.response?.data?.message || "Logout failed");
            }
          }}
        >
          <LogOut className="w-4 h-4 text-red-600 mr-2" />
          <span className="text-red-600 font-medium">Log Out</span>
        </div>
      </div>
    </div>
  );
}
