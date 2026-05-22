import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ROUNDS } from "@/constants/rounds";
import { calcularPontos } from "@/utils/pontuacao";
import { formatDate } from "@/utils/dateFormatter";
import { TeamLogo } from "@/components/TeamLogo";

export default function FinishedCard({ fixture, palpite }) {
  const scoreHome = fixture.goals.home ?? 0;
  const scoreAway = fixture.goals.away ?? 0;

  const resultado = palpite
    ? calcularPontos(palpite, { golsTime1: scoreHome, golsTime2: scoreAway })
    : null;
  const pontos = resultado?.pontos ?? null;

  const badgeClass =
    pontos === 10
      ? "border border-lime-400 text-lime-400 bg-transparent"
      : pontos === 7
      ? "border border-yellow-400 text-yellow-400 bg-transparent"
      : pontos === 5
      ? "border border-sky-400 text-sky-400 bg-transparent"
      : "border border-red-500 text-red-500 bg-transparent";

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-6">
          <span className="text-xs text-muted-foreground">Encerrado</span>
          <span className="text-xs text-muted-foreground">
            {ROUNDS[fixture.league.round] ?? fixture.league.round} · {formatDate(fixture.fixture.date)}
          </span>
        </div>

        <div className="px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex flex-col items-center gap-2">
              <TeamLogo src={fixture.teams.home.logo} name={fixture.teams.home.name} size={40} />
              <span className="text-xs font-medium text-center leading-tight">{fixture.teams.home.name}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold tabular-nums">{scoreHome}</span>
              <span className="text-muted-foreground text-xl">-</span>
              <span className="text-3xl font-bold tabular-nums">{scoreAway}</span>
            </div>

            <div className="flex-1 flex flex-col items-center gap-2">
              <TeamLogo src={fixture.teams.away.logo} name={fixture.teams.away.name} size={40} />
              <span className="text-xs font-medium text-center leading-tight">{fixture.teams.away.name}</span>
            </div>
          </div>
        </div>

        <div className="px-6 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {palpite ? `Seu palpite: ${palpite.golsTime1}-${palpite.golsTime2}` : "Sem palpite"}
          </span>
          {palpite && (
            <Badge className={badgeClass}>
              {`+${pontos ?? 0} pts`}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
