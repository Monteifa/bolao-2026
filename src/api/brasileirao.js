// TEMP: testing only — remove this file and its usages before final release
import axios from "axios";

const BASE_URL = "https://v3.football.api-sports.io";
const API_KEY = import.meta.env.VITE_API_FOOTBALL_KEY;

export const BRASILEIRAO_QUERY = {
  league: 71,
  season: 2026,
  date: "2026-05-23",
};

export async function fetchBrasileiraoFixtures() {
  const { data } = await axios.get(`${BASE_URL}/fixtures`, {
    params: BRASILEIRAO_QUERY,
    headers: { "x-apisports-key": API_KEY },
  });
  return data.response;
}
