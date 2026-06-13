import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kréta Recap",
  description:
    "A Spotify Wrapped mintájára készült összefoglaló a KRÉTA rendszerhez, amely megmutatja a tanév során elért eredményeket és statisztikákat.",
};

// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="hu"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-stone-100 text-white flex justify-center items-center min-h-screen w-full overflow-x-hidden">
        <main className="w-full max-w-md min-h-screen flex flex-col justify-center items-center relative overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
