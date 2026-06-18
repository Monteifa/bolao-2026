import { useEffect, useState } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/firebase/firebase"
import { fetchTodosFixtures } from "@/api/api"
import { calcularPontos } from "@/utils/pontuacao"
import { STATUS_FINISHED, STATUS_LIVE } from "@/utils/fixtureStatus"
import { Skeleton } from "@/components/ui/skeleton"
import { CountryFlag } from "@/components/CountryFlag"

const STATUS_VISIVEIS = [...STATUS_FINISHED, ...STATUS_LIVE]

export function PalpitesJogosTab({ uid, onLoad }) {
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const [snap, fixtures] = await Promise.all([
          getDocs(query(collection(db, "palpites"), where("userId", "==", uid))),
          fetchTodosFixtures(),
        ])
        if (cancelled) return

        const palpites = {}
        snap.forEach((d) => {
          const data = d.data()
          palpites[String(data.fixtureId)] = data
        })

        const cruzado = (fixtures ?? [])
          .filter(
            (f) =>
              STATUS_VISIVEIS.includes(f.fixture.status.short) &&
              palpites[String(f.fixture.id)]
          )
          .map((f) => ({
            fixture: f,
            palpite: palpites[String(f.fixture.id)],
          }))
          .sort(
            (a, b) =>
              new Date(b.fixture.fixture.date) - new Date(a.fixture.fixture.date)
          )

        setLista(cruzado)
        onLoad?.(cruzado.length)
      } catch (err) {
        console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [uid])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (lista.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        Nenhum palpite disponível ainda.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {lista.map(({ fixture: f, palpite }) => {
        const encerrado = STATUS_FINISHED.includes(f.fixture.status.short)
        const r1 = f.goals.home
        const r2 = f.goals.away
        const { pontos, tipo } = encerrado
          ? calcularPontos(palpite, { golsTime1: r1, golsTime2: r2 })
          : { pontos: null, tipo: null }

        const ptsBadge =
          tipo === "exato"     ? "bg-green-100 text-green-800"  :
          tipo === "vencedor1" ? "bg-amber-100 text-amber-800"  :
          tipo === "vencedor"  ? "bg-blue-100 text-blue-800"    :
          tipo === "erro"      ? "bg-red-100 text-red-800"      : ""

        const ptsLabel =
          tipo === "exato"     ? "+10 Exato"    :
          tipo === "vencedor1" ? "+7 Parcial"   :
          tipo === "vencedor"  ? "+5 Resultado" :
          tipo === "erro"      ? "+0"           : ""

        return (
          <div key={f.fixture.id} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <span className="text-xs text-muted-foreground">
                {f.league.round} · {new Date(f.fixture.date).toLocaleDateString("pt-BR")}
              </span>
              {encerrado && pontos !== null && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${ptsBadge}`}>
                  {ptsLabel}
                </span>
              )}
              {!encerrado && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-red-100 text-red-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                  Ao vivo
                </span>
              )}
            </div>

            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex flex-col items-center gap-1 flex-1">
                <CountryFlag country={f.teams.home.name} size={32} />
                <span className="text-sm font-medium text-center">{f.teams.home.name}</span>
              </div>
              <div className="flex flex-col items-center gap-1 px-4">
                {encerrado && (
                  <div className="flex items-center gap-2 text-lg font-medium">
                    <span>{r1}</span>
                    <span className="text-muted-foreground text-sm">–</span>
                    <span>{r2}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{palpite.golsTime1}</span>
                  <span>×</span>
                  <span>{palpite.golsTime2}</span>
                </div>
                {encerrado && (
                  <span className="text-xs text-muted-foreground">palpite</span>
                )}
              </div>
              <div className="flex flex-col items-center gap-1 flex-1">
                <CountryFlag country={f.teams.away.name} size={32} />
                <span className="text-sm font-medium text-center">{f.teams.away.name}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
