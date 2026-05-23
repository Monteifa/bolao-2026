import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/firebase/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      console.error("Erro ao capturar redirect result:", err)
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "usuarios", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          const pontuacaoRef = doc(db, "pontuacao", firebaseUser.uid);
          await Promise.all([
            setDoc(userRef, {
              nome: firebaseUser.displayName,
              email: firebaseUser.email,
              foto: firebaseUser.photoURL,
              criadoEm: serverTimestamp(),
            }),
            setDoc(pontuacaoRef, {
              nome: firebaseUser.displayName,
              foto: firebaseUser.photoURL,
              total: 0,
              acertosExatos: 0,
              acertosVencedor1: 0,
              acertosVencedor: 0,
              erros: 0,
            }),
          ]);
        } else {
          await setDoc(
            userRef,
            {
              nome: firebaseUser.displayName,
              email: firebaseUser.email,
              foto: firebaseUser.photoURL,
            },
            { merge: true }
          );
        }
      }

      setUser(firebaseUser ?? null);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
