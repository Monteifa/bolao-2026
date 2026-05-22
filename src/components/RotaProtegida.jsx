import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function RotaProtegida({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? children : <Navigate to="/" replace />;
}
