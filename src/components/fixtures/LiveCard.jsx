import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ROUNDS } from "@/constants/rounds";
import { CountryFlag } from "@/components/CountryFlag";
import { ChevronRight } from "lucide-react"

export default function LiveCard({ fixture, palpite, onClick }) {
  const scoreHome = fixture.goals.home ?? 0;
  const scoreAway = fixture.goals.away ?? 0;

  return (
    <div className="relative">
    <Card
      className={`${onClick ? " cursor-pointer hover:bg-muted/50 transition-colors" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-6">
          <Badge className="bg-red-500 text-white text-xs py-0 gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
            Ao vivo
          </Badge>
          <span className="text-xs text-muted-foreground">{ROUNDS[fixture.league.round] ?? fixture.league.round}</span>
        </div>

        <div className="px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex flex-col items-center gap-2">
              <CountryFlag country={fixture.teams.home.name} size={32} />
              <span className="text-sm font-medium text-center leading-tight">
                {fixture.teams.home.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold tabular-nums">{scoreHome}</span>
              <span className="text-muted-foreground text-xl">-</span>
              <span className="text-3xl font-bold tabular-nums">{scoreAway}</span>
            </div>

            <div className="flex-1 flex flex-col items-center gap-2">
              <CountryFlag country={fixture.teams.away.name} size={32} />
              <span className="text-sm font-medium text-center leading-tight">
                {fixture.teams.away.name}
              </span>
            </div>
          </div>
        </div>

        {palpite ? (
          <div className="px-6 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {`Seu palpite: ${palpite.golsTime1}-${palpite.golsTime2}`}
            </span>
          </div>
        ) : (
          <div className="px-3 py-2 border-t border-border">
            <span className="text-xs text-muted-foreground">Sem palpite registrado</span>
          </div>
        )}
      </CardContent>
    </Card>
    {onClick && (
      <div className="w-6 h-6 rounded-full flex items-center justify-center absolute -right-3 top-1/2 -translate-y-1/2 bg-teal-500">
        <ChevronRight className="ml-0.5"/>
      </div>
    )}
    </div>
  );
}
