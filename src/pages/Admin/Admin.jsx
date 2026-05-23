import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { fetchRounds, fetchFixturesByRound } from "@/api/api";
// TEMP: remove next line before final release
import { fetchBrasileiraoFixtures } from "@/api/brasileirao";
import { apurarJogo, apurarTodosPendentes } from "@/lib/apuracao";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// TEMP: remove before final release
const COMPETITIONS = [
  { value: "copa", label: "Copa do Mundo" },
  { value: "brasileirao", label: "Brasileirao" },
];

export default function Admin() {
  const { user } = useAuth();
  // TEMP: remove `competition` state before final release
  const [competition, setCompetition] = useState("copa");
  const [fixtures, setFixtures] = useState([]);
  const [jogosApurados, setJogosApurados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apurando, setApurando] = useState(false);
  const [apurandoId, setApurandoId] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setFixtures([]);
      try {
        const [allFixtures, apuradosSnap] = await Promise.all([
          // TEMP: brasileirao branch — remove before final release
          competition === "brasileirao"
            ? fetchBrasileiraoFixtures()
            : (async () => {
                const rounds = await fetchRounds();
                const arr = [];
                for (const round of rounds) {
                  const rf = await fetchFixturesByRound(round);
                  if (rf) arr.push(...rf);
                }
                return arr;
              })(),
          getDocs(collection(db, "jogosApurados")),
        ]);

        setJogosApurados(apuradosSnap.docs.map((d) => d.id));
        setFixtures(allFixtures.filter((f) => f.fixture.status.short === "FT"));
      } catch (err) {
        console.error("Erro ao carregar admin:", err);
        toast.error("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [competition]);

  const handleApurarTodos = async () => {
    setApurando(true);
    try {
      const allFixtures = [...fixtures];
      const resultados = await apurarTodosPendentes(allFixtures, jogosApurados);
      const apurados = resultados.filter((r) => r.sucesso);
      const novosIds = apurados.map((r) => String(r.fixtureId));
      setJogosApurados((prev) => [...prev, ...novosIds]);
      toast.success(
        apurados.length > 0
          ? `${apurados.length} jogo(s) apurado(s) com sucesso`
          : "Nenhum jogo pendente para apurar"
      );
    } catch (err) {
      console.error("Erro ao apurar:", err);
      toast.error("Erro ao apurar jogos");
    } finally {
      setApurando(false);
    }
  };

  const handleApurarJogo = async (fixture) => {
    setApurandoId(fixture.fixture.id);
    try {
      const resultado = await apurarJogo(fixture.fixture.id, {
        golsTime1: fixture.goals.home,
        golsTime2: fixture.goals.away,
      });
      if (resultado.sucesso) {
        setJogosApurados((prev) => [...prev, String(fixture.fixture.id)]);
        toast.success(`Jogo apurado — ${resultado.totalPalpites} palpite(s)`);
      } else {
        toast.info("Jogo já havia sido apurado");
      }
    } catch (err) {
      console.error("Erro ao apurar jogo:", err);
      toast.error("Erro ao apurar jogo");
    } finally {
      setApurandoId(null);
    }
  };

  if (user?.email !== import.meta.env.VITE_ADMIN_EMAIL) {
    return <Navigate to="/palpites" replace />;
  }

  const pendentes = fixtures.filter(
    (f) => !jogosApurados.includes(String(f.fixture.id))
  );

  if (loading) {
    return (
      <Layout title="Admin" subtitle="Painel de apuração">
        <div className="p-4 text-center text-muted-foreground text-sm pt-12">
          Carregando jogos...
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin" subtitle="Painel de apuração">
      <div className="p-4 space-y-4">
        {/* TEMP: competition selector — remove before final release */}
        <div className="flex justify-end">
          <Select value={competition} onValueChange={setCompetition}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom">
              {COMPETITIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-muted-foreground">
            {fixtures.length} encerrados · {jogosApurados.length} apurados · {pendentes.length} pendentes
          </p>
          <Button
            onClick={handleApurarTodos}
            disabled={apurando || pendentes.length === 0}
            size="sm"
          >
            {apurando ? "Apurando..." : "Apurar todos pendentes"}
          </Button>
        </div>

        <div className="space-y-2">
          {fixtures.map((fixture) => {
            const id = fixture.fixture.id;
            const apurado = jogosApurados.includes(String(id));
            const emAndamento = apurandoId === id;

            return (
              <Card key={id} className="overflow-hidden">
                <CardContent className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {fixture.teams.home.name} {fixture.goals.home}–{fixture.goals.away} {fixture.teams.away.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {fixture.league.round} · ID {id}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {apurado ? (
                      <Badge className="bg-emerald-500 text-white">Apurado</Badge>
                    ) : (
                      <Badge className="bg-amber-400 text-white">Pendente</Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={apurado || apurando || emAndamento}
                      onClick={() => handleApurarJogo(fixture)}
                    >
                      {emAndamento ? "..." : "Apurar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {fixtures.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Nenhum jogo encerrado encontrado.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
