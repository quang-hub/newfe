"use client"

import { toast } from "react-toastify";
import type { ToastContent } from "react-toastify";

export function Notification(
  message: ToastContent, // 👈 đổi từ string → ToastContent (cho phép JSX)
  type: "SUCCESS" | "ERROR" | "WARNING"
) {
  const commonOptions = {
    position: "top-right" as const,
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "light" as const,
  };

  if (type === "SUCCESS") {
    toast.success(message, commonOptions);
  } else if (type === "ERROR") {
    toast.error(message, commonOptions);
  } else if (type === "WARNING") {
    toast.warning(message, commonOptions);
  }
}
