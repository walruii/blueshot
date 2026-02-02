"use client";
import { createContext, useContext, useState } from "react";
import { TAlert } from "../types/alertType";
import Alert from "./Alert";

interface TAlertContext {
  showAlert: (alert: TAlert) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<TAlertContext | undefined>(undefined);

export default function AlertProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [alert, setAlert] = useState<TAlert | null>(null);

  const showAlert = (alert: TAlert) => setAlert(alert);
  const hideAlert = () => setAlert(null);
  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {alert && <Alert alert={alert} onClose={hideAlert}></Alert>}
      {children}
    </AlertContext.Provider>
  );
}

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAlert must be used within AlertProvider");
  return context;
};
