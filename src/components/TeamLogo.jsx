import { useState } from "react"
import { getTeamLogo } from "@/utils/images"

export function TeamLogo({ src, name, size = 32 }) {
  const [error, setError] = useState(false)

  if (error || !src) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0"
      >
        {name?.slice(0, 2).toUpperCase()}
      </div>
    )
  }

  return (
    <img
      src={getTeamLogo(src)}
      alt={name}
      width={size}
      height={size}
      onError={() => setError(true)}
      className="object-contain flex-shrink-0"
    />
  )
}
