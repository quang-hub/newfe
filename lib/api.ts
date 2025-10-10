const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"

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
      ...(options.body ? { "Content-Type": "application/json" } : {}),
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

  upload: () =>
    apiRequest<string>("/api/laundry/upload", {
      method: "POST",
      body: JSON.stringify({}),
    }),
}

export const electricApi = {
  save: (payload: Array<{ roomId: number; electric: number }>) =>
    apiRequest<string>("/api/electric/save", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  calculate: (payload: {
    totalMoney: number
    totalElectric: number
    month: string
    electrics: Array<{ roomId: number; startElectric: number; endElectric: number }>
  }) =>
    apiRequest<CalculationResult>("/api/electric/calculate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  list: () => apiRequest<ElectricityRecord[]>("/api/electric/list")
}

export const googleSheetApi = {
  // Kiểm tra xem user đã xác thực Google Sheets chưa
  checkAuth: () => apiRequest<boolean>("/auth/sheet/status"),

  // Lấy URL để bắt đầu OAuth (nếu bạn muốn FE tự mở link này)
  getAuthUrl: () => `${API_BASE_URL}/auth/sheet`,
}

interface ElectricityRecord {
  roomId: number
  startElectric: number
  endElectric: number
}


interface CalculationResult {
  pricePerUnit: number
  shareElectric: number
  shareMoney: number
  electricDetails: {
    roomId: number
    roomName: string
    elctricityUsedInLaundry: number
    totalElectricUsed: number
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

export const sheetApi = {
  list: () => apiRequest<SavedSheetItem[]>("/api/sheet/list"),
}
