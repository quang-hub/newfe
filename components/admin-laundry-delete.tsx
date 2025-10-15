import { laundryApi, LaundryRecordItem } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { Notification } from "@/lib/notification"


export default function AdminLaundryDelete() {
  const [month, setMonth] = useState(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
  });
  const [roomFilter, setRoomFilter] = useState<string>("all"); // "all" | roomName
  const [data, setData] = useState<LaundryRecordItem[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [toConfirm, setToConfirm] = useState<"single" | "bulk" | null>(null);

  // Fake fetch demo (thay bằng GET /api/laundry?month=...&roomName=...)
  useEffect(() => {
    // ví dụ dữ liệu đúng type
    fetchListLaundry();

    setSelected(new Set());
  }, [month]);

  const fetchListLaundry = (async () => {
    const data = await laundryApi.list(month);
    setData(data);
  })
  // Danh sách roomName duy nhất để lọc
  const roomNames = useMemo(() => {
    const s = new Set<string>();
    data.forEach((r) => s.add(r.roomName));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [data]);

  // Filter theo month (YYYY-MM), roomName, và ô tìm kiếm q
  const filtered = useMemo(() => {
    return data.filter((r) => {
      const byMonth = r.createdAt.startsWith(month); // ISO có thể dùng startsWith("YYYY-MM")
      const byRoom =
        roomFilter === "all" ? true : r.roomName === roomFilter;

      return byMonth && byRoom ;
    });
  }, [data, month, roomFilter]);

  const toggle = (id: number) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectAll = () => setSelected(new Set(filtered.map((r) => r.id)));
  const clearSel = () => setSelected(new Set());

  const doDelete = async (ids: number[]) => {
    // TODO: gọi API delete/bulk-delete ở đây
    // await fetch("/api/laundry/bulk-delete", { method: "POST", body: JSON.stringify({ ids }) })
    const data = await laundryApi.delete(ids);

    // cập nhật UI lạc quan
    await fetchListLaundry();

    setSelected((s) => {
      const next = new Set(s);
      ids.forEach((i) => next.delete(i));
      return next;
    });
    Notification("Thành công", "SUCCESS");
    setToConfirm(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-3 p-4 sm:p-6 bg-white/70 rounded-xl">
      <h1 className="text-xl font-semibold">Quản lý lịch sử máy giặt</h1>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 items-center">
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="border rounded px-2 py-1 bg-white"
          >
            <option value="all">Tất cả phòng</option>
            {roomNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border rounded px-2 py-1 bg-white"
          />

        </div>
      </div>

      <div className="rounded border p-3 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-slate-600">Kết quả: {filtered.length}</div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border rounded" onClick={selectAll}>
              Chọn tất cả
            </button>
            <button className="px-3 py-1 border rounded" onClick={clearSel}>
              Bỏ chọn
            </button>
            <button
              className="px-3 py-1 rounded bg-red-600 text-white disabled:opacity-50"
              disabled={selected.size === 0}
              onClick={() => setToConfirm("bulk")}
            >
              Xóa đã chọn ({selected.size})
            </button>
          </div>
        </div>

        <ul className="divide-y w-full">
          {filtered.length === 0 ? (
            <li className="py-6 text-center text-sm text-slate-500">
              Không có bản ghi.
            </li>
          ) : (
            filtered.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                  />
                  <span>
                    {r.roomName} — {new Date(r.createdAt).toLocaleString()}
                  </span>
                </label>
                <button
                  className="px-2 py-1 text-red-600"
                  onClick={() => {
                    setSelected(new Set([r.id]));
                    setToConfirm("single");
                  }}
                >
                  🗑 Xóa
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Confirm dialog */}
      {toConfirm && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center">
          <div className="bg-white rounded-xl p-4 w-full max-w-sm shadow">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Xóa bản ghi</h3>
              <button className="px-2" onClick={() => setToConfirm(null)}>
                X
              </button>
            </div>
            <p className="mt-2 text-sm">
              Bạn có chắc chắn muốn xóa <b>{selected.size}</b> bản ghi?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-1 border rounded" onClick={() => setToConfirm(null)}>
                Hủy
              </button>
              <button
                className="px-3 py-1 bg-red-600 text-white rounded"
                onClick={() => doDelete(Array.from(selected))}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
