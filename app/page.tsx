"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  function authKreta() {
    router.push("/login");
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center text-black">
      <div className="bg-white text-center m-4 shadow-md flex flex-col items-center justify-center gap-4 border-2 border-sky-400 rounded-4xl p-8">
        <h1 className="text-3xl font-bold">Hai, Kréta Recap! 👋</h1>
        <p className="text-md text-gray-600">
          Kíváncsi vagy hogyan teljesítettél idén a suliban? Nézd meg a Kréta
          Recap-et, hogy megtudd!
        </p>
        <small className="text-xs text-gray-500">
          A folytatáshoz jelentkezz be a KRÉTA fiókoddal!
        </small>
        <button
          onClick={authKreta}
          className="
            w-full py-4 rounded-full font-black text-base 
            flex items-center justify-center gap-2 cursor-pointer text-white
            bg-gradient-to-b from-sky-400 to-sky-500
            shadow-[0_6px_10px_#FF5C0044]
            transition-all duration-200 ease-in-out
            
            hover:from-sky-500 hover:to-sky-600 hover:scale-[1.01]
            active:scale-[0.95]
          "
        >
          <span>Belépés KRÉTA fiókkal</span>
        </button>
        <small className="text-xs text-gray-500">
          Semmilyen adatot nem tárolunk, részletek itt:{" "}
          <a href="/privacy" className="text-sky-500 hover:underline">
            Adatvédelmi nyilatkozat
          </a>
        </small>
      </div>
    </div>
  );
}
