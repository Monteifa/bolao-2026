import { useState, useEffect, useRef } from "react"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { toast } from "sonner"
import { Clock } from "lucide-react"
import { db } from "@/firebase/firebase"
import { useAuth } from "@/contexts/AuthContext"
import { fetchTodosFixtures } from "@/api/api"
import { extrairTimes } from "@/lib/times"
import { normalizar } from "@/utils/pontuacao"
import Layout from "@/components/Layout"
import { ExtraCard } from "@/components/ExtraCard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// Prazo hardcoded: 11 de junho de 2026 às 15h (horário de Brasília)
const PRAZO_EXTRAS = new Date("2026-06-11T15:00:00-03:00")

export default function Extras() {
  const { user } = useAuth()
  const [palpite, setPalpite] = useState({
    campeao: "", vice: "", terceiro: "", artilheiro: "", melhorJogador: "",
  })
  const [times, setTimes] = useState([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [alteracoesPendentes, setAlteracoesPendentes] = useState(false)
  const docExisteRef = useRef(false)
  const palpiteInicialRef = useRef(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const load = async () => {
      try {
        const [palpiteSnap, fixtures] = await Promise.all([
          getDoc(doc(db, "palpitesExtras", user.uid)),
          fetchTodosFixtures(),
        ])
        if (cancelled) return

        if (palpiteSnap.exists()) {
          docExisteRef.current = true
          const data = palpiteSnap.data()
          const palpiteData = {
            campeao: data.campeao || "",
            vice: data.vice || "",
            terceiro: data.terceiro || "",
            artilheiro: data.artilheiro || "",
            melhorJogador: data.melhorJogador || "",
          }
          setPalpite(palpiteData)
          palpiteInicialRef.current = palpiteData
        } else {
          palpiteInicialRef.current = {
            campeao: "",
            vice: "",
            terceiro: "",
            artilheiro: "",
            melhorJogador: "",
          }
        }

        if (fixtures) setTimes(extrairTimes(fixtures))
      } catch (err) {
        console.error("Erro ao carregar extras:", err)
        toast.error("Erro ao carregar palpites extras")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  const bloqueado = PRAZO_EXTRAS < new Date()

  async function salvarTodos() {
    if (bloqueado || salvando) return
    setSalvando(true)
    try {
      const docRef = doc(db, "palpitesExtras", user.uid)
      const payload = {
        userId: user.uid,
        campeao: palpite.campeao,
        vice: palpite.vice,
        terceiro: palpite.terceiro,
        artilheiro: normalizar(palpite.artilheiro),
        melhorJogador: normalizar(palpite.melhorJogador),
        atualizadoEm: serverTimestamp(),
        apurado: false,
      }
      if (!docExisteRef.current) {
        payload.criadoEm = serverTimestamp()
        docExisteRef.current = true
      }
      await setDoc(docRef, payload, { merge: true })
      palpiteInicialRef.current = { ...palpite }
      setAlteracoesPendentes(false)
      toast.success("Palpites salvos com sucesso!")
    } catch (err) {
      console.error("Erro ao salvar palpites:", err)
      toast.error("Erro ao salvar palpites")
    } finally {
      setSalvando(false)
    }
  }

  function handleChange(campo, valor) {
    setPalpite(prev => ({ ...prev, [campo]: valor }))
    setAlteracoesPendentes(true)
  }

  const formatarPrazo = (date) =>
    date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    })

  if (loading) {
    return (
      <Layout>
        <div className="p-4 text-center text-muted-foreground text-sm pt-12">Carregando...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-4">
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm">
          <Clock className="w-4 h-4 text-amber-700 shrink-0" />
          <div>
            <p className="font-medium text-amber-700">Prazo: {formatarPrazo(PRAZO_EXTRAS)}</p>
            <p className="text-amber-600 text-xs">Bloqueado após início da competição</p>
          </div>
        </div>

        {bloqueado && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700 text-center">
            Palpites extras encerrados
          </div>
        )}

        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Times</p>

        <ExtraCard icon="trophy" titulo="Campeão" pontos={25}>
          <Select
            value={palpite.campeao}
            onValueChange={(v) => handleChange("campeao", v)}
            disabled={!!bloqueado}
          >
            <SelectTrigger><SelectValue placeholder="Selecione um time..." /></SelectTrigger>
            <SelectContent>
              {times.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </ExtraCard>

        <ExtraCard icon="medal" titulo="Vice-campeão" pontos={15}>
          <Select
            value={palpite.vice}
            onValueChange={(v) => handleChange("vice", v)}
            disabled={!!bloqueado}
          >
            <SelectTrigger><SelectValue placeholder="Selecione um time..." /></SelectTrigger>
            <SelectContent>
              {times.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </ExtraCard>

        <ExtraCard icon="award" titulo="Terceiro lugar" pontos={10}>
          <Select
            value={palpite.terceiro}
            onValueChange={(v) => handleChange("terceiro", v)}
            disabled={!!bloqueado}
          >
            <SelectTrigger><SelectValue placeholder="Selecione um time..." /></SelectTrigger>
            <SelectContent>
              {times.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </ExtraCard>

        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 mt-4">Jogadores</p>

        <ExtraCard icon="target" titulo="Artilheiro" pontos={15}>
          <Input
            placeholder="Nome do artilheiro..."
            value={palpite.artilheiro}
            onChange={(e) => handleChange("artilheiro", e.target.value)}
            disabled={!!bloqueado}
          />
        </ExtraCard>

        <ExtraCard icon="star" titulo="Melhor jogador" pontos={15}>
          <Input
            placeholder="Nome do melhor jogador..."
            value={palpite.melhorJogador}
            onChange={(e) => handleChange("melhorJogador", e.target.value)}
            disabled={!!bloqueado}
          />
        </ExtraCard>

        <Button 
          onClick={salvarTodos}
          disabled={!alteracoesPendentes || bloqueado || salvando}
          className="w-full mt-4"
          size="lg"
        >
          {salvando ? "Salvando..." : "Salvar Palpites"}
        </Button>

        {alteracoesPendentes && !bloqueado && (
          <p className="text-xs text-amber-600 text-center mt-2">
            Você tem alterações não salvas
          </p>
        )}
      </div>
    </Layout>
  )
}
