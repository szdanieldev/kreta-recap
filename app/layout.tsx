import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kréta Recap",
  description:
    "A Spotify Wrapped mintájára készült összefoglaló a KRÉTA rendszerhez, amely megmutatja a tanév során elért eredményeket és statisztikákat.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu" className={`${inter.variable} h-full antialiased`}>
      <body className="bg-stone-100 text-white flex justify-center items-center min-h-screen w-full overflow-x-hidden">
        <main className="w-full max-w-md min-h-screen flex flex-col justify-center items-center relative overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
