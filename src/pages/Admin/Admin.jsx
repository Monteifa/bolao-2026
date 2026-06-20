import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { fetchRounds, fetchFixturesByRound } from "@/api/api";
import { apurarJogo, apurarTodosPendentes, apurarExtras } from "@/lib/apuracao";
import { migrarFotosPalpitesAntigos } from "@/lib/migracao";
import { extrairTimes } from "@/lib/times";
import { normalizar } from "@/utils/pontuacao";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function Admin() {
  const { user } = useAuth();
  const [fixtures, setFixtures] = useState([]);
  const [jogosApurados, setJogosApurados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apurando, setApurando] = useState(false);
  const [apurandoId, setApurandoId] = useState(null);

  const [timesExtras, setTimesExtras] = useState([]);
  const [resultado, setResultado] = useState({ campeao: "", vice: "", terceiro: "", artilheiro: "", melhorJogador: "" });
  const [resultadoSalvo, setResultadoSalvo] = useState(false);
  const [jaApurado, setJaApurado] = useState(false);
  const [apuradoEm, setApuradoEm] = useState(null);
  const [apurandoExtras, setApurandoExtras] = useState(false);
  const [salvandoResultado, setSalvandoResultado] = useState(false);
  const [migrando, setMigrando] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setFixtures([]);
      try {
        const [rounds, apuradosSnap, resultadoSnap] = await Promise.all([
          fetchRounds(),
          getDocs(collection(db, "jogosApurados")),
          getDoc(doc(db, "resultadosExtras", "oficial")),
        ]);
        const allFixtures = [];
        for (const round of rounds) {
          const rf = await fetchFixturesByRound(round);
          if (rf) allFixtures.push(...rf);
        }

        setJogosApurados(apuradosSnap.docs.map((d) => d.id));
        setFixtures(allFixtures.filter((f) => f.fixture.status.short === "FT"));
        setTimesExtras(extrairTimes(allFixtures));

        if (resultadoSnap.exists()) {
          const data = resultadoSnap.data();
          setResultado({
            campeao: data.campeao || "",
            vice: data.vice || "",
            terceiro: data.terceiro || "",
            artilheiro: data.artilheiro || "",
            melhorJogador: data.melhorJogador || "",
          });
          setResultadoSalvo(true);
          if (data.apuradoEm) {
            setJaApurado(true);
            setApuradoEm(data.apuradoEm);
          }
        }
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
      const res = await apurarJogo(fixture.fixture.id, {
        golsTime1: fixture.goals.home,
        golsTime2: fixture.goals.away,
      });
      if (res.sucesso) {
        setJogosApurados((prev) => [...prev, String(fixture.fixture.id)]);
        toast.success(`Jogo apurado — ${res.totalPalpites} palpite(s)`);
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

  const salvarResultadoOficial = async () => {
    setSalvandoResultado(true);
    try {
      await setDoc(doc(db, "resultadosExtras", "oficial"), {
        campeao: resultado.campeao,
        vice: resultado.vice,
        terceiro: resultado.terceiro,
        artilheiro: normalizar(resultado.artilheiro),
        melhorJogador: normalizar(resultado.melhorJogador),
      }, { merge: true });
      setResultadoSalvo(true);
      toast.success("Resultado salvo!");
    } catch (err) {
      console.error("Erro ao salvar resultado:", err);
      toast.error("Erro ao salvar resultado");
    } finally {
      setSalvandoResultado(false);
    }
  };

  const handleApurarExtras = async () => {
    setApurandoExtras(true);
    try {
      const res = await apurarExtras();
      if (res.sucesso) {
        setJaApurado(true);
        toast.success(`Extras apurados — ${res.total} palpite(s) processado(s)`);
        const snap = await getDoc(doc(db, "resultadosExtras", "oficial"));
        if (snap.exists()) setApuradoEm(snap.data().apuradoEm);
      } else {
        toast.error(res.motivo);
      }
    } catch (err) {
      console.error("Erro ao apurar extras:", err);
      toast.error("Erro ao apurar extras");
    } finally {
      setApurandoExtras(false);
    }
  };

  const handleMigrarFotos = async () => {
    if (migrando) return;
    setMigrando(true);
    try {
      const resultado = await migrarFotosPalpitesAntigos();
      toast.success(resultado.mensagem);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao migrar fotos dos palpites");
    } finally {
      setMigrando(false);
    }
  };

  if (user?.email !== import.meta.env.VITE_ADMIN_EMAIL) {
    return <Navigate to="/palpites" replace />;
  }

  const pendentes = fixtures.filter(
    (f) => !jogosApurados.includes(String(f.fixture.id))
  );

  const formatarData = (ts) =>
    ts?.toDate?.().toLocaleDateString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }) ?? "";

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
        {/* ── Jogos ── */}
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
          {[...fixtures].reverse().map((fixture) => {
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

        {/* ── Extras ── */}
        <div className="border-t border-border pt-4 space-y-3">
          <p className="text-sm font-semibold">Apuração de extras</p>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Campeão</label>
            <Select value={resultado.campeao} onValueChange={(v) => setResultado(p => ({ ...p, campeao: v }))} disabled={jaApurado}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {timesExtras.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Vice-campeão</label>
            <Select value={resultado.vice} onValueChange={(v) => setResultado(p => ({ ...p, vice: v }))} disabled={jaApurado}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {timesExtras.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Terceiro lugar</label>
            <Select value={resultado.terceiro} onValueChange={(v) => setResultado(p => ({ ...p, terceiro: v }))} disabled={jaApurado}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {timesExtras.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Artilheiro</label>
            <Input
              placeholder="Nome completo..."
              value={resultado.artilheiro}
              onChange={(e) => setResultado(p => ({ ...p, artilheiro: e.target.value }))}
              disabled={jaApurado}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Melhor jogador</label>
            <Input
              placeholder="Nome completo..."
              value={resultado.melhorJogador}
              onChange={(e) => setResultado(p => ({ ...p, melhorJogador: e.target.value }))}
              disabled={jaApurado}
            />
          </div>

          {!jaApurado && (
            <Button onClick={salvarResultadoOficial} disabled={salvandoResultado} size="sm">
              {salvandoResultado ? "Salvando..." : "Salvar resultado"}
            </Button>
          )}

          {resultadoSalvo && !jaApurado && (
            <Button
              onClick={handleApurarExtras}
              disabled={apurandoExtras}
              size="sm"
              variant="outline"
            >
              {apurandoExtras ? "Apurando..." : "Apurar extras"}
            </Button>
          )}

          {jaApurado && (
            <p className="text-sm text-emerald-500">
              Extras apurados em {formatarData(apuradoEm)}
            </p>
          )}
        </div>

        {/* ── Manutenção ── */}
        <div className="border-t border-border pt-4 space-y-3">
          <p className="text-sm font-semibold">Manutenção</p>
          <p className="text-xs text-muted-foreground">
            Atualiza palpites antigos que ainda não têm a foto do usuário salva.
            Pode ser executado quantas vezes for necessário — só atualiza o que ainda estiver faltando.
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={migrando}
            onClick={handleMigrarFotos}
          >
            {migrando ? "Migrando..." : "Atualizar fotos de palpites antigos"}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
