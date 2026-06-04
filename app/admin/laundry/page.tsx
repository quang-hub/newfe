"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Calendar, WashingMachine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { laundryApi, LaundryRecordItem } from "@/lib/api";
import { Notification } from "@/lib/notification";

export default function LaundryManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Khởi tạo tháng hiện tại (YYYY-MM)
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  
  const [records, setRecords] = useState<LaundryRecordItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, [month]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await laundryApi.list(month);
      setRecords(data || []);
    } catch (error) {
      Notification("Lỗi tải dữ liệu", "ERROR");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lượt giặt này?")) return;

    try {
      // Gọi API xóa (truyền mảng ids theo thiết kế của API)
      await laundryApi.delete([id]);
      Notification("Xóa thành công!", "SUCCESS");
      fetchRecords(); 
    } catch (error) {
      Notification("Xóa thất bại", "ERROR");
    }
  };

  // Format datetime: "18:26 10/04/2026"
  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <Button variant="outline" onClick={() => router.push("/admin")} className="mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-600 rounded-lg">
            <WashingMachine className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý máy giặt</h1>
            <p className="text-sm text-gray-600">Lịch sử và thống kê sử dụng</p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">Danh sách lượt giặt</CardTitle>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Input 
                type="month" 
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-auto"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Đang tải...</div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Không có dữ liệu trong tháng này.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="p-3 font-medium rounded-tl-lg">ID</th>
                      <th className="p-3 font-medium">Phòng</th>
                      <th className="p-3 font-medium">Thời gian</th>
                      <th className="p-3 font-medium text-right rounded-tr-lg">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 text-gray-500">#{record.id}</td>
                        <td className="p-3 font-medium text-gray-900">{record.roomName}</td>
                        <td className="p-3 text-gray-600">{formatDateTime(record.createdAt)}</td>
                        <td className="p-3 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(record.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}