import { getCountryIso } from "@/utils/countryFlags"

export function CountryFlag({ country, size = 24 }) {
  const iso = getCountryIso(country)

  if (!iso) {
    return (
      <div
        style={{ width: size, height: size * 0.75 }}
        className="rounded-sm bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground flex-shrink-0"
      >
        {country?.slice(0, 2).toUpperCase()}
      </div>
    )
  }

  return (
    <span
      className={`fi fi-${iso}`}
      style={{
        width: size,
        height: size * 0.75,
        display: "inline-block",
        borderRadius: "2px",
        flexShrink: 0,
      }}
      role="img"
      aria-label={`Bandeira de ${country}`}
    />
  )
}
