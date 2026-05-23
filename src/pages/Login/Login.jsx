import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { toast } from "sonner";
import { loginComGoogle } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/palpites", { replace: true });
  }, [user, loading, navigate]);

  const handleLogin = async () => {
    setSigning(true);
    try {
      await loginComGoogle();
    } catch (error) {
      if (error.code !== "auth/popup-closed-by-user") {
        toast.error("Erro ao entrar com Google. Tente novamente.");
      }
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
          <Trophy className="w-10 h-10 text-primary-foreground" />
        </div>

        <div className="text-center space-y-2">
          <h1 class="font-display font-[Fraunces,ui-serif,serif] text-7xl mt-1 leading-[0.95] tracking-tight text-foreground">Copa<br/><span class="italic font-normal">2026</span></h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Faça seus palpites e dispute o ranking com seus amigos
          </p>
        </div>

        <Button
          onClick={handleLogin}
          disabled={signing || loading}
          variant="outline"
          className="w-full h-12 gap-3 text-base border-border bg-card hover:bg-secondary text-foreground shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.4a4.63 4.63 0 01-2 3.04v2.53h3.24c1.89-1.74 2.96-4.3 2.96-7.36z" fill="#4285F4"/>
            <path d="M10 20c2.7 0 4.97-.9 6.62-2.42l-3.23-2.53a6.07 6.07 0 01-9.05-3.18H.97v2.62A10 10 0 0010 20z" fill="#34A853"/>
            <path d="M4.34 11.87A6.04 6.04 0 014.03 10c0-.65.11-1.28.31-1.87V5.51H.97A10 10 0 000 10c0 1.61.38 3.14 1.05 4.49l3.29-2.62z" fill="#FBBC05"/>
            <path d="M10 3.96a5.46 5.46 0 013.85 1.51l2.87-2.87A9.65 9.65 0 0010 0 10 10 0 00.97 5.51l3.37 2.62A5.94 5.94 0 0110 3.96z" fill="#EA4335"/>
          </svg>
          {signing ? "Entrando…" : "Entrar com Google"}
        </Button>      
      </div>
    </div>
  );
}
