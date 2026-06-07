import { Trophy, Medal, Award, Target, Star } from "lucide-react"

const ICONS = { trophy: Trophy, medal: Medal, award: Award, target: Target, star: Star }

export function ExtraCard({ icon, titulo, pontos, children }) {
  const Icon = ICONS[icon] || Star
  const badgeClass =
    pontos === 25 ? "bg-green-100 text-green-800" :
    pontos === 15 ? "bg-blue-100 text-blue-800" :
    "bg-amber-100 text-amber-800"

  return (
    <div className="bg-card border border-border rounded-xl mb-3 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-medium flex items-center gap-2">
          <Icon className="w-4 h-4" />
          {titulo}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${badgeClass}`}>
          {pontos} pts
        </span>
      </div>
      <div className="px-4 py-3">
        {children}
      </div>
    </div>
  )
}
