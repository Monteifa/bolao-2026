import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { RankingProvider } from "@/contexts/RankingContext";
import RotaProtegida from "@/components/RotaProtegida";
import Login from "@/pages/Login";
import FixturesList from "@/pages/FixturesList";
import Ranking from "@/pages/Ranking";
import Admin from "@/pages/Admin/Admin";
import Predictions from "@/pages/Predictions";
import Extras from "@/pages/Extras";
import PalpitesUsuario from "@/pages/PalpitesUsuario/PalpitesUsuario";

import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RankingProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/palpites" element={<RotaProtegida><FixturesList /></RotaProtegida>} />
            <Route path="/ranking" element={<RotaProtegida><Ranking /></RotaProtegida>} />
            <Route path="/admin" element={<RotaProtegida><Admin /></RotaProtegida>} />
            <Route path="/meus-palpites" element={<RotaProtegida><Predictions /></RotaProtegida>} />
            <Route path="/extras" element={<RotaProtegida><Extras /></RotaProtegida>} />
            <Route path="/palpites/:uid" element={<RotaProtegida><PalpitesUsuario /></RotaProtegida>} />
          </Routes>
          <Toaster richColors position="top-center" />
        </RankingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
