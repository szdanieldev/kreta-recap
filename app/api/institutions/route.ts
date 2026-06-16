import { NextResponse } from "next/server";
import axios from "axios";

// Formátum példák: 
// Ha nincs jelszó: "http://123.45.67.89:8080"
// Ha van jelszó: "http://user:password@123.45.67.89:8080"
const PROXY_URL = process.env.PROXY_URL || "https://193.226.205.54:443";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("search") || "";

    if (!query) return NextResponse.json([]);

    // URL felbontása a proxy beállításokhoz
    const proxyUrl = new URL(PROXY_URL);
    
    const proxyConfig = {
      host: proxyUrl.hostname,
      port: parseInt(proxyUrl.port),
      auth: proxyUrl.username ? {
        username: decodeURIComponent(proxyUrl.username),
        password: decodeURIComponent(proxyUrl.password)
      } : undefined
    };

    // Kérés indítása Axios-szal, a Next.js fetch kihagyásával
    const response = await axios.get(
      `https://intezmenykereso.e-kreta.hu/instituteSelector/${encodeURIComponent(query)}`,
      {
        proxy: proxyConfig,
        timeout: 10000, // 10 másodperc időtúllépés
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        }
      }
    );

    // Az Axios a response.data-ban adja vissza a testet (itt a HTML stringet)
    const html = response.data;
    if (typeof html !== "string") {
      throw new Error("Nem string formátumú válasz érkezett.");
    }

    const matches = [...html.matchAll(/<a[^>]+data-val="([^"]+)"[^>]*>(.*?)<\/a>/g)];

    const data = matches.map((m) => {
      const raw = m[2].replace(/&nbsp;/g, " ").trim();
      const codeMatch = raw.match(/\(([^)]+)\)/);
      return {
        id: m[1],
        name: raw.replace(/\s*\(.*\)\s*/, "").trim(),
        code: codeMatch?.[1] ?? "",
      };
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Axios Proxy Hiba:", error.message || error);
    return NextResponse.json(
      { error: "Nem sikerült elérni a Kréta szervereit a proxyn keresztül sem." },
      { status: 500 }
    );
  }
}