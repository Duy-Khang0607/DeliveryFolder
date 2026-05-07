"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CircleX, Info, Truck } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

type Toast = {
    id: string;
    message: string;
    type: ToastType;
};

type ToastContextType = {
    showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: ToastType = "success") => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 2500);
    };

    const typeToast = [
        {
            type: "success",
            icon: <div className="bg-white rounded-full text-center text-green-700 p-1.5">
                <Truck className="w-5 h-5" />
            </div>,
            bg: "bg-green-500 border-green-700"
        },
        {
            type: "error",
            icon: <div className="bg-white rounded-full text-center text-red-700 p-1.5">
                <CircleX className="w-5 h-5" />
            </div>,
            bg: "bg-red-500 border-red-700"
        },
        {
            type: "info",
            icon: <div className="bg-white rounded-full text-center text-blue-400 p-1.5">
                <Info className="w-5 h-5" />
            </div>,
            bg: "bg-blue-500 border-blue-700"
        },
        {
            type: "warning",
            icon: <div className="bg-white rounded-full text-center text-yellow-700 p-1.5">
                <AlertTriangle className="w-5 h-5" />
            </div>,
            bg: "bg-yellow-500 border-yellow-700"
        }
    ]

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast UI */}
            <div className="fixed top-5 right-5 z-999 space-y-3">
                <AnimatePresence>
                    {toasts?.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ x: 40, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 40, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 40, damping: 14 }}
                            className={`px-2 py-2 h-full rounded-xl shadow-lg flex flex-row items-center gap-2 text-white w-fit shadow-white/50 border-white bg-black/10 backdrop-blur-sm
                            ${typeToast?.find((t) => t?.type === toast?.type)?.bg || ""}
                        `}>
                            {typeToast?.find((t) => t?.type === toast?.type)?.icon || null}
                            <span className="text-xs md:text-sm w-full">{toast?.message}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}
