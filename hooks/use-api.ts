"use client"

import { useState, useEffect } from "react"
import { ApiError } from "@/lib/api"

export function useApi<T>(apiCall: () => Promise<T>, dependencies: any[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiCall()
      setData(result)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`API Error (${err.status}): ${err.message}`)
      } else {
        setError(err instanceof Error ? err.message : "Unknown error occurred")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, dependencies)

  return { data, loading, error, refetch: fetchData }
}

export function useApiMutation<T, P>(apiCall: (params: P) => Promise<T>) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = async (params: P): Promise<T | null> => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiCall(params)
      return result
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`API Error (${err.status}): ${err.message}`)
      } else {
        setError(err instanceof Error ? err.message : "Unknown error occurred")
      }
      return null
    } finally {
      setLoading(false)
    }
  }

  return { mutate, loading, error }
}
