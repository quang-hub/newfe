"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Shirt, Upload } from "lucide-react"
import { LaundryStats } from "@/components/laundry-stats"
import { roomApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { googleSheetApi } from "@/lib/api"
import { scheduleApi } from "@/lib/api"
import { SheetHistoryList } from "@/components/sheet-history-list";

interface Room {
  id: number
  roomName: string
}

export default function Component() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [scheduleName, setScheduleName] = useState("")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchRooms()
    fetchDutySchedule();
  }, [])

  const fetchRooms = async () => {
    try {
      const data = await roomApi.list()
      setRooms(data)
    } catch (error) {
      console.error("Error fetching rooms:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDutySchedule = async () => {
    try {
      const data = await scheduleApi.getCurrentDuty();
      if (!data) {
        await scheduleApi.addCurrentDuty();
        const newData = await scheduleApi.getCurrentDuty();
        setScheduleName(newData ?? "");
      } else {
        setScheduleName(data);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const handleOtherFunction = async () => {
    try {
      const isAuthenticated = await googleSheetApi.checkAuth()
      if (isAuthenticated) {
        // Đã xác thực → đi thẳng tới trang upload
        window.location.href = "/admin"
      } else {
        // Chưa xác thực → mở tab OAuth
        window.open(await googleSheetApi.getAuthUrl(), "_blank")
        // window.location.href = "/sheet/upload"
      }
    } catch (err) {
      console.error(err)
      // fallback mở OAuth nếu check lỗi
      window.open(await googleSheetApi.getAuthUrl(), "_blank")
      window.location.href = "/admin"
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin mx-auto mb-4 border-4 border-purple-600 border-t-transparent rounded-full" />
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Shirt className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Thống kê giặt đồ</h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Theo dõi và quản lý hoạt động giặt đồ của các phòng
                </p>
              </div>
            </div>

            <Button onClick={handleOtherFunction} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
              Quản lý
            </Button>

            <SheetHistoryList />
            <h3>Lịch vệ sinh hiện tại: <span className="text-red-700">{typeof scheduleName === "string" ? scheduleName : ""}</span></h3>
          </div>

        </div>

        {/* Main Content */}
        <LaundryStats rooms={rooms} />
      </div>
    </div>
  )
}
