import { useNavigate, useLocation } from "react-router-dom";
import { Home, Trophy, User, ShieldCheck, Star } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRanking } from "@/contexts/RankingContext";
import { cn } from "@/utils/cn";

const NAV_ITEMS = [
  { path: "/palpites", icon: Home, label: "Jogos" },
  { path: "/ranking", icon: Trophy, label: "Ranking" },
  { path: "/extras", icon: Star, label: "Extras" },
  { path: "/meus-palpites", icon: User, label: "Meus Palpites" },
  { path: "/admin", icon: ShieldCheck, label: "Admin", adminOnly: true },
];

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

export default function Layout({ children }) {
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const { userEntry, userPos, total } = useRanking();
  const navigate = useNavigate();
  const location = useLocation();

  const initials = user?.displayName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b border-line sticky bg-ink/85 backdrop-blur top-0 z-30">
        <div className="mx-auto flex items-center justify-between px-4 py-3 shrink-0">
          <div className="flex flex-col select-none">
            <span className="text-xs tracking-wider text-muted-foreground leading-tight uppercase">Bolão</span>
            
            <span className="text-lg mt-0.5">
              Copa
              <span className="text-lg italic text-teal-500">{" "} 2026</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.filter(({ adminOnly }) => !adminOnly || isAdmin).map(({ path, icon: Icon, label }) => {
              const isActive = location.pathname === path;
              return (
                <Button
                  key={path}
                  variant="ghost"
                  onClick={() => navigate(path)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm",
                    isActive
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive && "stroke-[2.5]")} />
                  <span>{label}</span>
                </Button>
              );
            })}
          </nav>

          <div className="flex gap-2 items-center">
            <div className="flex flex-col items-center">
              <span className="text-xs text-muted-foreground"><span className="text-lg text-teal-500">{userEntry?.total ?? 0}</span> pts</span>
              <span className="text-xs text-muted-foreground">#{userPos} de {total}</span>
            </div>
            <Avatar className="w-9 h-9">
              <AvatarImage src={user?.photoURL} alt={user?.displayName} />
              <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full">
        {children}
      </div>

      <div className="md:hidden border-t border-border sticky bottom-0 bg-background z-30">
        <div className="flex">
          {NAV_ITEMS.filter(({ adminOnly }) => !adminOnly || isAdmin).map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Button
                key={path}
                variant="ghost"
                onClick={() => navigate(path)}
                className={cn(
                  "flex-1 flex flex-col h-auto items-center gap-1 py-2 px-1 text-xs",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
                <span>{label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
