import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ROUNDS } from "@/constants/rounds";
import { calcularPontos } from "@/utils/pontuacao";
import { formatDate } from "@/utils/dateFormatter";

export default function FinishedCard({ fixture, palpite }) {
  const scoreHome = fixture.goals.home ?? 0;
  const scoreAway = fixture.goals.away ?? 0;

  const resultado = palpite
    ? calcularPontos(palpite, { golsTime1: scoreHome, golsTime2: scoreAway })
    : null;
  const pontos = resultado?.pontos ?? null;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b border-border">
          <Badge variant="secondary" className="text-xs py-0">Encerrado</Badge>
          <span className="text-xs text-muted-foreground">
            {ROUNDS[fixture.league.round] ?? fixture.league.round} · {formatDate(fixture.fixture.date)}
          </span>
        </div>

        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 justify-end">
              <span className="text-sm font-medium text-right">{fixture.teams.home.name}</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold tabular-nums">{scoreHome}</span>
              <span className="text-muted-foreground mx-1">–</span>
              <span className="text-2xl font-bold tabular-nums">{scoreAway}</span>
            </div>

            <div className="flex-1 flex items-center gap-2">
              <span className="text-sm font-medium text-left">{fixture.teams.away.name}</span>
            </div>
          </div>
        </div>

        <div className="px-3 py-2 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {palpite ? `Palpite: ${palpite.golsTime1}–${palpite.golsTime2}` : "Sem palpite"}
          </span>
          {palpite && (
            <Badge
              className={
                pontos === 10
                  ? "bg-emerald-500 text-white"
                  : pontos === 7
                  ? "bg-blue-500 text-white"
                  : pontos === 5
                  ? "bg-amber-500 text-white"
                  : "bg-muted text-muted-foreground"
              }
            >
              {pontos > 0 ? `+${pontos}` : "+0"}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
