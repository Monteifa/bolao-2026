import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ROUNDS } from "@/constants/rounds";
import { calcularPontos } from "@/utils/pontuacao";

export default function LiveCard({ fixture, palpite }) {
  const scoreHome = fixture.goals.home ?? 0;
  const scoreAway = fixture.goals.away ?? 0;

  const resultadoAgora = palpite
    ? calcularPontos(palpite, { golsTime1: scoreHome, golsTime2: scoreAway })
    : null;
  const pontosAgora = resultadoAgora?.pontos ?? null;

  return (
    <Card className="border-red-300 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-3 py-1.5 bg-red-50 border-b border-red-200">
          <Badge className="bg-red-500 text-white text-xs py-0 gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
            Ao vivo · {fixture.fixture.status.elapsed}'
          </Badge>
          <span className="text-xs text-red-600">{ROUNDS[fixture.league.round] ?? fixture.league.round}</span>
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

        {palpite ? (
          <div className="px-3 py-2 border-t border-border flex items-center justify-between bg-muted/30">
            <span className="text-xs text-muted-foreground">
              Seu palpite: {palpite.golsTime1}–{palpite.golsTime2}
            </span>
            <Badge
              variant="outline"
              className={
                pontosAgora === 10
                  ? "text-emerald-600 border-emerald-300"
                  : pontosAgora === 7
                  ? "text-blue-600 border-blue-300"
                  : pontosAgora === 5
                  ? "text-amber-600 border-amber-300"
                  : "text-muted-foreground"
              }
            >
              {pontosAgora > 0 ? `+${pontosAgora} pts` : "+0 pts"}
            </Badge>
          </div>
        ) : (
          <div className="px-3 py-2 border-t border-border">
            <span className="text-xs text-muted-foreground">Sem palpite registrado</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
