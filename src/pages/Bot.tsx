import { Navigate } from "react-router-dom"

export default function Bot() {
  // Redirect to dashboard by default
  return <Navigate to="/bot/dashboard" replace />
}

