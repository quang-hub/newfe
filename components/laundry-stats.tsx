"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shirt, Plus, Calendar, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { laundryApi } from "@/lib/api"
import { Notification } from "@/lib/notification"

interface Room {
  id: number
  roomName: string
}

interface LaundryStatsProps {
  rooms: Room[]
}

interface LaundryRecord {
  id: number
  roomId: number
  createdAt: string
}

interface LaundryStats {
  roomId: number
  roomName: string
  count: number
  detailTime: LaundryRecord[]
}

export function LaundryStats({ rooms }: LaundryStatsProps) {
  const safeRooms = Array.isArray(rooms) ? rooms : []
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [stats, setStats] = useState<LaundryStats[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const today = new Date()
    const currentMonth = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}`
    setSelectedMonth(currentMonth)
  }, [])

  useEffect(() => {
    if (selectedMonth) {
      fetchLaundryStats()
    }
  }, [selectedMonth])

  const fetchLaundryStats = async () => {
  setLoading(true)
  try {
    const data = await laundryApi.stats(selectedMonth)
    setStats(data ?? [])
  } catch (error) {
    console.error("Error fetching laundry stats:", error)
    Notification("Có lỗi xảy ra","ERROR")
  } finally {
    setLoading(false)
  }
}

const addLaundryRecord = async (roomId: number, roomName:string) => {
  const ok = window.confirm("Thêm một lần giặt cho " + roomName);
  if (!ok) return;

  try {
    if(selectedMonth != new Date().toISOString().slice(0, 7)){
      Notification("Không thể chỉnh sửa lịch sử giặt của tháng khác","WARNING")
      return;
    }
    await laundryApi.save(roomId)
    Notification("Thành công","SUCCESS")
    fetchLaundryStats()
  } catch (error) {
    Notification("Có lỗi xảy ra khi ghi nhận","ERROR")
  }
}

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (e) {
      return "N/A"
    }
  }

  const getTotalLaundry = () => {
    return stats.reduce((total, stat) => total + stat.count, 0)
  }

  const getMonthOptions = () => {
    const months = []
    const currentYear = new Date().getFullYear()

    // Tạo danh sách cho năm hiện tại
    for (let i = 1; i <= 12; i++) {
      months.push(`${currentYear}-${i.toString().padStart(2, "0")}`)
    }

    // Có thể thêm năm trước nếu cần
    for (let i = 1; i <= 12; i++) {
      months.push(`${currentYear - 1}-${i.toString().padStart(2, "0")}`)
    }

    // Sắp xếp giảm dần (tháng mới nhất trên cùng)
    return months.sort((a, b) => b.localeCompare(a))
  }

  if (safeRooms.length === 0) {
    return <div className="text-center py-8 text-gray-500">Không có dữ liệu phòng.</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                <Shirt className="h-5 w-5 text-purple-600" />
                Thống kê giặt đồ theo tháng
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">Theo dõi số lần giặt của từng phòng</CardDescription>
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Chọn tháng" />
              </SelectTrigger>
              <SelectContent>
                {getMonthOptions().map((month) => {
                  const [year, monthNum] = month.split("-")
                  return (
                    <SelectItem key={month} value={month}>
                      Tháng {monthNum}-{year}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="text-center py-8">
          <div className="h-8 w-8 animate-spin mx-auto mb-4 border-4 border-purple-600 border-t-transparent rounded-full" />
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {stats.map((stat) => (
            <Card key={stat.roomId} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <CardTitle className="text-lg">{stat.roomName}</CardTitle>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1 flex-grow sm:flex-grow-0 justify-center"
                    >
                      <TrendingUp className="h-3 w-3" />
                      {stat.count} lần
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => addLaundryRecord(stat.roomId, stat.roomName)}
                      className="h-8 flex-grow sm:flex-grow-0"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Thêm
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {stat.detailTime && stat.detailTime.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Lịch sử giặt:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {stat.detailTime.map((record) => (
                        <div
                          key={record.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 bg-gray-50 rounded text-sm gap-1"
                        >
                          <span className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-gray-500" />
                            {formatDateTime(record.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <Shirt className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Chưa có lần giặt nào</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Add cards for rooms without laundry records */}
          {safeRooms
            .filter((room) => !stats.find((stat) => stat.roomId === room.id))
            .map((room) => (
              <Card key={room.id} className="hover:shadow-lg transition-shadow opacity-75">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <CardTitle className="text-lg">{room.roomName}</CardTitle>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1 flex-grow sm:flex-grow-0 justify-center"
                      >
                        <TrendingUp className="h-3 w-3" />0 lần
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => addLaundryRecord(room.id, room.roomName)}
                        className="h-8 flex-grow sm:flex-grow-0"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Thêm
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4 text-gray-500">
                    <Shirt className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Chưa có lần giặt nào</p>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  )
}
