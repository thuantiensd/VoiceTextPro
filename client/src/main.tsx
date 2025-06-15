import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Admin settings routes - ADVANCED VERSIONS
import AppSettingsAdvanced from "./pages/admin/app-settings-advanced";
import PaymentSettingsAdvanced from "./pages/admin/payment-settings-advanced";
import SystemMaintenanceAdvanced from "./pages/admin/system-maintenance-advanced";

createRoot(document.getElementById("root")!).render(<App />);
