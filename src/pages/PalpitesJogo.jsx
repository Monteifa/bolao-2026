import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { fetchFixtureById } from "@/api/api";
import { calcularPontos } from "@/utils/pontuacao";
import { STATUS_FINISHED, STATUS_LIVE } from "@/utils/fixtureStatus";
import Layout from "@/components/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { CountryFlag } from "@/components/CountryFlag";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const STATUS_VISIVEIS = [...STATUS_FINISHED, ...STATUS_LIVE]

export default function PalpitesJogo() {
  const { fixtureId } = useParams();
  const navigate = useNavigate();
  const [fixture, setFixture] = useState(null);
  const [palpites, setPalpites] = useState([]);
  const [loading, setLoading] = useState(true);

  const initials = (name) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const f = await fetchFixtureById(fixtureId);

        console.log(f);

        if (!f || cancelled) return
        
        if (!STATUS_VISIVEIS.includes(f.fixture.status.short)) {
          navigate(-1);
          return
        }

        setFixture(f)

        const snap = await getDocs(
          query(collection(db, "palpites"), where("fixtureId", "==", String(fixtureId)))
        )
        if (cancelled) return

        const encerrado = STATUS_FINISHED.includes(f.fixture.status.short)
        const resultadoReal = {
          golsTime1: f.score?.fulltime?.home ?? f.goals.home,
          golsTime2: f.score?.fulltime?.away ?? f.goals.away,
        }

        const lista = snap.docs
          .map((d) => {
            const p = d.data()
            const { pontos, tipo } = encerrado
              ? calcularPontos(p, resultadoReal)
              : { pontos: null, tipo: null }
            return { ...p, pontos, tipo }
          })
          .sort((a, b) => {
            if (encerrado) return (b.pontos ?? 0) - (a.pontos ?? 0)
            return (a.nome ?? a.name ?? "").localeCompare(b.nome ?? b.name ?? "")
          })

        setPalpites(lista)
      } catch (err) {
        console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [fixtureId, navigate])

  if (loading) {
    return (
      <Layout>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      </Layout>
    )
  }

  if (!fixture) return null

  const encerrado = STATUS_FINISHED.includes(fixture.fixture.status.short)
  const aoVivo = STATUS_LIVE.includes(fixture.fixture.status.short)

  return (
    <Layout>
      <div className="border-b border-border sticky top-16 z-10 bg-ink/85 backdrop-blur">
        <div className="flex items-center gap-2 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            className="text-teal-500"
          >
            <ArrowLeft />
          </Button>
          
          <div>
            <p className="text-sm font-medium">{palpites.length} palpites</p>
            <p className="text-xs text-muted-foreground">{fixture.league.round}</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 px-4 py-4">
          <div className="flex flex-col items-center gap-2 flex-1">
            <CountryFlag country={fixture.teams.home.name} size={32} />
            <span className="text-sm font-medium text-center">{fixture.teams.home.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold tabular-nums">{fixture.goals.home}</span>
            <span className="text-muted-foreground">–</span>
            <span className="text-2xl font-bold tabular-nums">{fixture.goals.away}</span>
          </div>
          <div className="flex flex-col items-center gap-2 flex-1">
            <CountryFlag country={fixture.teams.away.name} size={32} />
            <span className="text-sm font-medium text-center">{fixture.teams.away.name}</span>
          </div>
        </div>

        {aoVivo && (
          <div className="flex justify-center pb-3">
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-red-100 text-red-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
              Ao vivo
            </span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        {palpites.map((p) => {
          const ptsBadge =
            p.tipo === "exato"     ? "bg-green-100 text-green-800"  :
            p.tipo === "vencedor1" ? "bg-amber-100 text-amber-800"  :
            p.tipo === "vencedor"  ? "bg-blue-100 text-blue-800"    :
            p.tipo === "erro"      ? "bg-red-100 text-red-800"      : ""

          const ptsLabel =
            p.tipo === "exato"     ? "+10" :
            p.tipo === "vencedor1" ? "+7"  :
            p.tipo === "vencedor"  ? "+5"  :
            p.tipo === "erro"      ? "+0"  : ""

          return (
            <Card
              key={p.userId}
              className="bg-card border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigate(`/palpites/${p.userId}`)}
            >
              <CardContent className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="w-9 h-9 shrink-0">
                    <AvatarImage src={p.foto} />
                    <AvatarFallback className="text-xs">{initials(p.nome)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium truncate">{p.nome ?? p.name}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {p.golsTime1} – {p.golsTime2}
                  </span>
                  {encerrado && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${ptsBadge}`}>
                      {ptsLabel}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {palpites.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            Ninguém palpitou esse jogo ainda.
          </div>
        )}
      </div>
    </Layout>
  )
}
