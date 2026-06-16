"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

type Institution = {
  id: string;
  name: string;
  code: string;
};

export default function LoginPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstitution, setSelectedInstitution] =
    useState<Institution | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Intézmények lekérése, ha a felhasználó gépel
  useEffect(() => {
    if (!search.trim()) {
      setInstitutions([]);
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(() => {
      fetch(`/api/institutions?search=${encodeURIComponent(search)}`)
        .then((res) => res.json())
        .then((data) => {
          setInstitutions(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => {
          setInstitutions([]);
          setLoading(false);
        });
    }, 300); // 300ms debounce, hogy ne küldjön minden leütésre API kérést

    return () => clearTimeout(delayDebounce);
  }, [search]); // <--- Itt volt a hiba, a 'Join' szó sikeresen törölve!

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ username, password, institution: selectedInstitution });
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center text-black bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white text-center m-4 shadow-md flex flex-col items-center justify-center gap-4 border-2 border-sky-400 rounded-[2rem] p-8 w-full max-w-md"
      >
        <h1 className="text-3xl font-bold">Belépés KRÉTA fiókkal</h1>
        <p className="text-md text-gray-600">
          Kérlek, jelentkezz be a KRÉTA fiókoddal!
        </p>

        <input
          type="text"
          placeholder="Felhasználónév"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-5 py-4 rounded-full border-2 border-gray-200 outline-none focus:border-sky-400 transition-all"
        />

        <input
          type="password"
          placeholder="Jelszó"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-5 py-4 rounded-full border-2 border-gray-200 outline-none focus:border-sky-400 transition-all"
        />

        {/* Intézmény választó dropdown */}
        <div className="relative w-full">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="w-full px-5 py-4 rounded-full border-2 border-gray-200 flex items-center justify-between hover:border-sky-400 transition-all"
          >
            <span className="truncate">
              {selectedInstitution
                ? selectedInstitution.name
                : "Válassz intézményt"}
            </span>
            <ChevronDown
              size={18}
              className={`transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>

          {open && (
            <div className="absolute top-full left-0 mt-2 w-full bg-white border-2 border-sky-200 rounded-3xl shadow-xl z-50 overflow-hidden">
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Keresés..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-full border-2 border-gray-200 outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-sm text-gray-500">Betöltés...</div>
                ) : institutions.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">Nincs találat</div>
                ) : (
                  institutions.map((inst) => (
                    <button
                      key={inst.id}
                      type="button"
                      onClick={() => {
                        setSelectedInstitution(inst);
                        setOpen(false);
                        setSearch("");
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-sky-50 transition-all border-b border-gray-100 last:border-none"
                    >
                      <div className="font-semibold text-sm">{inst.name}</div>
                      {inst.code && (
                        <div className="text-xs text-sky-600 mt-1">
                          OM azonosító: {inst.code}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-4 rounded-full font-black text-base text-white bg-gradient-to-b from-sky-400 to-sky-500 shadow-[0_6px_10px_#0ea5e944] transition-all hover:scale-[1.01] active:scale-[0.95]"
        >
          Belépés
        </button>
      </form>
    </div>
  );
}
