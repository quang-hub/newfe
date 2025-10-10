"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { sheetApi, type SavedSheetItem } from "@/lib/api"
import { History } from "lucide-react";

export function SheetHistoryList() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<SavedSheetItem[]>([])

  const handleOpen = async () => {
    setOpen(true)
    setLoading(true)
    try {
      const res = await sheetApi.list()
      setData(res)
    } catch (err) {
      console.error("Error fetching sheet history:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Nút icon lịch sử */}
      <Button variant="outline" onClick={handleOpen} className="flex items-center gap-2">
        <History className="h-4 w-4" />
        Lịch sử
      </Button>

      {/* Dialog hiển thị danh sách */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Lịch sử Google Sheet đã lưu</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="text-center py-6 text-gray-500">Đang tải...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-6 text-gray-500">Chưa có bản lưu nào</div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {data.map((item) => (
                <div
                  key={item.sheetUrl}
                  className="border rounded-lg p-3 bg-white shadow-sm hover:bg-gray-50 transition"
                >
                  <div className="font-semibold text-gray-800">Tháng {item.month}</div>
                  <div className="text-sm text-gray-600">
                    Tổng điện: {item.totalElectricUsed} | Tổng tiền:{" "}
                    {new Intl.NumberFormat("vi-VN").format(item.totalMoney)} đ
                  </div>
                  <a
                    href={item.sheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm underline"
                  >
                    Mở Sheet
                  </a>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
