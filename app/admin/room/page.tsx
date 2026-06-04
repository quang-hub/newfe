"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, UserPlus, Users, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Notification } from "@/lib/notification";
import { roomMemberApi, RoomWithMembers, UserItem } from "@/lib/api";

export default function RoomManagementPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await roomMemberApi.list();
      setRooms(data || []);
    } catch (error) {
      Notification("Lỗi tải dữ liệu", "ERROR");
    } finally { setLoading(false); }
  };

  const handleRemoveMember = async (userId: number, userName: string) => {
    if (!window.confirm(`Xóa thành viên ${userName}?`)) return;
    try {
      await roomMemberApi.manage({ id: userId, deleted: true });
      Notification("Đã xóa thành viên", "SUCCESS");
      fetchData();
    } catch (error) {
      Notification("Lỗi khi xóa", "ERROR");
    }
  };

  const openModal = (roomId: number, user?: UserItem) => {
    setSelectedRoomId(roomId);
    if (user) {
      setEditingUser(user);
      setFormData({ name: user.name, email: user.email || "", phone: user.phone || "" });
    } else {
      setEditingUser(null);
      setFormData({ name: "", email: "", phone: "" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await roomMemberApi.manage({
        id: editingUser?.id, 
        roomId: selectedRoomId!,
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
      });
      Notification(editingUser ? "Đã cập nhật" : "Đã thêm mới", "SUCCESS");
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      Notification("Thao tác thất bại", "ERROR");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <Button variant="outline" onClick={() => router.push("/admin")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-600 rounded-lg"><Users className="h-6 w-6 text-white" /></div>
          <h1 className="text-2xl font-bold">Quản lý thành viên</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rooms.map((room) => (
            <Card key={room.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg text-purple-700">{room.roomName}</CardTitle>
                <Button size="sm" onClick={() => openModal(room.id)}>
                  <UserPlus className="h-4 w-4 mr-2" /> Thêm
                </Button>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-gray-100">
                  {room.users.map((user) => (
                    <li key={user.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.phone} {user.email && `| ${user.email}`}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openModal(room.id, user)}>
                          <Edit2 className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(user.id, user.name)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingUser ? "Cập nhật thành viên" : "Thêm thành viên mới"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Tên (*)</Label><Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div><Label>SĐT (tùy chọn)</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
            <div><Label>Email (tùy chọn)</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
            <DialogFooter>
              <Button type="submit" className="bg-purple-600">{editingUser ? "Cập nhật" : "Lưu"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}