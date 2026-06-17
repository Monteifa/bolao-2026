import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/firebase/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const init = async () => {
    try {
      const result = await getRedirectResult(auth)
      if (result?.user) {
        // usuário voltou do redirect no iOS — salva no Firestore
        const userRef = doc(db, "usuarios", result.user.uid)
        const userSnap = await getDoc(userRef)

        if (!userSnap.exists()) {
          const pontuacaoRef = doc(db, "pontuacao", result.user.uid)
          await Promise.all([
            setDoc(userRef, {
              nome: result.user.displayName,
              email: result.user.email,
              foto: result.user.photoURL,
              criadoEm: serverTimestamp(),
            }),
            setDoc(pontuacaoRef, {
              nome: result.user.displayName,
              foto: result.user.photoURL,
              total: 0,
              acertosExatos: 0,
              acertosVencedor1: 0,
              acertosVencedor: 0,
              erros: 0,
            }),
          ])
        }
      }
    } catch (err) {
      console.error("Erro no redirect result:", err)
    }

    // listener normal — roda depois do getRedirectResult
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "usuarios", firebaseUser.uid)
        const userSnap = await getDoc(userRef)

        if (!userSnap.exists()) {
          const pontuacaoRef = doc(db, "pontuacao", firebaseUser.uid)
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
          ])
        } else {
          await setDoc(userRef, {
            nome: firebaseUser.displayName,
            email: firebaseUser.email,
            foto: firebaseUser.photoURL,
          }, { merge: true })
        }
      }

      setUser(firebaseUser ?? null)
      setLoading(false)
    })

    return unsubscribe
  }

  const cleanup = init()
  return () => { cleanup.then(unsub => unsub?.()) }
}, [])
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
