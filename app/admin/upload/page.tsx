"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Save, ImageIcon, ArrowLeft, Calculator, Calendar, Database, CloudUpload, CheckCircle2, Maximize2, X } from "lucide-react"
import { ElectricityRecord, roomApi, electricApi, googleSheetApi, driveApi } from "@/lib/api"
import { Notification } from "@/lib/notification"
import { SheetHistoryList } from "@/components/sheet-history-list"
import { Loader2 } from "lucide-react"

interface Room { id: number; roomName: string }

export default function SheetUploadPage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])

  // 1. Month Picker
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  // 2. Form State
  const [totalMoney, setTotalMoney] = useState<string>("")
  const [formattedMoney, setFormattedMoney] = useState("")
  const [totalElectricity, setTotalElectricity] = useState<string>("")
  const [totalWater, setTotalWater] = useState<string>("")
  const [formattedWater, setFormattedWater] = useState("")
  const [electricityRecords, setElectricityRecords] = useState<ElectricityRecord[]>([])

  // 4. Preview State
  const [previewData, setPreviewData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingRoomId, setUploadingRoomId] = useState<number | null>(null)
  const [pendingRoomFiles, setPendingRoomFiles] = useState<Record<number, File[]>>({})
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)

  // Hàm chuyển đổi link Drive sang link ảnh hiển thị được
  const getDriveDisplayUrl = (url: string | undefined) => {
    if (!url) return "";
    const match = url.match(/\/d\/(.+?)\/view/);
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
    }
    return url;
  };

  useEffect(() => {
    fetchData(month)
  }, [month])

  const fetchData = async (currentMonth: string) => {
    try {
      // Chỉ fetch danh sách phòng nếu chưa có
      if (rooms.length === 0) {
        const roomList = await roomApi.list()
        setRooms(roomList)
      }

      const electricRecord = await electricApi.list(currentMonth)
      setElectricityRecords(electricRecord || [])
    } catch (error) {
      Notification("Lỗi tải dữ liệu phòng", "ERROR")
    }
  }

  // --- Handlers ---
  const handleMoneyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setTotalMoney(raw);
    setFormattedMoney(raw.replace(/\B(?=(\d{3})+(?!\d))/g, "."));
  };

  const handleWaterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setTotalWater(raw);
    setFormattedWater(raw.replace(/\B(?=(\d{3})+(?!\d))/g, "."));
  };

  const updateRecord = (roomId: number, field: "startElectric" | "endElectric", value: number) => {
    setElectricityRecords(prev => prev.map(r => r.roomId === roomId ? { ...r, [field]: value } : r))
  }

  // Chức năng Xem Trước (Preview)
  const handlePreview = async () => {
    if (!totalMoney || !totalElectricity) return Notification("Vui lòng nhập tổng tiền điện và tổng số điện", "ERROR")

    setLoading(true)
    try {

      const payload = {
        totalMoney: totalMoney,
        totalElectricity: totalElectricity,
        totalWater: totalWater,
        month: month,
        electricityRecord: electricityRecords.map(r => ({
          ...r,
          id: r.id || r.roomId, // Use roomId as id if id is missing
        }))
      };

      const data = await electricApi.calculate(payload)
      setPreviewData(data)
      Notification("Tính toán thành công! Hãy kiểm tra bảng bên dưới.", "SUCCESS")
    } catch (error) {
      Notification("Lỗi tính toán dữ liệu", "ERROR")
    } finally {
      setLoading(false)
    }
  }

  // Chức năng Write lên Sheet
  const handleSubmit = async () => {
    if (!totalMoney || !totalElectricity) return Notification("Thiếu thông tin điện!", "ERROR")

    setLoading(true)
    try {
      const updatedRecords = [...electricityRecords];
      const roomIdsToUpload = Object.keys(pendingRoomFiles).map(Number);

      // Upload tất cả ảnh của tất cả các phòng trong một lần gọi API duy nhất
      if (roomIdsToUpload.length > 0) {
        const allFiles: File[] = [];
        const roomMapping: { roomId: number, count: number }[] = [];

        for (const roomId of roomIdsToUpload) {
          const files = pendingRoomFiles[roomId];
          allFiles.push(...files);
          roomMapping.push({ roomId, count: files.length });
        }

        try {
          const allUrls = await driveApi.uploadMeterPhoto(allFiles, month);

          let currentUrlIdx = 0;
          for (const mapping of roomMapping) {
            const roomUrls = allUrls.slice(currentUrlIdx, currentUrlIdx + mapping.count);
            currentUrlIdx += mapping.count;

            const idx = updatedRecords.findIndex(r => r.roomId === mapping.roomId);
            if (idx !== -1) {
              updatedRecords[idx] = {
                ...updatedRecords[idx],
                meterImageUrl: roomUrls.join(",")
              };
            }
          }
          setPendingRoomFiles({});
        } catch (e) {
          throw new Error("Lỗi khi tải ảnh lên Drive. Vui lòng thử lại.");
        }
      }

      setUploadingRoomId(null);

      const [year, m] = month.split("-");
      const formattedMonth = `${year}-${m}`;
      const monthNumForRecord = m.replace(/^0/, "");

      const link = await googleSheetApi.write({
        totalMoney,
        totalElectricity,
        totalWater,
        electricityRecord: updatedRecords.map(r => ({
          ...r,
          meterImageUrl: r.meterImageUrl, // Đảm bảo trường này được truyền đi
          month: monthNumForRecord,
          id: r.id || r.roomId,
        })),
        month: formattedMonth,
      })

      Notification(
        <>Đã lưu dữ liệu lên Google Sheet! <a href={link} target="_blank" className="text-blue-600 underline">Xem tại đây</a></>,
        "SUCCESS"
      );
      setElectricityRecords([...updatedRecords]);
    } catch (error: any) {
      Notification(error.message || "Lỗi lưu dữ liệu. Kiểm tra lại đăng nhập.", "ERROR")
    } finally {
      setLoading(false)
      setUploadingRoomId(null)
    }
  }

  // Upload ảnh công tơ cho từng phòng
  const handleRoomImageUpload = async (roomId: number, files: File[]) => {
    setUploadingRoomId(roomId)
    try {
      const urls = await driveApi.uploadMeterPhoto(files, month)
      const imageUrl = urls.join(",") // Lưu tất cả link, ngăn cách bởi dấu phẩy
      setElectricityRecords(prev => prev.map(r =>
        r.roomId === roomId ? { ...r, meterImageUrl: imageUrl } : r
      ))
      Notification(`Đã tải ảnh phòng ${rooms.find(r => r.id === roomId)?.roomName} lên Drive!`, "SUCCESS")
    } catch (error) {
      Notification("Lỗi upload ảnh", "ERROR")
    } finally {
      setUploadingRoomId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <Button variant="outline" onClick={() => router.push("/admin")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-lg"><Upload className="h-6 w-6 text-white" /></div>
            <h1 className="text-2xl font-bold text-gray-900">Upload Google Sheet</h1>
          </div>
        </div>

        {/* Lịch sử chốt sổ */}
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <h2 className="font-semibold text-lg mb-4 text-gray-800">Lịch sử các tháng đã chốt</h2>
          <SheetHistoryList />
        </div>

        <Card className="border-green-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-green-50/50 py-4">
            <CardTitle className="text-xl flex items-center gap-2 text-green-800">
              <Database className="h-5 w-5" />
              Thông tin tổng hợp tháng {month.split("-")[1]}/{month.split("-")[0]}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2 text-gray-700">
                  <Calendar className="h-4 w-4 text-green-600" /> Tháng chốt sổ
                </Label>
                <Input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="bg-white border-green-100 focus:ring-green-500 focus:border-green-500 transition-all h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Tổng tiền điện (VNĐ)</Label>
                <Input
                  value={formattedMoney}
                  onChange={handleMoneyChange}
                  placeholder="VD: 1.238.080"
                  className="bg-white border-gray-200 focus:ring-green-500 focus:border-green-500 transition-all h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Tổng số điện (kWh)</Label>
                <Input
                  type="number"
                  value={totalElectricity}
                  onChange={(e) => setTotalElectricity(e.target.value)}
                  placeholder="VD: 400"
                  className="bg-white border-gray-200 focus:ring-green-500 focus:border-green-500 transition-all h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Tổng tiền nước (VNĐ) <span className="text-xs font-normal text-gray-600 capitalize">(Tùy chọn)</span></Label>
                <Input
                  value={formattedWater}
                  onChange={handleWaterChange}
                  placeholder="VD: 100.000"
                  className="bg-white border-gray-200 focus:ring-green-500 focus:border-green-500 transition-all h-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card: Chi tiết từng phòng */}
        <Card>
          <CardHeader><CardTitle>Chỉ số từng phòng</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {electricityRecords.map((record) => (
              <div key={record.roomId} className="p-3 bg-gray-50 rounded-lg border">
                <Label className="font-bold text-green-700">
                  {rooms.find(r => r.id === record.roomId)?.roomName || `Phòng ${record.roomId}`}
                </Label>

                {/* Thêm w-full để đảm bảo flexbox lấy chuẩn 100% width của thẻ cha */}
                <div className="flex w-full gap-2 mt-2">

                  {/* Cột Tháng trước: 30% */}
                  <div className="w-[30%]">
                    <span className="text-xs text-gray-600">Tháng trước</span>
                    <Input type="number" value={record.startElectric} onChange={(e) => updateRecord(record.roomId, "startElectric", Number(e.target.value))} />
                  </div>

                  {/* Cột Tháng này: 30% */}
                  <div className="w-[30%]">
                    <span className="text-xs text-gray-600">Tháng này</span>
                    <Input type="number" value={record.endElectric} onChange={(e) => updateRecord(record.roomId, "endElectric", Number(e.target.value))} />
                  </div>

                  {/* Cột Ảnh công tơ: 40% (Bỏ class flex-1 đi) */}
                  <div className="w-[40%] flex flex-col justify-end">
                    <span className="text-xs text-gray-600">Ảnh công tơ (tùy chọn)</span>
                    <div className="flex flex-col gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id={`meter-upload-${record.roomId}`}
                        multiple
                        onChange={(e) => {
                          const files = e.target.files
                          if (files && files.length > 0) {
                            setPendingRoomFiles(prev => ({ ...prev, [record.roomId]: Array.from(files) }))
                          }
                        }}
                      />
                      <div className="flex flex-col gap-2 w-full">
                        <label
                          htmlFor={`meter-upload-${record.roomId}`}
                          className={`cursor-pointer px-3 py-1.5 rounded border flex items-center justify-center gap-2 text-xs font-medium transition-colors ${pendingRoomFiles[record.roomId]?.length > 0 || record.meterImageUrl
                            ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                          <CloudUpload className="h-3 w-3" />
                          {pendingRoomFiles[record.roomId] ? `Đã chọn ${pendingRoomFiles[record.roomId].length} ảnh` : record.meterImageUrl ? "Đã có ảnh" : "Chọn ảnh"}
                        </label>

                        {(pendingRoomFiles[record.roomId]?.length > 0 || record.meterImageUrl) && (
                          <div className="relative group w-full aspect-square mx-auto">
                            <img
                              src={pendingRoomFiles[record.roomId]?.length > 0
                                ? URL.createObjectURL(pendingRoomFiles[record.roomId][0])
                                : getDriveDisplayUrl(record.meterImageUrl?.split(",")[0])}
                              className="w-full h-full object-cover rounded border border-gray-300"
                              alt="preview"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded gap-2">
                              <button
                                onClick={() => setZoomedImage(pendingRoomFiles[record.roomId]?.length > 0 ? URL.createObjectURL(pendingRoomFiles[record.roomId][0]) : getDriveDisplayUrl(record.meterImageUrl?.split(",")[0]))}
                                className="p-1 hover:bg-white/20 rounded"
                              >
                                <Maximize2 className="h-5 w-5 text-white" />
                              </button>
                            </div>
                            {/* Badge số lượng ảnh */}
                            {((pendingRoomFiles[record.roomId]?.length || 0) + (record.meterImageUrl?.split(",").filter(Boolean).length || 0)) > 1 && (
                              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                                +{((pendingRoomFiles[record.roomId]?.length || 0) + (record.meterImageUrl?.split(",").filter(Boolean).length || 0)) - 1}
                              </div>
                            )}
                            {uploadingRoomId === record.roomId && (
                              <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded">
                                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Link xem chi tiết trên Drive */}
                        {record.meterImageUrl && (
                          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
                            {record.meterImageUrl.split(",").map((url, i) => (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                              >
                                {/* <ImageIcon className="h-2.5 w-2.5" /> Ảnh {i + 1} */}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handlePreview} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
            <Calculator className="h-4 w-4 mr-2" /> Xem trước kết quả tính toán
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-2" /> Lưu lên Google Sheet
          </Button>
        </div>

        {/* Bảng Preview kết quả */}
        {previewData && (
          <Card className="border-blue-200">
            <CardHeader className="bg-blue-50 rounded-t-lg pb-4">
              <CardTitle className="text-blue-800">Kết quả xem trước (Preview)</CardTitle>
              <CardDescription>
                Giá điện: <b className="text-red-500">{Math.round(previewData.pricePerUnit).toLocaleString('vi-VN')}đ/số</b> |
                Điện dùng chung: <b>{previewData.shareElectric} số</b> ({Math.round(previewData.shareMoney).toLocaleString('vi-VN')}đ)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3">Phòng</th>
                      <th className="p-3">Số điện (kWh)</th>
                      <th className="p-3 text-right">Tiền nước</th>
                      <th className="p-3 text-right">Tổng tiền phải nộp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {previewData.electricDetails.map((detail: any) => (
                      <tr key={detail.roomId} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 align-top">
                          <div className="font-bold text-gray-900">{detail.roomName}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            {detail.userInRoom} người - Phí DV: {Math.round(detail.serviceFee).toLocaleString('vi-VN')}đ
                          </div>
                        </td>
                        <td className="p-3 align-top">
                          <div className="font-semibold text-blue-700">{detail.totalElectricUsed} kWh</div>
                          <div className="text-[11px] text-gray-600 grid grid-cols-1 gap-0.5 mt-1">
                            <span>• Phòng: {detail.electricityUsedInRoom} số</span>
                            <span>• Máy giặt: {detail.electricityUsedInLaundry} số</span>
                          </div>
                        </td>
                        <td className="p-3 text-right align-top font-medium text-blue-600">
                          {Math.round(detail.totalWaterMoney).toLocaleString('vi-VN')}đ
                        </td>
                        <td className="p-3 text-right align-top">
                          <div className="font-bold text-red-600 text-base">
                            {Math.round(detail.totalMoney).toLocaleString('vi-VN')} VNĐ
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5 italic">Gồm điện + nước + dịch vụ</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Zoom Overlay */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full">
            <X className="h-8 w-8" />
          </button>
          <img
            src={zoomedImage}
            className="max-w-full max-h-full object-contain rounded shadow-2xl"
            alt="zoomed"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}