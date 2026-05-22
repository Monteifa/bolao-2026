import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { fetchRounds, fetchFixturesByRound } from "@/api/api";
import { apurarJogo, apurarTodosPendentes } from "@/lib/apuracao";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Admin() {
  const { user } = useAuth();
  const [fixtures, setFixtures] = useState([]);
  const [jogosApurados, setJogosApurados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apurando, setApurando] = useState(false);
  const [apurandoId, setApurandoId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [rounds, apuradosSnap] = await Promise.all([
          fetchRounds(),
          getDocs(collection(db, "jogosApurados")),
        ]);

        const apuradosIds = apuradosSnap.docs.map((d) => d.id);
        setJogosApurados(apuradosIds);

        const allFixtures = [];
        for (const round of rounds) {
          const roundFixtures = await fetchFixturesByRound(round);
          if (roundFixtures) allFixtures.push(...roundFixtures);
        }

        const encerrados = allFixtures.filter(
          (f) => f.fixture.status.short === "FT"
        );
        setFixtures(encerrados);
      } catch (err) {
        console.error("Erro ao carregar admin:", err);
        toast.error("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
