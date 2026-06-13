import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center text-black">
      <div className="bg-white text-center m-4 shadow-md flex flex-col items-center justify-center gap-4 border-2 border-sky-400 rounded-4xl p-8">
        <h1 className="text-3xl font-bold">Hai, Kréta Recap! 👋</h1>
        <p className="text-md text-gray-600">
          Kíváncsi vagy hogyan teljesítettél idén a suliban? Nézd meg a Kréta
          Recap-et, hogy megtudd!
        </p>
        <small>A folytatáshoz jelentkezz be a KRÉTA fiókoddal!</small>
        <a
          href="/api/auth/login"
          className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-full"
        >
          Bejelentkezés
        </a>
        <small>
          Semmilyen adatot nem tárolunk, részletek itt:{" "}
          <a href="/privacy" className="text-blue-500 hover:underline">
            Adatvédelmi szabályzat
          </a>
        </small>
      </div>
    </div>
  );
}
