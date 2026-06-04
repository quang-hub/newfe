const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const config: RequestInit = {
    // chỉ set Content-Type nếu có body
    headers: {
      ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    credentials: "include",
    ...options,
  }

  try {
    const response = await fetch(url, config)

    if (response.status === 204) {
      // No Content → trả null/undefined tuỳ bạn muốn
      return null as T
    }

    if (!response.ok) {
      throw new ApiError(response.status, `HTTP error! status: ${response.status}`)
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() || ""

    if (contentType.includes("application/json")) {
      return (await response.json()) as T
    }

    if (contentType.startsWith("text/")) {
      return (await response.text()) as T
    }

    // Fallback: nếu server không set content-type
    const text = await response.text()
    if (text && text.length > 0) {
      return text as T
    }
    // body trống
    return null as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new Error(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}


// API functions
export const roomApi = {
  list: () => apiRequest<Array<{ id: number; roomName: string }>>("/api/room/list"),
  login: (credentials: { username: string; password: string }) =>
    apiRequest("/api/room/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
}

export const scheduleApi = {
  addCurrentDuty: () =>
    apiRequest<string>("/api/schedule/current", { method: "POST", body: "{}" }),
  getCurrentDuty: () =>
    apiRequest<string>("/api/schedule/current"),
};

export const laundryApi = {
  stats: (month: string) =>
    apiRequest<
      Array<{
        roomId: number
        roomName: string
        count: number
        detailTime: Array<{
          id: number
          roomId: number
          createdAt: string
        }>
      }>
    >(`/api/laundry/stats?month=${month}`),

  save: (roomId: number) => apiRequest<string>(`/api/laundry/save?roomId=${roomId}`),

  list: (month: string) => apiRequest<LaundryRecordItem[]>(`/api/laundry/list?month=${month}`),

  delete: (ids: number[]) => apiRequest<string>(`/api/laundry/delete`, {
    method: "POST",
    body: JSON.stringify(ids)
  }),

  upload: () =>
    apiRequest<string>("/api/laundry/upload", {
      method: "POST",
      body: JSON.stringify({}),
    }),
}

export const electricApi = {
  save: (payload: Array<{ roomId: number; startElectric: number; endElectric: number; meterImageUrl?: string }>) =>
    apiRequest<string>("/api/electric/save", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  calculate: (payload: {
    totalMoney: string
    totalElectricity: string
    totalWater: string
    electricityRecord: ElectricityRecord[]
  }) =>
    apiRequest<CalculationResult>("/api/electric/calculate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  list: (month?: string) => apiRequest<ElectricityRecord[]>(`/api/electric/list${month ? `?month=${month}` : ""}`)
}

export const driveApi = {
  uploadMeterPhoto: (files: File[], month: string) => {
    const formData = new FormData()
    files.forEach(file => formData.append("file", file))
    formData.append("month", month)
    return apiRequest<string[]>("/api/drive/upload/meter", {
      method: "POST",
      body: formData,
      // Khi dùng FormData, fetch sẽ tự set Content-Type include boundary
      // nên ta cần tránh apiRequest set application/json
    })
  },
}

export const googleSheetApi = {
  // Kiểm tra xem user đã xác thực Google Sheets chưa
  checkAuth: () => apiRequest<boolean>("/auth/sheet/status"),

  // Lấy URL để bắt đầu OAuth (nếu bạn muốn FE tự mở link này)
  getAuthUrl: () => `${API_BASE_URL}/auth/sheet`,

  write: (payload: {
    totalMoney: string;
    totalElectricity: string;
    totalWater: string;
    electricityRecord: ElectricityRecord[];
    month: string;
  }) => apiRequest<string>("/auth/sheet/write", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
}

export const roomMemberApi = {
  list: () => apiRequest<RoomWithMembers[]>("/api/room/members"),

  // Một hàm duy nhất cho Add, Update, Delete
  manage: (payload: UpdateMemberPayload) =>
    apiRequest<string>("/api/room/updateMember", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export interface LaundryRecordItem {
  id: number
  roomName: string
  createdAt: string
}

export interface ElectricityRecord {
  id: number
  startElectric: number
  endElectric: number
  month: string
  roomId: number
  meterImageUrl?: string
}


interface CalculationResult {
  pricePerUnit: number
  shareElectric: number
  shareMoney: number
  electricDetails: {
    roomId: number
    roomName: string
    userInRoom: number
    serviceFee: number
    electricityUsedInLaundry: number
    electricityUsedInRoom: number
    totalElectricUsed: number
    totalWaterMoney: number
    totalMoney: number
  }[]
}

// lib/api.ts

export interface SavedSheetItem {
  totalMoney: number
  totalElectricUsed: number
  month: string          // "10-2025"
  sheetUrl: string       // https://docs.google.com/...
}

export interface UpdateMemberPayload {
  id?: number;         // Có id => Update/Delete, Không id => Add
  name?: string;
  email?: string | null;
  roomId?: number;
  phone?: string | null;
  deleted?: boolean;   // true => Delete
}

export interface UserItem {
  id: number;
  name: string;
  email: string | null;
  roomId: number;
  phone: string | null;
}

export interface RoomWithMembers {
  id: number;
  roomName: string;
  users: UserItem[];
}

export const sheetApi = {
  list: () => apiRequest<SavedSheetItem[]>("/api/sheet/list"),
}
