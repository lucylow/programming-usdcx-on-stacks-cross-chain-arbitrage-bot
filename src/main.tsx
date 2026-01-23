import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { logLovableInfo } from "../lib/utils/lovable";

// Initialize Lovable integration
logLovableInfo();

createRoot(document.getElementById("root")!).render(<App />);
