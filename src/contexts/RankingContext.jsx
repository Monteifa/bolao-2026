import { createContext, useContext, useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";

const RankingContext = createContext(null);

export function RankingProvider({ children }) {
  const { user } = useAuth();
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "pontuacao"), (snap) => {
      const entries = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      entries.sort((a, b) =>
        b.total !== a.total ? b.total - a.total : b.acertosExatos - a.acertosExatos
      );
      setRanking(entries);
    });
    return unsub;
  }, []);

  const userPos = ranking.findIndex((r) => r.uid === user?.uid) + 1;
  const userEntry = ranking.find((r) => r.uid === user?.uid);

  return (
    <RankingContext.Provider value={{ ranking, userPos, userEntry, total: ranking.length }}>
      {children}
    </RankingContext.Provider>
  );
}

export function useRanking() {
  return useContext(RankingContext);
}
