export default async function handler(req, res) {
  const path = Array.isArray(req.query.path)
    ? req.query.path.join("/")
    : req.query.path

  const url = `https://media.api-sports.io/${path}`

  try {
    const response = await fetch(url, {
      headers: {
        "x-apisports-key": process.env.VITE_API_FOOTBALL_KEY,
      },
    })

    if (!response.ok) {
      return res.status(response.status).end()
    }

    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get("Content-Type") || "image/png"

    res.setHeader("Content-Type", contentType)
    res.setHeader("Cache-Control", "public, max-age=86400")
    res.send(Buffer.from(buffer))
  } catch (err) {
    console.error("Erro no proxy de imagem:", err)
    res.status(500).end()
  }
}
