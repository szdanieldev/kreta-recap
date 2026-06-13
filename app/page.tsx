"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  function authKreta() {
    const authUrl = `https://idp.e-kreta.hu/connect/authorize?prompt=login&nonce=wylCrqT4oN6PPgQn2yQB0euKei9nJeZ6_ffJ-VpSKZU&response_type=code&code_challenge_method=S256&scope=openid%20email%20offline_access%20kreta-ellenorzo-webapi.public%20kreta-eugyintezes-webapi.public%20kreta-fileservice-webapi.public%20kreta-mobile-global-webapi.public%20kreta-dkt-webapi.public%20kreta-ier-webapi.public&code_challenge=HByZRRnPGb-Ko_wTI7ibIba1HQ6lor0ws4bcgReuYSQ&redirect_uri=https://mobil.e-kreta.hu/ellenorzo-student/prod/oauthredirect&client_id=kreta-ellenorzo-student-mobile-ios&state=kretarecap_student_mobile&acr_values=institute_code:`;
    router.push(authUrl);
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
