import { useEffect, useState } from "react";
import { collection, query, where, getDocs, serverTimestamp, setDoc, doc } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchTodosFixtures,
  derivarRodadas,
  detectarRodadaAtual
} from "@/api/api";
import { STATUS_LIVE, STATUS_FINISHED } from "@/utils/fixtureStatus";
import Layout from "@/components/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveCard, PalpiteInput, FinishedCard, Section } from "@/components/fixtures";

export default function FixturesLists() {
  const { user } = useAuth();
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [fixturesData, setFixturesData] = useState({ round: null, list: [], palpites: {} });
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [allFixtures, setAllFixtures] = useState([]);

  const loadingFixtures = !!selectedRound && !!allFixtures.length && selectedRound !== fixturesData.round;

  // carrega tudo uma vez só
  useEffect(() => {
    const init = async () => {
      try {
        const todos = await fetchTodosFixtures();
        const rounds = derivarRodadas(todos);
        const rodadaAtual = detectarRodadaAtual(todos);

        setAllFixtures(todos);
        setRounds(rounds);
        setSelectedRound(rodadaAtual);
      } catch {
        toast.error("Erro ao carregar rodadas.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // troca de rodada filtra localmente — sem nova chamada à API
  useEffect(() => {
    if (!selectedRound || !allFixtures.length) return;

    let cancelled = false;
    const filtered = allFixtures.filter((f) => f.league.round === selectedRound);
    const ids = filtered.map((f) => String(f.fixture.id));

    getDocs(query(collection(db, "palpites"), where("userId", "==", user.uid)))
      .then((snap) => {
        if (cancelled) return;
        const map = {};
        snap.forEach((d) => {
        const data = d.data();
        const id = String(data.fixtureId);
        if (ids.includes(id)) map[id] = data; // ← chave sempre string
      });
        setFixturesData({ round: selectedRound, list: filtered, palpites: map });
      })
      .catch(() => { if (!cancelled) toast.error("Erro ao carregar palpites."); });

    return () => { cancelled = true; };
  }, [selectedRound, allFixtures, user.uid]);

  const handleSave = async (fixtureId, g1, g2) => {
    if (g1 === "" || g2 === "") return;

    const fixture = allFixtures.find((f) => f.fixture.id === fixtureId);

    if (!fixture) return;

    const status = fixture.fixture.status.short;
    if (STATUS_LIVE.includes(status) || STATUS_FINISHED.includes(status)) return;

    setSavingId(fixtureId);
    try {
      const id = String(fixtureId)
      const docRef = doc(db, "palpites", `${user.uid}_${fixtureId}`);
      const data = {
        userId: user.uid,
        fixtureId: id, 
        golsTime1: Number(g1),
        golsTime2: Number(g2),
        criadoEm: serverTimestamp(),
      };
      await setDoc(docRef, data);
      setFixturesData((prev) => ({ ...prev, palpites: { ...prev.palpites, [id]: data } }));
      toast.success("Palpite salvo!");
    } catch {
      toast.error("Erro ao salvar palpite.");
    } finally {
      setSavingId(null);
    }
  };

  const { list: fixtures, palpites: palpitesMap } = fixturesData;
  const live = fixtures.filter((f) => STATUS_LIVE.includes(f.fixture.status.short));
  const today = fixtures.filter((f) => f.fixture.status.short === "NS");
  const finished = fixtures
    .filter((f) => STATUS_FINISHED.includes(f.fixture.status.short))
    .sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date));

  if (loading) {
    return (
      <Layout>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4">
        <Section
          title="Rodada"
          rounds={rounds}
          selectedRound={selectedRound}
          onRoundChange={setSelectedRound}
        />

        {loadingFixtures ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <Section title="Ao vivo agora" count={live.length}>
              {live.map((f) => (
                <LiveCard key={f.fixture.id} fixture={f} palpite={palpitesMap[f.fixture.id]} />
              ))}
            </Section>

            <Section title="Hoje" count={today.length}>
              {today.map((f) => (
                <PalpiteInput
                  key={f.fixture.id}
                  fixture={f}
                  palpite={palpitesMap[f.fixture.id]}
                  onSave={handleSave}
                  saving={savingId === f.fixture.id}
                />
              ))}
            </Section>

            <Section title="Encerrados" count={finished.length}>
              {finished.map((f) => (
                <FinishedCard key={f.fixture.id} fixture={f} palpite={palpitesMap[f.fixture.id]} />
              ))}
            </Section>

            {!live.length && !today.length && !finished.length && (
              <div className="text-center py-16 text-muted-foreground text-sm">
                Nenhum jogo encontrado.
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
