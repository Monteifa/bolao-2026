import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTodosFixtures } from "@/api/api";
import { calcularPontos } from "@/utils/pontuacao";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_FINISHED = ["FT", "AET", "PEN"];

function StatCard({ label, value, className = "" }) {
  return (
    <Card className={className}>
      <CardContent className="p-3 text-center">
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}

export default function MeusPalpites() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, exatos: 0, resultado: 0, erros: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [palpitesSnap, fixturesData] = await Promise.all([
          getDocs(query(collection(db, "palpites"), where("userId", "==", user.uid))),
          fetchTodosFixtures(),
        ]);

        if (cancelled) return;

        const palpitesMap = {};
        palpitesSnap.forEach((d) => {
          const data = d.data();
          palpitesMap[data.fixtureId] = data;
        });

        const finished = (fixturesData ?? []).filter((f) =>
          STATUS_FINISHED.includes(f.fixture.status.short)
        );

        const enriched = finished
          .filter((f) => palpitesMap[f.fixture.id])
          .map((f) => {
            const palpite = palpitesMap[f.fixture.id];
            const { pontos, tipo } = calcularPontos(palpite, {
              golsTime1: f.goals.home ?? 0,
              golsTime2: f.goals.away ?? 0,
            });
            return { fixture: f, palpite, pontos, tipo };
          })
          .sort((a, b) => new Date(b.fixture.fixture.date) - new Date(a.fixture.fixture.date));

        setItems(enriched);

        const s = enriched.reduce(
          (acc, { pontos, tipo }) => ({
            total: acc.total + pontos,
            exatos: acc.exatos + (tipo === "exato" ? 1 : 0),
            resultado: acc.resultado + (tipo === "vencedor" || tipo === "vencedor1" ? 1 : 0),
            erros: acc.erros + (tipo === "erro" ? 1 : 0),
          }),
          { total: 0, exatos: 0, resultado: 0, erros: 0 }
        );
        setStats(s);

        await setDoc(
          doc(db, "pontuacao", user.uid),
          {
            nome: user.displayName,
            foto: user.photoURL,
            total: s.total,
            acertosExatos: s.exatos,
            acertosVencedor: s.resultado,
            erros: s.erros,
            atualizadoEm: serverTimestamp(),
          },
          { merge: true }
        );
      } catch {
        if (!cancelled) toast.error("Erro ao carregar seus palpites.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) {
    return (
      <Layout>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <StatCard label="Pontos" value={stats.total} />
          <StatCard
            label="Exatos"
            value={stats.exatos}
            className="border-emerald-300 bg-emerald-50 text-emerald-700"
          />
          <StatCard
            label="Resultado"
            value={stats.resultado}
            className="border-amber-300 bg-amber-50 text-amber-700"
          />
          <StatCard
            label="Erros"
            value={stats.erros}
            className="border-red-300 bg-red-50 text-red-700"
          />
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Nenhum palpite em jogo encerrado ainda.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(({ fixture: f, palpite, pontos, tipo }) => (
              <Card key={f.fixture.id} className="overflow-hidden">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {f.teams.home.name} × {f.teams.away.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Real: {f.goals.home ?? 0}–{f.goals.away ?? 0} · Palpite: {palpite.golsTime1}–{palpite.golsTime2} ·{" "}
                      {f.league.round}
                    </p>
                  </div>

                  <Badge
                    className={`shrink-0 ${
                      tipo === "exato"
                        ? "bg-emerald-500 text-white"
                        : tipo === "vencedor" || tipo === "vencedor1"
                        ? "bg-amber-500 text-white"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {pontos > 0 ? `+${pontos}` : "+0"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
