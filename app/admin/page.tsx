"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, FileUp, Users, WashingMachine } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <Button variant="outline" onClick={() => router.push("/")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại trang chủ
        </Button>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Quản trị hệ thống</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* GIỮ NGUYÊN: Nút dẫn tới trang Upload cũ */}
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/admin/upload")}>
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-green-100 rounded-full"><FileUp className="h-8 w-8 text-green-600" /></div>
              <h2 className="text-xl font-semibold">Upload Google Sheet</h2>
              <p className="text-sm text-center text-gray-500">Nhập số điện và đồng bộ lên Google Sheet</p>
            </div>
          </Card>

          {/* MỚI: Quản lý người trong room */}
          <Card className="p-6 hover:shadow-md transition-shadow" onClick={() => router.push("/admin/room")}>
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-purple-100 rounded-full"><Users className="h-8 w-8 text-purple-600" /></div>
              <h2 className="text-xl font-semibold">Quản lý người trong phòng</h2>
              <Button variant="link">Xem danh sách</Button>
            </div>
          </Card>

          {/* MỚI: Quản lý máy giặt */}
          <Card className="p-6 hover:shadow-md transition-shadow" onClick={() => router.push("/admin/laundry")}>
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-blue-100 rounded-full"><WashingMachine className="h-8 w-8 text-blue-600" /></div>
              <h2 className="text-xl font-semibold">Quản lý máy giặt</h2>
              <Button variant="link">Thống kê & Xóa</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper Card component đơn giản
function Card({ children, className, onClick }: any) {
  return (
    <div onClick={onClick} className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>
      {children}
    </div>
  )
}