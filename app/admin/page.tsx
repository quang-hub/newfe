// app/admin/page.tsx (Next.js App Router)
"use client";

import { useRouter } from "next/navigation";
import { Upload, ArrowLeft, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminLaundryDelete from "@/components/admin-laundry-delete";

export default function AdminPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4 sm:p-6">
      {/* tăng bề rộng khả dụng để các card/grid nhìn cân hơn */}
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div>
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>

          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-green-600 p-2">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Chức năng quản trị
            </h1>
          </div>
        </div>

        {/* Hàng nút thao tác: cao đều, căn lưới đẹp trên mọi màn hình */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 [grid-auto-rows:56px]">
          <Button
            onClick={() => router.push("/admin/upload")}
            className="h-fit justify-start bg-green-600 hover:bg-green-700"
          >
            <FileUp className="mr-2 h-4 w-4" />
            Upload Google Sheet
          </Button>

          {/* chừa slot cho nút khác sau này vẫn giữ lưới ổn */}
          {/* <Button className="h-full justify-start" variant="secondary">...</Button> */}
          {/* <Button className="h-full justify-start" variant="secondary">...</Button> */}
        </div>

        {/* Khối quản trị xóa: full width, tự co giãn nội dung */}
        <div className="rounded-2xl border border-black/5 bg-white/60 p-4 shadow-sm backdrop-blur">
          <AdminLaundryDelete />
        </div>
      </div>
    </div>
  );
}
