"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Save, ImageIcon, Check, ArrowLeft } from "lucide-react"
import { ElectricityRecord, roomApi } from "@/lib/api"
import { electricApi } from "@/lib/api"
import { Notification } from "@/lib/notification"
import { useRouter } from "next/navigation"

interface Room {
  id: number
  roomName: string
}


export default function SheetUploadPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [step, setStep] = useState<"upload" | "form">("upload")
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [totalMoney, setTotalMoney] = useState<string>("")
  const [formattedMoney, setFormattedMoney] = useState("");
  const [totalElectricity, setTotalElectricity] = useState<string>("")
  const [electricityRecords, setElectricityRecords] = useState<ElectricityRecord[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const rooms = await roomApi.list()
      setRooms(rooms)
      const electricRecord = await electricApi.list()

      setElectricityRecords(electricRecord)
    } catch (error) {
      console.error("Error fetching rooms:", error)
  
    }
  }

  const handleMoneyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // loại bỏ tất cả ký tự không phải số
    const raw = e.target.value.replace(/\D/g, "");

    // format lại theo chuẩn Việt Nam: dấu . mỗi 3 số
    const formatted = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    setTotalMoney(raw); 
    setFormattedMoney(formatted);
  };
  // const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const files = e.target.files ? Array.from(e.target.files) : []
  //   if (files.length > 0) {
  //     const newFiles = [...imageFiles, ...files]
  //     setImageFiles(newFiles)
  //     const newPreviews = files.map((file) => URL.createObjectURL(file))
  //     setImagePreviews((prev) => [...prev, ...newPreviews])
  //   }
  // }

  // const removeImage = (index: number) => {
  //   const newFiles = imageFiles.filter((_, i) => i !== index)
  //   const newPreviews = imagePreviews.filter((_, i) => i !== index)
  //   setImageFiles(newFiles)
  //   setImagePreviews(newPreviews)
  // }

  // const handleConfirmImage = () => {
  //   if (imageFiles.length === 0) {

  //     return
  //   }
  //   setStep("form")
  // }

  const updateElectricityRecord = (roomId: number, field: "startElectric" | "endElectric", value: number) => {
    setElectricityRecords((prev) =>
      prev.map((record) => (record.roomId === roomId ? { ...record, [field]: value } : record)),
    )
  }

  const handleSubmit = async () => {
    if (!totalMoney || !totalElectricity) {
      Notification("Vui lòng điền đầy đủ tổng tiền và tổng số điện", "ERROR")
      return
    }

    const invalidRecords = electricityRecords.filter(
      (record) => record.startElectric >= record.endElectric || record.startElectric < 0 || record.endElectric <= 0,
    )

    if (invalidRecords.length > 0) {
      Notification("Vui lòng kiểm tra lại số điện các phòng. Số điện cuối phải lớn hơn số điện đầu.", "ERROR")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/auth/sheet/write`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalMoney: totalMoney,
          totalElectricity: totalElectricity,
          electricityRecord: electricityRecords,
        }),
        credentials: "include"
      })

      if (response.ok) {
      
        const link = await response.text();
        Notification(
          <>
            Đã lưu dữ liệu lên Google Sheet thành công!{" "}
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "blue", textDecoration: "underline" }}
            >
              Xem tại đây
            </a>
          </>,
          "SUCCESS"
        );

      } else {
        throw new Error("Failed to save data")
      }
    } catch (error) {
      console.error("Error saving data:", error)

    } finally {
      setLoading(false)
    }
  }

  const getRoomName = (roomId: number) => {
    return rooms.find((room) => room.id === roomId)?.roomName || `Phòng ${roomId}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.push("/admin")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-600 rounded-lg">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Upload Google Sheet</h1>
              <p className="text-sm sm:text-base text-gray-600">Nhập thông tin điện để upload lên Google Sheet</p>
            </div>
          </div>
        </div>

        {/* {step === "upload" ? (
          <Card>
            <CardHeader>
              <CardTitle>Bước 1: Upload ảnh hóa đơn điện</CardTitle>
              <CardDescription>Chọn ảnh hóa đơn điện để bắt đầu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {imagePreviews.length > 0 ? (
                  <div className="flex flex-wrap gap-4 justify-center">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index}`}
                          className="max-h-40 rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full text-xs opacity-70 hover:opacity-100"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="text-gray-600">Chưa có ảnh nào được chọn</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="cursor-pointer"
                    id="image-upload"
                  />
                </label>
                <Button onClick={handleConfirmImage} disabled={imageFiles.length === 0} className="sm:w-auto w-full">
                  <Check className="h-4 w-4 mr-2" />
                  Xác nhận
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : ( */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nhập thông tin tổng quan</CardTitle>
              <CardDescription>Điền tổng tiền và tổng số điện</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalMoney">Tổng tiền điện (VNĐ)</Label>
                  <Input
                    id="totalMoney"
                    type="text"
                    inputMode="numeric"
                    value={formattedMoney}
                    onChange={handleMoneyChange}
                    placeholder="2230080"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="totalElectricity">Tổng số điện (kWh)</Label>
                  <Input
                    id="totalElectricity"
                    type="number"
                    value={totalElectricity}
                    onChange={(e) => setTotalElectricity(e.target.value)}
                    placeholder="700"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nhập thông tin từng phòng</CardTitle>
              <CardDescription>Cập nhật số điện đầu và cuối cho mỗi phòng</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {electricityRecords.map((record) => (
                <Card key={record.roomId} className="p-4 bg-gray-50">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`room-${record.roomId}`}>Phòng</Label>
                      <Input
                        id={`room-${record.roomId}`}
                        value={getRoomName(record.roomId)}
                        readOnly
                        className="mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`start-${record.roomId}`}>Số điện cuối tháng trước</Label>
                      <Input
                        id={`start-${record.roomId}`}
                        type="number"
                        value={record.startElectric}
                        onChange={(e) =>
                          updateElectricityRecord(record.roomId, "startElectric", Number(e.target.value) || 0)
                        }
                        placeholder="150"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`end-${record.roomId}`}>Số điện hiện tại</Label>
                      <Input
                        id={`end-${record.roomId}`}
                        type="number"
                        value={record.endElectric}
                        onChange={(e) =>
                          updateElectricityRecord(record.roomId, "endElectric", Number(e.target.value) || 0)
                        }
                        placeholder="200"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4">

            <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Đang lưu..." : "Lưu lên Google Sheet"}
            </Button>
          </div>
        </div>
        {/* )} */}
      </div>
    </div>
  )
}
