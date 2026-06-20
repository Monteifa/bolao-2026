import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore"
import { db } from "@/firebase/firebase"

export async function migrarFotosPalpitesAntigos() {
  const palpitesSnap = await getDocs(collection(db, "palpites"))

  const semFoto = palpitesSnap.docs.filter((d) => !d.data().foto)

  if (semFoto.length === 0) {
    return { atualizados: 0, mensagem: "Nenhum palpite precisava de atualização" }
  }

  const uidsUnicos = [...new Set(semFoto.map((d) => d.data().userId))]
  const usuariosMap = {}

  await Promise.all(
    uidsUnicos.map(async (uid) => {
      const userSnap = await getDoc(doc(db, "usuarios", uid))
      if (userSnap.exists()) {
        usuariosMap[uid] = userSnap.data()
      }
    })
  )

  await Promise.all(
    semFoto.map(async (docSnap) => {
      const data = docSnap.data()
      const usuario = usuariosMap[data.userId]
      if (!usuario) return

      await updateDoc(docSnap.ref, {
        foto: usuario.foto ?? null,
        nome: usuario.nome ?? data.nome,
      })
    })
  )

  return {
    atualizados: semFoto.length,
    mensagem: `${semFoto.length} palpite(s) atualizado(s) com sucesso`,
  }
}
