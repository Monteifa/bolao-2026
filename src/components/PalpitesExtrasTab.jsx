import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/firebase/firebase"
import { normalizar } from "@/utils/pontuacao"
import { Skeleton } from "@/components/ui/skeleton"

function ExtraResultCard({ icon, titulo, pontos, palpite, resultado }) {
  const temResultado = !!resultado
  const acertou = temResultado && normalizar(palpite) === normalizar(resultado)

  const badgeClass = !temResultado
    ? "bg-muted text-muted-foreground"
    : acertou
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800"

  const badgeLabel = !temResultado ? "Aguardando" : acertou ? `+${pontos}` : "+0"

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-2 py-2 border-b border-border">
        <span className="text-sm font-medium flex items-center gap-2">
          <i className={`ti ${icon} text-sm`} aria-hidden="true" />
          {titulo}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${badgeClass}`}>
          {badgeLabel}
        </span>
      </div>
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Palpite</p>
          <p className="text-sm font-medium capitalize">{palpite || "—"}</p>
        </div>
        {temResultado && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-0.5">Resultado oficial</p>
            <p className="text-sm font-medium capitalize">{resultado}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function PalpitesExtrasTab({ uid }) {
  const [extras, setExtras] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const [extrasSnap, resultadoSnap] = await Promise.all([
          getDoc(doc(db, "palpitesExtras", uid)),
          getDoc(doc(db, "resultadosExtras", "oficial")),
        ])
        if (cancelled) return

        setExtras(extrasSnap.exists() ? extrasSnap.data() : null)
        setResultado(resultadoSnap.exists() ? resultadoSnap.data() : null)
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
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (!extras) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        Esse usuário ainda não fez palpites extras.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <ExtraResultCard icon="ti-trophy"  titulo="Campeão"         pontos={25} palpite={extras.campeao}       resultado={resultado?.campeao} />
      <ExtraResultCard icon="ti-medal"   titulo="Vice-campeão"    pontos={15} palpite={extras.vice}          resultado={resultado?.vice} />
      <ExtraResultCard icon="ti-award"   titulo="Terceiro lugar"  pontos={10} palpite={extras.terceiro}      resultado={resultado?.terceiro} />
      <ExtraResultCard icon="ti-shoe"    titulo="Artilheiro"      pontos={15} palpite={extras.artilheiro}    resultado={resultado?.artilheiro} />
      <ExtraResultCard icon="ti-star"    titulo="Melhor jogador"  pontos={15} palpite={extras.melhorJogador} resultado={resultado?.melhorJogador} />
    </div>
  )
}
