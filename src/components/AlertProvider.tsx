"use client";
import { createContext, useCallback, useContext, useMemo } from "react";
import { toast } from "sonner";
import { TAlert } from "../types/alert";

interface TAlertContext {
  showAlert: (alert: TAlert) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<TAlertContext | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const showAlert = useCallback((alert: TAlert) => {
    const toastFn = {
      success: toast.success,
      error: toast.error,
      warning: toast.warning,
      info: toast.info,
    }[alert.type];

    toastFn(alert.title, {
      description: alert.description,
    });
  }, []);

  const hideAlert = useCallback(() => {
    toast.dismiss();
  }, []);

  const contextValue = useMemo(
    () => ({ showAlert, hideAlert }),
    [showAlert, hideAlert],
  );

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
    </AlertContext.Provider>
  );
}

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAlert must be used within AlertProvider");
  return context;
};
