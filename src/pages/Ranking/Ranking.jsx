
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { fetchRounds, fetchFixturesByRound } from "@/api/api";
import { STATUS_FINISHED } from "@/utils/fixtureStatus";

const WC_2026_TOTAL_GAMES = 104;
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";

function MetricCard({ label, value, className = "" }) {
  return (
    <Card className={className}>
      <CardContent className="p-3 text-center">
        <p className="text-xl font-bold tabular-nums">{value}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}

export default function Ranking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ranking, setRanking] = useState([]);
  const [jogosApurados, setJogosApurados] = useState(0);
  const [jogosRestantes, setJogosRestantes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [usuariosSnap, pontuacaoSnap, rounds] = await Promise.all([
          getDocs(collection(db, "usuarios")),
          getDocs(collection(db, "pontuacao")),
          fetchRounds(),
        ]);

        if (cancelled) return;

        const pontuacaoMap = {};
        pontuacaoSnap.docs.forEach((d) => { pontuacaoMap[d.id] = d.data(); });

        const entries = usuariosSnap.docs.map((d) => {
          const uid = d.id;
          const usuario = d.data();
          const pts = pontuacaoMap[uid] || {
            total: 0,
            acertosExatos: 0,
            acertosVencedor1: 0,
            acertosVencedor: 0,
            erros: 0,
          };
          return { uid, ...usuario, ...pts };
        });

        entries.sort((a, b) =>
          b.total !== a.total ? b.total - a.total : b.acertosExatos - a.acertosExatos
        );

        setRanking(entries);

        const latestRound = rounds?.[rounds.length - 1];
        if (latestRound) {
          const fixtures = await fetchFixturesByRound(latestRound);
          if (!cancelled && fixtures) {
            const finished = fixtures.filter((f) => STATUS_FINISHED.includes(f.fixture.status.short)).length;
            setJogosApurados(finished);
            setJogosRestantes(WC_2026_TOTAL_GAMES - finished);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar ranking:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const userEntry = ranking.find((r) => r.uid === user?.uid);
  const userPos = ranking.findIndex((r) => r.uid === user?.uid) + 1;

  console.log(userEntry, "userEntry");

  const initials = (name) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  if (loading) {
    return (
      <Layout title="Ranking" subtitle="Atualizado agora">
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
          <Skeleton className="h-20 rounded-xl" />
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Ranking" subtitle="Atualizado agora">
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <MetricCard label="Participantes" value={ranking.length} />
          <MetricCard label="Apurados" value={jogosApurados} />
          <MetricCard label="Restantes" value={jogosRestantes} />
        </div>

        {userEntry && (
          <Card className="bg-primary border-primary text-primary-foreground">
            <CardContent className="px-4 py-2">
              <p className="text-primary-foreground/60 text-xs mb-1">Sua posição</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">
                    {userEntry.nome} — {userPos}º lugar
                  </p>
                  <p className="text-primary-foreground/60 text-xs mt-0.5">
                    {userEntry.acertosExatos} exatos · {userEntry.acertosVencedor1} parciais · {userEntry.acertosVencedor} vencedor · {userEntry.pontosExtras || 0} extras · {userEntry.erros || 0} erros
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold tabular-nums">{userEntry.total}</p>
                  <p className="text-primary-foreground/60 text-xs">pontos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {ranking.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            O ranking ainda não foi gerado. Visite "Meus palpites" para calcular sua pontuação.
          </div>
        ) : (
          <div className="space-y-2">
            {ranking.map((entry, idx) => {
              const isMe = entry.uid === user?.uid;
              const pos = idx + 1;
              return (
                <Card
                  key={entry.uid}
                  className="overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/palpites/${entry.uid}`)}
                >
                  <CardContent className="px-3 py-0 flex items-center gap-3">
                    <div className="w-7 flex items-center justify-center shrink-0">
                      {pos === 1 ? (
                        <Trophy className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">{pos}</span>
                      )}
                    </div>

                    <Avatar className="w-9 h-9 shrink-0">
                      <AvatarImage src={entry.foto} />
                      <AvatarFallback className="text-xs">{initials(entry.nome)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isMe ? "text-primary" : ""}`}>
                        {entry.nome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.acertosExatos} exatos · {entry.acertosVencedor1} parciais · {entry.acertosVencedor} vencedor. · {entry.erros} erros.
                        {entry.pontosExtras > 0 && ` · +${entry.pontosExtras} extras`}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold tabular-nums">{entry.total}</p>
                      <p className="text-[10px] text-muted-foreground">pts</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
