import { signInWithPopup, signInWithRedirect } from "firebase/auth";
import { auth, provider } from "@/firebase/firebase";

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export async function loginComGoogle() {
  if (isMobile) {
    await signInWithRedirect(auth, provider);
  } else {
    return signInWithPopup(auth, provider);
  }
}
