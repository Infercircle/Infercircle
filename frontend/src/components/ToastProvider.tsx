import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { FiCheckCircle } from "react-icons/fi";

interface Toast {
  id: number;
  message: string;
  type?: "success" | "error";
}

interface ToastContextType {
  showToast: (message: string, type?: "success" | "error") => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toasts container */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 items-center">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border border-[#23272b] bg-[#23272b] text-white min-w-[220px] max-w-xs animate-fadeIn ${toast.type === "success" ? "text-[#A259FF]" : "text-red-400"}`}
          >
            <FiCheckCircle className={toast.type === "success" ? "text-[#A259FF]" : "text-red-400"} size={20} />
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}; 