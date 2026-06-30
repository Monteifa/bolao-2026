import {
  collection, doc, getDoc, getDocs,
  setDoc, updateDoc, query, where,
  serverTimestamp, increment
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { calcularPontos, normalizar } from "@/utils/pontuacao";

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
  const FINISHED = ["FT", "AET", "PEN"];
  const jogosFT = fixtures.filter((f) => FINISHED.includes(f.fixture.status.short));
  const pendentes = jogosFT.filter(
    (f) => !jogosApurados.includes(String(f.fixture.id))
  );

  const resultados = [];
  for (const jogo of pendentes) {
    const resultado = await apurarJogo(jogo.fixture.id, {
      golsTime1: jogo.score?.fulltime?.home ?? jogo.goals.home,
      golsTime2: jogo.score?.fulltime?.away ?? jogo.goals.away,
    });
    resultados.push({ fixtureId: jogo.fixture.id, ...resultado });
  }

  return resultados;
}

export async function apurarExtras() {
  const resultadoSnap = await getDoc(doc(db, "resultadosExtras", "oficial"))
  if (!resultadoSnap.exists()) {
    return { sucesso: false, motivo: "Resultado oficial não cadastrado" }
  }

  const r = resultadoSnap.data()
  if (r.apuradoEm) {
    return { sucesso: false, motivo: "Extras já foram apurados" }
  }

  const snap = await getDocs(collection(db, "palpitesExtras"))

  const atualizacoes = snap.docs.map(async (docSnap) => {
    const p = docSnap.data()
    let pontos = 0
    const pontosExtras = { campeao: 0, vice: 0, terceiro: 0, artilheiro: 0, melhorJogador: 0 }

    if (normalizar(p.campeao) === normalizar(r.campeao)) { pontos += 25; pontosExtras.campeao = 25 }
    if (normalizar(p.vice) === normalizar(r.vice)) { pontos += 15; pontosExtras.vice = 15 }
    if (normalizar(p.terceiro) === normalizar(r.terceiro)) { pontos += 10; pontosExtras.terceiro = 10 }
    if (normalizar(p.artilheiro) === normalizar(r.artilheiro)) { pontos += 15; pontosExtras.artilheiro = 15 }
    if (normalizar(p.melhorJogador) === normalizar(r.melhorJogador)) { pontos += 15; pontosExtras.melhorJogador = 15 }

    await setDoc(doc(db, "pontuacao", p.userId), {
      total: increment(pontos),
      pontosExtras: increment(pontos),
    }, { merge: true })

    await updateDoc(docSnap.ref, { apurado: true })
  })

  await Promise.all(atualizacoes)

  await updateDoc(doc(db, "resultadosExtras", "oficial"), {
    apuradoEm: serverTimestamp(),
  })

  return { sucesso: true, total: snap.docs.length }
}
