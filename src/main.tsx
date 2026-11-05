import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  decimal,
  makeStats,
  monthName,
  type RecapData,
  type Stats,
} from "./stats";
import { demoData } from "./demo";
import { createStory, downloadStory } from "./share";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/dm-sans";
import "./style.css";
const TOTAL_SLIDES = 9;
const Arrow = ({ back = false }: { back?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d={back ? "M19 12H5m6 6-6-6 6-6" : "M5 12h14m-6-6 6 6-6 6"}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const ShareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 16V3m-5 5 5-5 5 5M5 13v7h14v-7"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}
function Count({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [count, setCount] = useState(reduced ? value : 0);
  useEffect(() => {
    if (reduced) {
      setCount(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (time: number) => {
      const progress = Math.min((time - start) / 1100, 1);
      setCount(Math.round(value * (1 - (1 - progress) ** 4)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced]);
  return (
    <span className={className} aria-label={String(value)}>
      <span aria-hidden="true">{count}</span>
    </span>
  );
}
function Spark() {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
      <path d="M50 0 58 34 85 15 66 42 100 50 66 58 85 85 58 66 50 100 42 66 15 85 34 58 0 50 34 42 15 15 42 34Z" />
    </svg>
  );
}
function Sculpture({ small = false }: { small?: boolean }) {
  return (
    <div className={`sculpture ${small ? "small" : ""}`} aria-hidden="true">
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="orbit orbit-three" />
      <div className="sculpture-core">
        5
        <span>
          egy jó sztori
          <br />
          itt kezdődik.
        </span>
      </div>
      <span className="floating-mark m1">
        <Spark />
      </span>
      <span className="floating-mark m2">+</span>
      <span className="floating-mark m3">5</span>
    </div>
  );
}
function Brand() {
  return (
    <span className="wordmark">
      kréta<span>recap</span>
      <i />
    </span>
  );
}
function StoryContent({
  index,
  stats: s,
  data,
}: {
  index: number;
  stats: Stats;
  data: RecapData;
}) {
  const firstName =
    typeof data.student?.Nev === "string"
      ? data.student.Nev.trim().split(/\s+/).slice(-1)[0]
      : "";
  const partial = data.coverage.grades !== "complete";
  if (index === 0)
    return (
      <>
        <div className="slide-kicker">01 / NYOMOT HAGYTÁL</div>
        <h1>
          {firstName ? `${firstName},` : "Szia,"}
          <br />
          ez a te
          <br />
          <em>ritmusod.</em>
        </h1>
        <Sculpture small />
        <div className="slide-bottom">
          <p>
            Egy tanév. Rengeteg pillanat.
            <br />
            Nézzük, mi lett belőlük.
          </p>
          <span className="fine">
            {data.period.label} · SZEPTEMBERTŐL MOSTANÁIG
          </span>
        </div>
      </>
    );
  if (index === 1)
    return (
      <>
        <div className="slide-kicker">02 / A NAGY SZÁM</div>
        <h1>
          Ennyiszer
          <br />
          kerültél a<br />
          <em>naplóba.</em>
        </h1>
        <div className="hero-number">
          <Count value={s.total} />
          <span>évközi jegy{partial ? " · részleges adatok" : ""}</span>
        </div>
        <p className="slide-bottom">
          {s.total === 0
            ? "Még üres a történet. Az első jeggyel indul."
            : `${s.ranking.length} tantárgy. Egyetlen, megismételhetetlen tanéved.`}
        </p>
        <span className="ghost-symbol" aria-hidden="true">
          ↗
        </span>
      </>
    );
  if (index === 2)
    return (
      <>
        <div className="slide-kicker">03 / A JEGYEID PALETTÁJA</div>
        <h1>
          Minden szám
          <br />
          egy <em>sztori.</em>
        </h1>
        <div className="grade-bars">
          {s.counts.map((n, i) => (
            <div className="grade-row" key={i}>
              <span className="grade-label">
                {i + 1}
                <small>
                  {["elégségtelen", "elégséges", "közepes", "jó", "jeles"][i]}
                </small>
              </span>
              <span className="bar-track">
                <span
                  style={
                    {
                      "--bar": `${(n / Math.max(...s.counts, 1)) * 100}%`,
                      "--delay": `${i * 85}ms`,
                    } as React.CSSProperties
                  }
                />
              </span>
              <b>{n}</b>
            </div>
          ))}
        </div>
        <div className="slide-bottom">
          <div className="big-inline">
            {s.fivePercent}
            <span>%</span>
          </div>
          <p>
            A jegyeid ekkora része lett ötös.
            <br />
            Mindegyik mögött ott voltál te.
          </p>
        </div>
      </>
    );
  if (index === 3)
    return (
      <>
        <div className="slide-kicker">04 / AHOGY BIZONYÍTOTTÁL</div>
        <h1>
          Papíron.
          <br />
          Szóban.
          <br />
          <em>Odarakva.</em>
        </h1>
        <div className="mode-grid">
          <div>
            <Count value={s.modes.written} />
            <span>dolgozatjegy</span>
          </div>
          <div>
            <Count value={s.modes.oral} />
            <span>feleletjegy</span>
          </div>
          <div>
            <Count value={s.modes.homework} />
            <span>
              házi feladatra
              <br />
              kapott jegy
            </span>
          </div>
          <div>
            <Count value={s.modes.other} />
            <span>
              egyéb módon
              <br />
              szerzett jegy
            </span>
          </div>
        </div>
        <p className="slide-bottom fine">
          A KRÉTA értékelési módjai alapján. A dolgozatok és felelések itt a
          rájuk kapott jegyeket jelentik.
        </p>
      </>
    );
  if (index === 4)
    return (
      <>
        <div className="slide-kicker">05 / A TE TEREPED</div>
        <h1>
          {s.best ? (
            <>
              Ebben voltál
              <br />
              <em>elem­edben.</em>
            </>
          ) : (
            <>
              Minden tárgy
              <br />
              egy új <em>esély.</em>
            </>
          )}
        </h1>
        <div className="subject-feature">
          <span className="star-emblem" aria-hidden="true">
            <Spark />
          </span>
          <h2>{s.best?.name ?? "Még alakul."}</h2>
          <div className="subject-score">
            {decimal(s.best?.average ?? null)}
            <span>súlyozott átlag</span>
          </div>
        </div>
        <div className="slide-bottom">
          <p>
            {s.best
              ? `${s.best.count} jegy, közte ${s.best.fives} ötös. Ez már egy saját pálya.`
              : "Legalább 3 jegy kell egy tantárgyból, hogy kiemeljük."}
          </p>
          <span className="fine">
            A LEGJOBB SÚLYOZOTT ÁTLAG · MINIMUM 3 JEGY
          </span>
        </div>
      </>
    );
  if (index === 5)
    return (
      <>
        <div className="slide-kicker">06 / CSÚCSRA JÁRATVA</div>
        <h1>
          {s.busiest ? (
            <>
              {monthName(s.busiest[0])}.<br />
              <em>Teljes fordulat.</em>
            </>
          ) : (
            <>
              A ritmusod
              <br />
              <em>még alakul.</em>
            </>
          )}
        </h1>
        <div className="rhythm-art" aria-hidden="true">
          {Array.from({ length: 22 }, (_, i) => (
            <span
              key={i}
              style={
                {
                  "--h": `${25 + Math.sin(i * 0.8) ** 2 * 65}%`,
                  "--delay": `${i * 32}ms`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
        <div className="slide-bottom">
          <div className="big-inline">
            <Count value={s.busiest?.[1] ?? 0} />
          </div>
          <p>
            {s.busiest
              ? "jegy a legsűrűbb hónapodban."
              : "jegy egyelőre. A történeted még csak most kezdődik."}
          </p>
          <span className="fine">A JEGYEK DÁTUMA ALAPJÁN</span>
        </div>
      </>
    );
  if (index === 6)
    return (
      <>
        <div className="slide-kicker">07 / ÓRA UTÁN IS</div>
        <h1>
          Ami nem fért
          <br />a <em>csengőig.</em>
        </h1>
        <div className="homework-art" aria-hidden="true">
          <span />
          <span />
          <span>
            hf.<i>↗</i>
          </span>
        </div>
        <div className="slide-bottom">
          <div className="big-inline">
            {data.coverage.homeworks === "unavailable" ? (
              "—"
            ) : (
              <Count value={s.homeworks} />
            )}
          </div>
          <p>
            {data.coverage.homeworks === "unavailable"
              ? "A házi feladatokat most nem sikerült lekérni."
              : `kiadott házi feladat${data.coverage.homeworks === "partial" ? " a sikeresen lekért időszakokban" : " a KRÉTA-ban"}.`}
          </p>
          <span className="fine">
            KIADOTT FELADATOK · NEM A TELJESÍTÉS MÉRÉSE
          </span>
        </div>
      </>
    );
  if (index === 7)
    return (
      <>
        <div className="slide-kicker">08 / AMI ÖSSZEÁLLT</div>
        <h1>
          Minden jegy
          <br />
          hozzátett
          <br />
          <em>valamit.</em>
        </h1>
        <div className="average-number">
          {decimal(s.weightedAverage)}
          <span>súlyozott átlag</span>
        </div>
        <div className="highlight-line">
          <b>{s.bestStreak}</b>
          <p>
            ötös egymás után
            <br />
            <span>a leghosszabb sorozatodban.</span>
          </p>
        </div>
        <p className="slide-bottom fine">
          {s.trend !== null
            ? `A jegyeid második felének egyszerű átlaga ${Math.abs(s.trend) < 0.005 ? "közel azonos az első felével" : `${decimal(Math.abs(s.trend))}-dal ${s.trend > 0 ? "magasabb" : "alacsonyabb"} az első felénél`}. `
            : ""}
          A súlyozott átlag az évközi tantárgyi jegyekből készül, a KRÉTA-ban
          megadott súlyokkal.
        </p>
      </>
    );
  return (
    <>
      <div className="slide-kicker">09 / EZ MIND TE VOLTÁL</div>
      <h1>
        A te sztorid.
        <br />
        <em>Vidd tovább.</em>
      </h1>
      <div className="summary-ticket">
        <div className="ticket-top">
          <Brand />
          <span>{data.period.label}</span>
        </div>
        <div className="ticket-main">
          <strong>{s.total}</strong>
          <span>évközi jegy</span>
          <i aria-hidden="true">
            <Spark />
          </i>
        </div>
        <div className="ticket-grid">
          <div>
            <b>{decimal(s.weightedAverage)}</b>
            <span>súlyozott átlag</span>
          </div>
          <div>
            <b>{s.counts[4]}</b>
            <span>ötös</span>
          </div>
          <div>
            <b>{s.modes.written}</b>
            <span>dolgozatjegy</span>
          </div>
          <div>
            <b>{s.modes.oral}</b>
            <span>feleletjegy</span>
          </div>
        </div>
        <div className="ticket-footer">
          {partial ? "RÉSZLEGES ADATOK" : "AZ ÉN SZTORIM. AZ ÉN TEMPÓM."}
          <span>↗</span>
        </div>
      </div>
      <p className="slide-bottom">
        Van, ami túl jó ahhoz,
        <br />
        hogy a naplóban maradjon.
      </p>
    </>
  );
}
function Modal({
  children,
  title,
  onClose,
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => {
      dialog.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-label={title}
    >
      <div className="modal-top">
        <span className="eyebrow">{title}</span>
        <button className="icon-button" aria-label="Bezárás" onClick={onClose}>
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
function App() {
  const [data, setData] = useState<RecapData | null>(null),
    [demo, setDemo] = useState(false);
  const [index, setIndex] = useState(0),
    [paused, setPaused] = useState(false),
    [loginOpen, setLoginOpen] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [shareOpen, setShareOpen] = useState(false),
    [shareBusy, setShareBusy] = useState(false),
    [blob, setBlob] = useState<Blob | null>(null),
    [imageUrl, setImageUrl] = useState(""),
    [shareMessage, setShareMessage] = useState("");
  const [logs, setLogs] = useState<unknown[]>([]),
    [debugOpen, setDebugOpen] = useState(false),
    [hidden, setHidden] = useState(document.hidden);
  const reduced = useReducedMotion();
  const touch = useRef<{ x: number; y: number } | null>(null);
  const stats = useMemo(() => (data ? makeStats(data) : null), [data]);
  const stopped = paused || shareOpen || debugOpen || hidden || reduced;
  useEffect(() => {
    const onChange = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);
  useEffect(() => {
    if (!data || stopped || index === TOTAL_SLIDES - 1) return;
    const timer = setTimeout(
      () => setIndex((i) => Math.min(i + 1, TOTAL_SLIDES - 1)),
      11000,
    );
    return () => clearTimeout(timer);
  }, [index, data, stopped]);
  useEffect(() => {
    if (!blob) {
      setImageUrl("");
      return;
    }
    const url = URL.createObjectURL(blob);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  function log(step: string, details?: unknown) {
    setLogs((previous) =>
      [...previous, { time: new Date().toISOString(), step, details }].slice(
        -200,
      ),
    );
  }
  async function api<T>(path: string, body?: unknown): Promise<T> {
    log("Böngésző → API", {
      path,
      body:
        body && typeof body === "object"
          ? {
              ...body,
              ...("password" in body ? { password: "[REDACTED]" } : {}),
            }
          : body,
    });
    const start = performance.now();
    try {
      const response = await fetch(
        `/api/${path}`,
        body === undefined
          ? {}
          : {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            },
      );
      const text = await response.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(
          `Az API nem JSON-t adott (HTTP ${response.status}). Ellenőrizd az alkalmazás API-naplóját.`,
        );
      }
      if (Array.isArray(json.debug))
        setLogs((previous) => [...previous, ...json.debug].slice(-200));
      const { debug: _, ...payload } = json;
      log("API → böngésző", {
        status: response.status,
        durationMs: Math.round(performance.now() - start),
        body: payload,
      });
      if (!response.ok) {
        throw new Error(json.error || `HTTP ${response.status}`);
      }
      return payload as T;
    } catch (e) {
      log("Kérés sikertelen", {
        message: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      });
      throw e;
    }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget, values = new FormData(form);
    setBusy(true); setError("");
    try {
      const result = await api<RecapData>("recap", {
        institute: String(values.get("institute")).trim().toLowerCase(),
        username: String(values.get("username")).trim(),
        password: values.get("password"),
      });
      if (result.coverage.grades === "unavailable") throw new Error("A jegyeidet most nem sikerült lekérni. Próbáld újra; a részletek a debug naplóban vannak.");
      form.reset(); setData(result); setDemo(false); setIndex(0); setPaused(false); setLoginOpen(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Nem sikerült a belépés."); }
    finally { (form.elements.namedItem("password") as HTMLInputElement).value = ""; setBusy(false); }
  }
  function exit() { setData(null); setDemo(false); setIndex(0); setError(""); setLogs([]); }
  async function openShare() {
    if (!stats || !data) return;
    setShareOpen(true);
    setShareBusy(true);
    setBlob(null);
    setShareMessage("");
    try {
      setBlob(await createStory(stats, data, demo));
    } catch (e) {
      setShareMessage(
        e instanceof Error ? e.message : "Nem sikerült a képkészítés.",
      );
    } finally {
      setShareBusy(false);
    }
  }
  async function share() {
    if (!blob) return;
    const file = new File([blob], "kreta-recap-story.png", {
      type: "image/png",
    });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "Az én KRÉTA Recap sztorim",
        });
        setShareMessage("A kép átadva a megosztófelületnek.");
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setShareMessage("A megosztás nem sikerült. A képet le is töltheted.");
      }
    } else {
      downloadStory(blob);
      setShareMessage(
        "A képet letöltöttük. Feltöltheted Instagram Storyba vagy más közösségi oldalra.",
      );
    }
  }
  const go = (direction: number) =>
    setIndex((i) => Math.max(0, Math.min(TOTAL_SLIDES - 1, i + direction)));
  return (
    <>
      {!data ? (
        <main className="landing">
          <header className="landing-header">
            <Brand />
            <span className="edition">A TE TANÉVED, ÚJRANÉZVE.</span>
          </header>
          <section className="landing-main">
            <div className="landing-copy">
              <div className="eyebrow">
                <span className="live-dot" /> TANÉV RECAP /{" "}
                {new Date().getMonth() < 8
                  ? new Date().getFullYear() - 1
                  : new Date().getFullYear()}
              </div>
              <h1>
                A tanéved.
                <br />
                Más
                <br />
                <em>szemszögből.</em>
              </h1>
              <p>
                A dolgozatok, az ötösök, a nagy hajrák.
                <br />A naplód számai mögött ott a te sztorid.
              </p>
              <button
                className="glow-button"
                onClick={() => {
                  setError("");
                  setLoginOpen(true);
                }}
              >
                Mutasd a sztorim <Arrow />
              </button>
              <button
                className="demo-button"
                onClick={() => {
                  setData(demoData());
                  setDemo(true);
                  setIndex(0);
                  setPaused(false);
                }}
              >
                Előbb belenézek <span>↗</span>
              </button>
            </div>
            <div className="landing-art">
              <Sculpture />
              <div className="art-caption">
                <span>NEM CSAK JEGYEK.</span>
                <span>EMLÉKEK.</span>
              </div>
            </div>
          </section>
          <footer className="landing-footer">
            <span>SAJÁT TEMPÓ. SAJÁT TÖRTÉNET.</span>
            <span>KRÉTA-ból. Neked.</span>
          </footer>
        </main>
      ) : (
        <main
          className={`experience theme-${["ink", "mint", "paper", "ink", "mint", "ink", "paper", "mint", "ink"][index]}`}
          onKeyDown={(event) => {
            if ((event.target as HTMLElement).closest("input, dialog, summary"))
              return;
            if (event.key === "ArrowRight") go(1);
            if (event.key === "ArrowLeft") go(-1);
          }}
          tabIndex={0}
          aria-label="A tanéved összefoglalója"
        >
          <div className="desktop-aside" aria-hidden="true">
            <span>
              AZ ÉN SZTORIM.
              <br />
              AZ ÉN TEMPÓM.
            </span>
            <span className="aside-year">{data.period.label}</span>
            <span>KRÉTA RECAP — {String(index + 1).padStart(2, "0")}</span>
          </div>
          <div className="story-shell">
            <header className="story-header">
              <Brand />
              <div className="story-actions">
                {demo && <span className="demo-badge">DEMÓ</span>}
                <button
                  className="icon-button"
                  onClick={() => setPaused((v) => !v)}
                  disabled={reduced}
                  aria-label={
                    reduced
                      ? "Csökkentett mozgás: kézi lapozás"
                      : paused
                        ? "Lejátszás folytatása"
                        : "Szünet"
                  }
                  title={
                    reduced
                      ? "Csökkentett mozgás: kézi lapozás"
                      : paused
                        ? "Folytatás"
                        : "Szünet"
                  }
                >
                  {paused || reduced ? "▷" : "Ⅱ"}
                </button>
                <button
                  className="icon-button"
                  onClick={exit}
                  disabled={busy}
                  aria-label={demo ? "Demó bezárása" : "Összefoglaló bezárása"}
                >
                  ×
                </button>
              </div>
            </header>
            <nav className="progress" aria-label="Összefoglaló oldalak">
              {Array.from({ length: TOTAL_SLIDES }, (_, i) => (
                <button
                  key={i}
                  aria-label={`${i + 1}. oldal`}
                  aria-current={i === index ? "step" : undefined}
                  onClick={() => setIndex(i)}
                >
                  <span
                    key={`${index}-${stopped}`}
                    className={`${i < index ? "done" : ""} ${i === index ? "active" : ""} ${stopped || i === TOTAL_SLIDES - 1 ? "stopped" : ""}`}
                  />
                </button>
              ))}
            </nav>
            <div className="story-meta">
              <span>{data.period.label} / EDDIG</span>
              <span>{String(index + 1).padStart(2, "0")} — 09</span>
            </div>
            {data.coverage.grades === "partial" && (
              <p className="coverage-note">
                Néhány időszak hiányzik · részleges összefoglaló
              </p>
            )}
            <section
              className={`slide slide-${index}`}
              key={index}
              aria-label={`${index + 1}. oldal`}
              onTouchStart={(event) => {
                touch.current = {
                  x: event.touches[0].clientX,
                  y: event.touches[0].clientY,
                };
              }}
              onTouchEnd={(event) => {
                if (!touch.current) return;
                const dx = event.changedTouches[0].clientX - touch.current.x,
                  dy = event.changedTouches[0].clientY - touch.current.y;
                if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4)
                  go(dx < 0 ? 1 : -1);
                touch.current = null;
              }}
            >
              <StoryContent index={index} stats={stats!} data={data} />
            </section>
            <div className="story-controls">
              <button
                className="back-button"
                aria-label="Előző oldal"
                disabled={index === 0}
                onClick={() => go(-1)}
              >
                <Arrow back />
              </button>
              {index === TOTAL_SLIDES - 1 ? (
                <button className="glow-button" onClick={openShare}>
                  Ez mehet sztoriba <ShareIcon />
                </button>
              ) : (
                <button className="next-button" onClick={() => go(1)}>
                  {index === 0 ? "Nézzük" : "Tovább"}
                  <Arrow />
                </button>
              )}
            </div>
            <div className="story-footnote">
              {data.period.start.replaceAll("-", ".")} —{" "}
              {data.period.end.replaceAll("-", ".")}
              <span>CSÚSZTASS VAGY LAPOZZ →</span>
            </div>
          </div>
        </main>
      )}
      {error && !loginOpen && (
        <div className="global-error" role="alert">
          {error}
        </div>
      )}
      <details
        className="debug"
        onToggle={(event) => setDebugOpen(event.currentTarget.open)}
      >
        <summary>
          Fejlesztői napló <span>+</span>
        </summary>
        {debugOpen && (
          <div>
            <p>
              Részletes API-napló és nyers adatok. A jelszavak és hitelesítési
              titkok kitakarva.
            </p>
            <button onClick={() => setLogs([])}>Napló törlése</button>
            <pre>{JSON.stringify(logs, null, 2)}</pre>
            {data && (
              <>
                <h3>Adatok és számítás</h3>
                <p>
                  Évközi, 1–5 közötti tantárgyi jegyek; félévi, év végi,
                  magatartás és szorgalom nélkül. A hiányzó súly 100%. Kihagyott
                  értékelések: {stats?.excluded}.
                </p>
                <pre>{JSON.stringify({ stats, data }, null, 2)}</pre>
              </>
            )}
          </div>
        )}
      </details>
      {loginOpen && (
        <Modal
          title="BELÉPÉS A SZTORIDBA"
          onClose={() => {
            if (!busy) setLoginOpen(false);
          }}
        >
          <h2>
            Helló,
            <br />
            <em>főszereplő.</em>
          </h2>
          <p>A saját KRÉTA-belépéseddel indulunk.</p>
          <form onSubmit={submit}>
            <label>
              Intézménykód
              <input
                autoFocus
                name="institute"
                placeholder="pl. klik123456789"
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                disabled={busy}
              />
              <small>Az iskola címe az .e-kreta.hu előtt.</small>
            </label>
            <label>
              Felhasználónév
              <input
                name="username"
                autoComplete="username"
                placeholder="KRÉTA-felhasználónév"
                required
                disabled={busy}
              />
            </label>
            <label>
              Jelszó
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="A jelszavad"
                required
                disabled={busy}
              />
            </label>
            <button className="glow-button" disabled={busy}>
              {busy ? "Összerakjuk a sztorid…" : "Induljon a recap"}
              {busy ? <span className="spinner" /> : <Arrow />}
            </button>
          </form>
          {busy && (
            <p className="loading-hint" role="status">
              A tanév adatait kisebb időszakokban kérjük le. Ez eltarthat egy
              kicsit.
            </p>
          )}
          {error && (
            <div className="form-error" role="alert">
              <p>{error}</p>
              <details>
                <summary>Részletes hibanapló</summary>
                <pre>{JSON.stringify(logs, null, 2)}</pre>
              </details>
            </div>
          )}
          <p className="privacy">
            A jelszavadat nem mentjük el. Az adataidból itt, a böngésződben
            készül az összefoglaló. Nem hivatalos KRÉTA-alkalmazás.
          </p>
        </Modal>
      )}
      {shareOpen && (
        <Modal title="A SZTORID, VITELRE" onClose={() => setShareOpen(false)}>
          <h2>
            Ez a te
            <br />
            <em>lenyomatod.</em>
          </h2>
          {shareBusy ? (
            <p role="status">Elkészítjük a story-kártyád…</p>
          ) : imageUrl ? (
            <img
              className="share-preview"
              src={imageUrl}
              alt="A megosztható tanévi összefoglaló: jegyek, átlag, ötösök, dolgozatjegyek és feleletjegyek."
            />
          ) : null}
          <p className="share-description">
            1080 × 1920 · Story méret
            <br />
            Név, iskola és belépési adatok nélkül.
            {demo ? " Ez egy DEMÓ-kártya." : ""}
          </p>
          <button className="glow-button" disabled={!blob} onClick={share}>
            Megosztom <ShareIcon />
          </button>
          <button
            className="demo-button"
            disabled={!blob}
            onClick={() => {
              if (blob) {
                downloadStory(blob);
                setShareMessage("PNG mentése elindítva.");
              }
            }}
          >
            Kép mentése ↓
          </button>
          {shareMessage && (
            <p className="share-description" role="status">
              {shareMessage}
            </p>
          )}
        </Modal>
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
