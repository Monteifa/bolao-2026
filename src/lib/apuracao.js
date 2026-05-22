import {
  collection, doc, getDoc, getDocs,
  setDoc, updateDoc, query, where,
  serverTimestamp, increment
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { calcularPontos } from "@/utils/pontuacao";

export async function apurarJogo(fixtureId, resultadoReal) {
  const jaApurado = await getDoc(doc(db, "jogosApurados", String(fixtureId)));
  if (jaApurado.exists()) {
    console.warn("Jogo já foi apurado:", fixtureId);
    return { sucesso: false, motivo: "já apurado" };
  }

  const snap = await getDocs(
    query(collection(db, "palpites"), where("fixtureId", "==", String(fixtureId)))
  );

  const atualizacoes = snap.docs.map(async (docSnap) => {
    const palpite = docSnap.data();
    const { pontos, tipo } = calcularPontos(palpite, resultadoReal);

    await setDoc(doc(db, "pontuacao", palpite.userId), {
      total: increment(pontos),
      acertosExatos:    increment(tipo === "exato"     ? 1 : 0),
      acertosVencedor1: increment(tipo === "vencedor1" ? 1 : 0),
      acertosVencedor:  increment(tipo === "vencedor"  ? 1 : 0),
      erros:            increment(tipo === "erro"      ? 1 : 0),
    }, { merge: true });

    await updateDoc(docSnap.ref, { apurado: true });
  });

  await Promise.all(atualizacoes);

  await setDoc(doc(db, "jogosApurados", String(fixtureId)), {
    fixtureId: String(fixtureId),
    golsTime1: resultadoReal.golsTime1,
    golsTime2: resultadoReal.golsTime2,
    apuradoEm: serverTimestamp(),
  });

  return { sucesso: true, totalPalpites: snap.docs.length };
}

export async function apurarTodosPendentes(fixtures, jogosApurados) {
  const jogosFT = fixtures.filter((f) => f.fixture.status.short === "FT");
  const pendentes = jogosFT.filter(
    (f) => !jogosApurados.includes(String(f.fixture.id))
  );

  const resultados = [];
  for (const jogo of pendentes) {
    const resultado = await apurarJogo(jogo.fixture.id, {
      golsTime1: jogo.goals.home,
      golsTime2: jogo.goals.away,
    });
    resultados.push({ fixtureId: jogo.fixture.id, ...resultado });
  }

  return resultados;
}
