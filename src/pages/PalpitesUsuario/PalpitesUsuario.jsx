import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/firebase/firebase"
import Layout from "@/components/Layout"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Volleyball, Star } from "lucide-react"
import { PalpitesJogosTab } from "@/components/PalpitesJogosTab"
import { PalpitesExtrasTab } from "@/components/PalpitesExtrasTab"

export default function PalpitesUsuario() {
  const { uid } = useParams()
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState(null)
  const [loadingUsuario, setLoadingUsuario] = useState(true)
  const [tabsVisitadas, setTabsVisitadas] = useState({ jogos: true, extras: false })
  const [tabAtiva, setTabAtiva] = useState("jogos")
  const [totalJogos, setTotalJogos] = useState(null)

  const handleTabChange = (value) => {
    setTabAtiva(value)
    setTabsVisitadas((prev) => ({ ...prev, [value]: true }))
  }

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "usuarios", uid))
      if (!snap.exists()) {
        navigate("/ranking")
        return
      }
      setUsuario(snap.data())
      setLoadingUsuario(false)
    }
    load()
  }, [uid, navigate])

  if (loadingUsuario) return null

  return (
    <Layout>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="text-teal-500"
        >
          <ArrowLeft />
        </Button>
        {usuario?.foto && (
          <img
            src={usuario.foto}
            alt={usuario.nome}
            width={32}
            height={32}
            className="rounded-full"
          />
        )}
        <div>
          <p className="text-sm font-medium">{usuario?.nome}</p>
          {tabAtiva === "jogos" && totalJogos !== null && (
            <p className="text-xs text-muted-foreground">{totalJogos} palpites visíveis</p>
          )}
        </div>
      </div>

      <Tabs
        defaultValue="jogos"
        className="w-full"
        onValueChange={handleTabChange}
      >
        <TabsList
          className="grid grid-cols-2 gap-1 p-0! mx-4 mt-3"
          style={{ width: "calc(100% - 2rem)" }}          
        >
          <TabsTrigger
            value="jogos"
            className="h-full rounded-lg gap-1.5 data-[state=active]:bg-teal-500! data-[state=active]:text-[#04342C]!"
          >
            <Volleyball size={15} aria-hidden="true" />
            Jogos
          </TabsTrigger>
          <TabsTrigger
            value="extras"
            className="h-full rounded-lg gap-1.5 data-[state=active]:bg-teal-500! data-[state=active]:text-[#04342C]!"
          >
            <Star size={15} aria-hidden="true" />
            Extras
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jogos" className="p-4">
          {tabsVisitadas.jogos && <PalpitesJogosTab uid={uid} onLoad={setTotalJogos} />}
        </TabsContent>

        <TabsContent value="extras" className="p-4">
          {tabsVisitadas.extras && <PalpitesExtrasTab uid={uid} />}
        </TabsContent>
      </Tabs>
    </Layout>
  )
}
