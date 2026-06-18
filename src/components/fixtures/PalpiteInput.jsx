import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ROUNDS } from "@/constants/rounds";
import { formatTime, formatDate, jogoJaComecou } from "@/utils/dateFormatter";
import { CountryFlag } from "@/components/CountryFlag";

export default function PalpiteInput({ fixture, palpite, onSave, saving }) {
  const [g1, setG1] = useState(palpite?.golsTime1 ?? "");
  const [g2, setG2] = useState(palpite?.golsTime2 ?? "");

  const started = jogoJaComecou(fixture);
  const hasPalpite = palpite != null;
  const saved =
    hasPalpite &&
    String(palpite.golsTime1) === String(g1) &&
    String(palpite.golsTime2) === String(g2);

  return (
    <Card className="overflow-hidden p-3">
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-3 py-1.5">
          <div className="flex items-center gap-1.5">
            {started ? (
              <Badge variant="secondary" className="text-xs py-0">Em andamento</Badge>
            ) : (
              <Badge variant="outline" className="text-xs py-1 px-2 border-teal-500 text-teal-400 bg-teal-500/10">
                Aberto até {formatDate(fixture.fixture.date)} {formatTime(fixture.fixture.date)}
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {ROUNDS[fixture.league.round] ?? fixture.league.round}
          </span>
        </div>

        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex flex-col items-center gap-2">
              <CountryFlag country={fixture.teams.home.name} size={32} />
              <span className="text-sm font-medium text-center leading-tight">
                {fixture.teams.home.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="99"
                inputmode="numeric"
                value={g1}
                onChange={(e) => setG1(e.target.value)}
                disabled={started}
                className="w-10 h-9 text-center text-lg font-bold px-0 no-spinner"
              />
              <span className="text-muted-foreground font-medium">×</span>
              <Input
                type="number"
                min="0"
                max="99"
                value={g2}
                onChange={(e) => setG2(e.target.value)}
                disabled={started}
                className="w-10 h-9 text-center text-lg font-bold px-0 no-spinner"
              />
            </div>

            <div className="flex-1 flex flex-col items-center gap-2">
              <CountryFlag country={fixture.teams.away.name} size={32} />
              <span className="text-sm font-medium text-center leading-tight">
                {fixture.teams.away.name}
              </span>
            </div>
          </div>
        </div>

        <div className="px-3 py-2 flex flex-col gap-2 items-center">
          {!started && (
            <Button
              onClick={() => onSave(fixture.fixture.id, g1, g2)}
              disabled={saving || g1 === "" || g2 === "" || saved}
              className="w-full rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-400 text-sm hover:bg-teal-500/30 hover:text-teal-300 hover:border-teal-400/50 dark:hover:bg-teal-500/30 disabled:opacity-30 active:scale-[0.99]"
            >
              {saving ? "Salvando…" : saved ? "Salvo ✓" : "Salvar"}
            </Button>
          )}

          <span className="text-xs text-muted-foreground">
            {fixture.fixture.venue?.name ?? "—"} · {formatTime(fixture.fixture.date)}
          </span>          
        </div>
      </CardContent>
    </Card>
  );
}
