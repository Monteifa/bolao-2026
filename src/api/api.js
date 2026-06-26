import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import axios from "axios";

const BASE_URL = "https://v3.football.api-sports.io";
const API_KEY = import.meta.env.VITE_API_FOOTBALL_KEY;
const LEAGUE = 1;
const SEASON = 2026;
const CACHE_TTL_MS = {
  rounds: 24 * 60 * 60 * 1000,
  fixtures: 3 * 60 * 1000,
};

const STATUS_LIVE = ["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT"];

const fetchFromAPI = async (endpoint, params = {}) => {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set("league", LEAGUE);
  url.searchParams.set("season", SEASON);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

const { data } = await axios.get(url.toString(), {
    headers: {
      "x-apisports-key": API_KEY,
    },
  });

  return data.response;
};

const getCached = async (cacheKey, apiFetcher, ttlMs = CACHE_TTL_MS.fixtures) => {
  const cacheRef = doc(db, "cache", cacheKey);
  const cacheSnap = await getDoc(cacheRef);

  const stale = cacheSnap.exists() ? cacheSnap.data() : null;

  if (stale && stale.data && stale.data.length > 0) {
    const age = Date.now() - stale.updatedAt.toMillis();
    if (age < ttlMs) return stale.data;
  }

  try {
    const data = await apiFetcher();
    await setDoc(cacheRef, { data, updatedAt: Timestamp.now() });
    return data;
  } catch (err) {
    if (stale) return stale.data;
    throw err;
  }
};

// ─── existentes ────────────────────────────────────────────────

export async function fetchFixturesByRound(round) {
  const cacheKey = `fixtures_${round.replace(/\s+/g, "_")}`;
  return getCached(cacheKey, () => fetchFromAPI("fixtures", { round }));
}

export async function fetchRounds() {
  return getCached("rounds", () => fetchFromAPI("fixtures/rounds"), CACHE_TTL_MS.rounds);
}

export async function fetchFixtureById(fixtureId) {
  const url = new URL(`${BASE_URL}/fixtures`);
  url.searchParams.set("id", fixtureId); // ← só o id, sem league/season

  const { data } = await axios.get(url.toString(), {
    headers: { "x-apisports-key": API_KEY },
  });

  return data.response?.[0] ?? null;
}

// ─── novas ─────────────────────────────────────────────────────

/**
 * Busca TODOS os fixtures da copa de uma vez.
 * Cache de 5 minutos no Firestore — evita estourar o limite de 100 req/dia.
 */
export async function fetchTodosFixtures() {
  return getCached("all_fixtures", () => fetchFromAPI("fixtures"));
}

/**
 * Extrai os rounds únicos do array de fixtures, mantendo a ordem original.
 */
export function derivarRodadas(fixtures) {
  const vistos = new Set();
  const rounds = [];
  fixtures.forEach((f) => {
    const round = f.league.round;
    if (!vistos.has(round)) {
      vistos.add(round);
      rounds.push(round);
    }
  });
  return rounds;
}

/**
 * Detecta a rodada atual com a seguinte prioridade:
 * 1. Tem jogo ao vivo agora?
 * 2. Tem jogo não iniciado hoje?
 * 3. Qual o próximo jogo futuro?
 * 4. Fallback: última rodada do array
 */
export function detectarRodadaAtual(fixtures) {
  // 1. jogo ao vivo
  const aoVivo = fixtures.find((f) =>
    STATUS_LIVE.includes(f.fixture.status.short)
  );
  if (aoVivo) return aoVivo.league.round;

  // 2. jogo não iniciado hoje
  const hoje = new Date().toISOString().split("T")[0];
  const jogoHoje = fixtures.find((f) => {
    const dataJogo = f.fixture.date.split("T")[0];
    return dataJogo === hoje && f.fixture.status.short === "NS";
  });
  if (jogoHoje) return jogoHoje.league.round;

  // 3. próximo jogo futuro
  const futuros = fixtures
    .filter((f) => f.fixture.status.short === "NS")
    .sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));
  if (futuros.length) return futuros[0].league.round;

  // 4. fallback: última rodada
  return fixtures[fixtures.length - 1]?.league.round ?? null;
}