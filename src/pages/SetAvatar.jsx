import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import toast, { Toaster } from "react-hot-toast"

export default function AvatarUploadPage() {
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const firstName = user?.name?.split(" ")[0] || "User"

  const [avatarFile, setAvatarFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Generate preview
  useEffect(() => {
    if (!avatarFile) {
      setPreview(null)
      return
    }
    const objectUrl = URL.createObjectURL(avatarFile)
    setPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [avatarFile])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setSuccess(false)
    }
  }

  const handleUpload = async () => {
    if (!avatarFile) {
      toast.error("Please select an avatar before uploading!", {
        position: window.innerWidth < 768 ? "top-center" : "top-right",
      })
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append("avatar", avatarFile)

      const accessToken = localStorage.getItem("accessToken")
      if (!accessToken) throw new Error("User not authenticated")

      await axios.put(
        "https://globe-chat-api.vercel.app/api/v1/users/avatar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      setSuccess(true)
      toast.success("Your avatar has been uploaded successfully!", {
        position: window.innerWidth < 768 ? "top-center" : "top-right",
      })
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || "Failed to upload avatar", {
        position: window.innerWidth < 768 ? "top-center" : "top-right",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <Toaster /> {/* Toast container */}

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold ">
            Hey {firstName}! <br /><br></br>
         <p className="text-center">Upload Your Avatar</p>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Avatar Preview */}
          <div className="flex justify-center mb-4">
            <img
              src={preview || "/avatar.png"}
              alt="Avatar Preview"
              className="w-32 h-32 rounded-full object-cover border-2 border-gray-300"
            />
          </div>

          {/* File Input */}
          <Input type="file" accept="image/*" onChange={handleFileChange} />

          {/* Upload Button */}
          <Button
            className="w-full"
            onClick={handleUpload}
            disabled={loading || success}
          >
            {loading
              ? "Uploading..."
              : success
              ? "Uploaded Successfully ✅"
              : "Upload Avatar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
