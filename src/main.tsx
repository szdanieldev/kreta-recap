import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  decimal,
  makeStats,
  monthName,
  type RecapData,
  type Stats,
} from "./stats";
import { InstitutionSearch, type Institution } from "./InstitutionSearch";
import { getRank } from "./rank";
import { PrivacyNotice } from "./privacy";
import { createStory, downloadStory } from "./share";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/dm-sans";
import "./style.css";
import "./brand.css";

const TOTAL_SLIDES = 15;
const THEMES = [
  "ink",
  "mint",
  "paper",
  "ink",
  "mint",
  "paper",
  "ink",
  "mint",
  "paper",
  "ink",
  "mint",
  "paper",
  "ink",
  "mint",
  "paper",
];

const shortDate = (iso: string) => {
  const [, , d] = iso.split("-");
  return `${Number(d)}. ${monthName(iso.slice(0, 7))}`;
};

/* ─────────── ICONS ─────────── */
const Svg = ({
  children,
  fill = false,
  w = 24,
}: {
  children: React.ReactNode;
  fill?: boolean;
  w?: number;
}) => (
  <svg
    viewBox="0 0 24 24"
    width={w}
    height={w}
    fill={fill ? "currentColor" : "none"}
    stroke={fill ? "none" : "currentColor"}
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);
const Arrow = ({ back = false }: { back?: boolean }) => (
  <Svg>
    <path d={back ? "M19 12H5m6 6-6-6 6-6" : "M5 12h14m-6-6 6 6-6 6"} />
  </Svg>
);
const ShareIcon = () => (
  <Svg>
    <path d="M12 16V3m-5 5 5-5 5 5M5 13v7h14v-7" />
  </Svg>
);
const IconPause = () => (
  <Svg fill>
    <rect x="6" y="5" width="4" height="14" rx="1.5" />
    <rect x="14" y="5" width="4" height="14" rx="1.5" />
  </Svg>
);
const IconPlay = () => (
  <Svg fill>
    <path d="M8 5.5v13a1 1 0 0 0 1.54.84l10-6.5a1 1 0 0 0 0-1.68l-10-6.5A1 1 0 0 0 8 5.5z" />
  </Svg>
);
const IconClose = () => (
  <Svg>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);
const IconBook = () => (
  <Svg>
    <path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2V5z" />
    <path d="M8 3v18" />
  </Svg>
);
const IconChart = () => (
  <Svg>
    <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
  </Svg>
);
const IconTrophy = () => (
  <Svg>
    <path d="M8 21h8M12 17v4" />
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
    <path d="M17 5h3a2 2 0 0 1-2 4h-1M7 5H4a2 2 0 0 0 2 4h1" />
  </Svg>
);
const IconCalendar = () => (
  <Svg>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </Svg>
);
const IconHome = () => (
  <Svg>
    <path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9z" />
    <path d="M9 21v-7h6v7" />
  </Svg>
);
const IconTrend = () => (
  <Svg>
    <path d="m3 17 6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </Svg>
);
const IconPen = () => (
  <Svg>
    <path d="m16 3 5 5L8 21H3v-5L16 3z" />
  </Svg>
);
const IconMic = () => (
  <Svg>
    <rect x="9" y="3" width="6" height="12" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" />
  </Svg>
);
const IconDots = () => (
  <Svg fill>
    <circle cx="6" cy="12" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="18" cy="12" r="1.6" />
  </Svg>
);
const IconStar = () => (
  <Svg>
    <path d="m12 3 2.9 5.9L21 10l-4.5 4.4 1.1 6.2L12 17.5 6.4 20.6l1.1-6.2L3 10l6.1-1.1z" />
  </Svg>
);
const IconFlame = () => (
  <Svg>
    <path d="M12 22c4 0 6-2.7 6-6 0-2.5-1.5-5-3-6.5 0 2-1 3-2 3s-1.5-1-1.5-3c0-2-1.5-4-3.5-5.5.5 2-1 4-1.5 5.5C5.5 12 5 13.5 5 15c0 3.5 2.5 7 7 7z" />
  </Svg>
);
const IconTarget = () => (
  <Svg>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" />
  </Svg>
);

/* ─────────── HELPERS ─────────── */
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
      <div className="sculpture-core">5</div>
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
      jegyem<span className="brand-dot">.</span>
    </span>
  );
}

/* ─────────── SLIDES ─────────── */
function StoryContent({
  index,
  stats: s,
  data,
}: {
  index: number;
  stats: Stats;
  data: RecapData;
}) {
  const partial = data.coverage.grades !== "complete";
  const weekdayLabels = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];

  /* 0 ─ intro */
  if (index === 0)
    return (
      <>
        <h1>
          Ez a<br />
          tanéved.
        </h1>
        <Sculpture small />
        <p className="slide-bottom">Nézd végig.</p>
      </>
    );

  /* 1 ─ total + subjects */
  if (index === 1)
    return (
      <>
        <span className="slide-mark">
          <IconBook />
        </span>
        <h1>
          Ennyi
          <br />
          történet.
        </h1>
        <div className="hero-number">
          <Count value={s.total} />
          <span>
            jegy{partial ? " · részleges" : ""} · {s.subjectCount} tantárgyból
          </span>
        </div>
        <p className="slide-bottom">
          {s.total === 0
            ? "Még nincs jegyed idén."
            : `Átlagosan ${s.avgPerMonth ? decimal(s.avgPerMonth) : "—"} jegy / hónap.`}
        </p>
      </>
    );

  /* 2 ─ distribution */
  if (index === 2)
    return (
      <>
        <span className="slide-mark">
          <IconChart />
        </span>
        <h1>
          Így oszlanak
          <br />
          meg.
        </h1>
        <div className="grade-bars">
          {s.counts.map((n, i) => (
            <div className="grade-row" key={i}>
              <span className="grade-label">
                {i + 1}
                <small>
                  {["elégtelen", "elégséges", "közepes", "jó", "jeles"][i]}
                </small>
              </span>
              <span className="bar-track">
                <span
                  style={
                    {
                      "--bar": `${(n / Math.max(...s.counts, 1)) * 100}%`,
                      "--delay": `${i * 80}ms`,
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
          <p>ötös az összes jegyedből.</p>
        </div>
      </>
    );

  /* 3 ─ top subjects podium */
  if (index === 3)
    return (
      <>
        <span className="slide-mark">
          <IconTrophy />
        </span>
        <h1>
          A három
          <br />
          kedvenced.
        </h1>
        {s.topSubjects.length === 0 ? (
          <p className="slide-bottom">Még nincs elég jegyed.</p>
        ) : (
          <div className="podium">
            {s.topSubjects.map((subj, i) => (
              <div key={subj.name} className={`podium-row podium-${i}`}>
                <span className="podium-rank">{i + 1}</span>
                <div className="podium-info">
                  <span className="podium-name">{subj.name}</span>
                  <span className="podium-meta">
                    {subj.count} jegy · {decimal(subj.average)} átlag
                  </span>
                </div>
                <span className="podium-score">
                  {subj.fives}
                  <small>ötös</small>
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="slide-bottom fine">Súlyozott átlag szerint rendezve.</p>
      </>
    );

  /* 4 ─ mode breakdown */
  if (index === 4)
    return (
      <>
        <h1>
          Hogyan
          <br />
          kaptad őket.
        </h1>
        <div className="mode-grid">
          <div>
            <IconPen />
            <Count value={s.modes.written} />
            <span>dolgozat</span>
          </div>
          <div>
            <IconMic />
            <Count value={s.modes.oral} />
            <span>felelet</span>
          </div>
          <div>
            <IconHome />
            <Count value={s.modes.homework} />
            <span>házi</span>
          </div>
          <div>
            <IconDots />
            <Count value={s.modes.other} />
            <span>egyéb</span>
          </div>
        </div>
        {s.dominantMode && (
          <p className="slide-bottom">
            Leginkább{" "}
            <em>
              {s.dominantMode === "written"
                ? "dolgozatból"
                : s.dominantMode === "oral"
                  ? "feleletből"
                  : s.dominantMode === "homework"
                    ? "háziból"
                    : "egyéb módon"}
            </em>{" "}
            kaptál jegyet — {s.dominantModePercent}%-ban.
          </p>
        )}
      </>
    );

  /* 5 ─ best subject detailed */
  if (index === 5)
    return (
      <>
        <span className="slide-mark">
          <IconTrophy />
        </span>
        <h1>
          {s.best ? (
            <>
              A legerősebb
              <br />
              tantárgyad.
            </>
          ) : (
            <>
              Még
              <br />
              alakul.
            </>
          )}
        </h1>
        <div className="subject-feature">
          <span className="star-emblem">
            <Spark />
          </span>
          <h2>{s.best?.name ?? "—"}</h2>
          <div className="subject-score">
            {decimal(s.best?.average ?? null)}
            <span>súlyozott átlag</span>
          </div>
        </div>
        <p className="slide-bottom">
          {s.best
            ? `${s.best.count} jegy · ${s.best.fives} ötös${s.perfectSubjects > 0 ? ` · ${s.perfectSubjects} tantárgy csupa ötös` : ""}`
            : "Legalább 3 jegy kell."}
        </p>
      </>
    );

  /* 6 ─ month chart */
  if (index === 6) {
    const maxCount = Math.max(1, ...s.monthBreakdown.map((m) => m.count));
    return (
      <>
        <span className="slide-mark">
          <IconCalendar />
        </span>
        <h1>
          Hónapról
          <br />
          hónapra.
        </h1>
        {s.monthBreakdown.length === 0 ? (
          <p className="slide-bottom">Még nincs adat.</p>
        ) : (
          <div className="month-chart">
            {s.monthBreakdown.map((m, i) => (
              <div
                key={m.month}
                className={`month-col ${s.bestMonth?.month === m.month ? "best" : ""}`}
              >
                <span className="month-count">{m.count}</span>
                <div
                  className="month-bar"
                  style={
                    {
                      "--h": `${(m.count / maxCount) * 100}%`,
                      "--delay": `${i * 60}ms`,
                    } as React.CSSProperties
                  }
                />
                <span className="month-label">
                  {monthName(m.month).slice(0, 3)}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="slide-bottom">
          {s.bestMonth && (
            <>
              <div className="big-inline">
                {decimal(s.bestMonth.average)}
                <span className="inline-unit">átlag</span>
              </div>
              <p>
                <em>{monthName(s.bestMonth.month)}</em> volt a legjobb hónapod —{" "}
                {s.bestMonth.count} jegy.
              </p>
            </>
          )}
        </div>
      </>
    );
  }

  /* 7 ─ daily records */
  if (index === 7)
    return (
      <>
        <h1>A rekordjaid.</h1>
        <div className="records">
          {s.mostGradesDay && (
            <div className="record-card">
              <span className="record-icon">
                <IconFlame />
              </span>
              <div className="record-info">
                <span className="record-label">Legtöbb jegy egy nap</span>
                <span className="record-value">
                  {s.mostGradesDay.count}
                  <small> jegy</small>
                </span>
              </div>
              <div className="record-date">
                {shortDate(s.mostGradesDay.date)}
              </div>
            </div>
          )}
          {s.bestDay && (
            <div className="record-card">
              <span className="record-icon">
                <IconTrophy />
              </span>
              <div className="record-info">
                <span className="record-label">Legjobb napod</span>
                <span className="record-value">
                  {decimal(s.bestDay.average)}
                  <small> átlag</small>
                </span>
              </div>
              <div className="record-date">{shortDate(s.bestDay.date)}</div>
            </div>
          )}
          {s.mostFivesDay && (
            <div className="record-card">
              <span className="record-icon">
                <IconStar />
              </span>
              <div className="record-info">
                <span className="record-label">Legtöbb ötös egy nap</span>
                <span className="record-value">
                  {s.mostFivesDay.fives}
                  <small> ötös</small>
                </span>
              </div>
              <div className="record-date">
                {shortDate(s.mostFivesDay.date)}
              </div>
            </div>
          )}
        </div>
      </>
    );

  /* 8 ─ weekday chart */
  if (index === 8) {
    const maxWeekday = Math.max(1, ...s.weekdayCounts);
    return (
      <>
        <span className="slide-mark">
          <IconCalendar />
        </span>
        <h1>
          Mikor
          <br />
          pörögtél.
        </h1>
        <div className="weekday-chart">
          {s.weekdayCounts.map((count, i) => (
            <div
              key={i}
              className={`weekday-col ${s.busiestWeekday?.day === i ? "peak" : ""}`}
            >
              <div
                className="weekday-bar"
                style={
                  {
                    "--h": `${(count / maxWeekday) * 100}%`,
                    "--delay": `${i * 60}ms`,
                  } as React.CSSProperties
                }
              />
              <span>{weekdayLabels[i]}</span>
            </div>
          ))}
        </div>
        {s.busiestWeekday && (
          <p className="slide-bottom">
            <em>
              {
                [
                  "hétfőn",
                  "kedden",
                  "szerdán",
                  "csütörtökön",
                  "pénteken",
                  "szombaton",
                  "vasárnap",
                ][s.busiestWeekday.day]
              }
            </em>{" "}
            kaptad a legtöbb jegyet — {s.busiestWeekday.count} darabot.
          </p>
        )}
      </>
    );
  }

  /* 9 ─ homework */
  if (index === 9)
    return (
      <>
        <span className="slide-mark">
          <IconHome />
        </span>
        <h1>
          Házi
          <br />
          feladatok.
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
              ? "Most nem elérhető."
              : "kiadott feladat."}
          </p>
        </div>
      </>
    );

  /* 10 ─ average + streak + momentum */
  if (index === 10)
    return (
      <>
        <span className="slide-mark">
          <IconTrend />
        </span>
        <h1>
          Az átlagod
          <br />
          és a sorozatod.
        </h1>
        <div className="average-number">
          {decimal(s.weightedAverage)}
          <span>súlyozott átlag</span>
        </div>
        <div className="highlight-line">
          <b>{s.bestStreak}</b>
          <p>
            ötös egymás után
            <span>a leghosszabb sorozatod.</span>
          </p>
        </div>
        {s.recentFiveDelta !== null && Math.abs(s.recentFiveDelta) >= 0.15 && (
          <div className={`momentum ${s.recentFiveDelta > 0 ? "up" : "down"}`}>
            <IconTrend />
            <span>
              Az utolsó 5 jegyed{" "}
              <strong>{decimal(Math.abs(s.recentFiveDelta))}</strong>-tal{" "}
              {s.recentFiveDelta > 0 ? "jobb" : "gyengébb"} az átlagodnál.
            </span>
          </div>
        )}
      </>
    );

  /* 11 ─ most improved + hardest */
  if (index === 11)
    return (
      <>
        <h1>A fejlődésed.</h1>
        {s.mostImproved && s.mostImproved.delta > 0 ? (
          <div className="improvement-card">
            <span className="improvement-label">LEGTÖBBET FEJLŐDTÉL</span>
            <h2>{s.mostImproved.name}</h2>
            <div className="improvement-nums">
              <span>{decimal(s.mostImproved.first)}</span>
              <Arrow />
              <span className="improvement-second">
                {decimal(s.mostImproved.second)}
              </span>
            </div>
            <span className="improvement-delta">
              +{decimal(s.mostImproved.delta)}
            </span>
          </div>
        ) : (
          <div className="improvement-card empty">
            <span className="improvement-label">MOMENTUM</span>
            <p>Még nincs elég jegy a fejlődés kimutatásához.</p>
          </div>
        )}
        {s.hardestSubject && (
          <div className="hardest-card">
            <span className="hardest-label">A LEGNEHEZEBB TÁRGYAD</span>
            <span className="hardest-name">{s.hardestSubject.name}</span>
            <span className="hardest-meta">
              {decimal(s.hardestSubject.average)} átlag ·{" "}
              {s.hardestSubject.count} jegy
            </span>
          </div>
        )}
      </>
    );

  /* 12 ─ consistency */
  if (index === 12) {
    const label =
      s.consistency >= 80
        ? "Kiszámítható"
        : s.consistency >= 60
          ? "Stabil"
          : s.consistency >= 40
            ? "Hullámzó"
            : "Kiszámíthatatlan";
    return (
      <>
        <span className="slide-mark">
          <IconTarget />
        </span>
        <h1>
          Mennyire
          <br />
          vagy stabil?
        </h1>
        <div className="consistency-score">
          <Count value={s.consistency} />
          <span>/ 100</span>
        </div>
        <p className="consistency-meta">
          <span className="consistency-label">{label}</span>
          ·&nbsp;minél magasabb, annál egyenletesebbek a jegyeid
        </p>
        <p className="slide-bottom fine">
          {s.perfectSubjects > 0
            ? `${s.perfectSubjects} tantárgyad csupa ötös.`
            : "Nincs csupa ötös tantárgyad (még)."}
        </p>
      </>
    );
  }

  /* 13 ─ rank */
  if (index === 13) {
    const rank = getRank(s, data.coverage);
    return (
      <>
        <div className={`rank-reveal rank-${rank.id}`}>
          <div className="rank-halo" aria-hidden="true">
            <Spark />
          </div>
          <h1 className="rank-title">{rank.title}</h1>
          <p className="rank-line">{rank.line}</p>
        </div>
        <div className="rank-receipt">
          {rank.reasons.map((reason) => (
            <span key={reason}>{reason}</span>
          ))}
        </div>
      </>
    );
  }

  /* 14 ─ summary */
  return (
    <>
      <h1>A kártyád.</h1>
      <div className="summary-ticket">
        <div className="ticket-top">
          <Brand />
          <span>{data.period.label}</span>
        </div>
        <div className="ticket-rank">{getRank(s, data.coverage).title}</div>
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
          {partial ? "RÉSZLEGES ADATOK" : "JEGYEM"}
          <span>↗</span>
        </div>
      </div>
      <p className="slide-bottom">Vidd tovább.</p>
    </>
  );
}

/* ─────────── MODAL ─────────── */
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
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label={title}
    >
      <div className="modal-top">
        <span className="eyebrow">{title}</span>
        <button className="icon-button" aria-label="Bezárás" onClick={onClose}>
          <IconClose />
        </button>
      </div>
      {children}
    </dialog>
  );
}

/* ─────────── APP ─────────── */
function App() {
  const [data, setData] = useState<RecapData | null>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(() =>
    new URLSearchParams(location.search).has("adatkezeles"),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [consent, setConsent] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [hidden, setHidden] = useState(document.hidden);
  const reduced = useReducedMotion();
  const touch = useRef<{ x: number; y: number } | null>(null);
  const request = useRef<AbortController | null>(null);
  const lastActivity = useRef(Date.now());
  const shareGeneration = useRef(0);

  const stats = useMemo(() => (data ? makeStats(data) : null), [data]);
  const rank = useMemo(
    () => (stats && data ? getRank(stats, data.coverage) : null),
    [stats, data],
  );
  const stopped = paused || shareOpen || privacyOpen || hidden || reduced;

  function clearSession() {
    request.current?.abort();
    request.current = null;
    shareGeneration.current++;
    setData(null);
    setBlob(null);
    setImageUrl("");
    setShareOpen(false);
    setShareBusy(false);
    setShareMessage("");
    setIndex(0);
    setPaused(false);
    setLoginOpen(false);
    setBusy(false);
    setInstitution(null);
    setConsent(false);
    setError("");
  }

  useEffect(() => {
    const visibility = () => setHidden(document.hidden);
    const activity = () => {
      lastActivity.current = Date.now();
    };
    const leave = () => clearSession();
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted) clearSession();
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", leave);
    window.addEventListener("pageshow", restored);
    window.addEventListener("pointerdown", activity, { passive: true });
    window.addEventListener("keydown", activity);
    window.addEventListener("input", activity);
    const timer = setInterval(() => {
      if (Date.now() - lastActivity.current > 15 * 60 * 1000) clearSession();
    }, 10000);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", leave);
      window.removeEventListener("pageshow", restored);
      window.removeEventListener("pointerdown", activity);
      window.removeEventListener("keydown", activity);
      window.removeEventListener("input", activity);
      clearInterval(timer);
      request.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!data || stopped || index === TOTAL_SLIDES - 1) return;
    const timer = setTimeout(
      () => setIndex((i) => Math.min(i + 1, TOTAL_SLIDES - 1)),
      10000,
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

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!institution || !consent) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const controller = new AbortController();
    const passwordInput = form.elements.namedItem(
      "password",
    ) as HTMLInputElement;
    request.current?.abort();
    request.current = controller;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/recap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institute: institution.code,
          username: String(fields.get("username")).trim(),
          password: fields.get("password"),
          consent: true,
        }),
        signal: controller.signal,
        cache: "no-store",
      });
      const result = await response.json().catch(() => {
        throw new Error("A kapcsolat megszakadt. Próbáld újra.");
      });
      if (!response.ok)
        throw new Error(result.error || "Most nem sikerült lekérni.");
      if (result.coverage?.grades === "unavailable")
        throw new Error("A KRÉTA most nem adta vissza a jegyeidet.");
      if (controller.signal.aborted) return;
      form.reset();
      setData(result);
      setIndex(0);
      setPaused(false);
      setLoginOpen(false);
      setInstitution(null);
      setConsent(false);
      lastActivity.current = Date.now();
    } catch (e) {
      if (!controller.signal.aborted)
        setError(
          e instanceof Error ? e.message : "Most nem sikerült a belépés.",
        );
    } finally {
      passwordInput.value = "";
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
      }
    }
  }

  async function openShare() {
    if (!stats || !data || !rank) return;
    const generation = ++shareGeneration.current;
    setShareOpen(true);
    setShareBusy(true);
    setBlob(null);
    setShareMessage("");
    try {
      const next = await createStory(stats, data, rank);
      if (generation === shareGeneration.current) setBlob(next);
    } catch (e) {
      if (generation === shareGeneration.current)
        setShareMessage(
          e instanceof Error ? e.message : "Nem sikerült elkészíteni a képet.",
        );
    } finally {
      if (generation === shareGeneration.current) setShareBusy(false);
    }
  }

  async function share() {
    if (!blob) return;
    const generation = shareGeneration.current;
    const file = new File([blob], "jegyem-story.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "Jegyem · a tanéved" });
        if (generation === shareGeneration.current)
          setShareMessage("Átadva a megosztófelületnek.");
      } catch (e) {
        if (
          !(e instanceof Error && e.name === "AbortError") &&
          generation === shareGeneration.current
        )
          setShareMessage("A megosztás nem sikerült. Lementsz?");
      }
    } else {
      downloadStory(blob);
      setShareMessage("Kép mentve.");
    }
  }

  const go = (direction: number) =>
    setIndex((i) => Math.max(0, Math.min(TOTAL_SLIDES - 1, i + direction)));
  const privacyLink = (
    <a
      href="?adatkezeles"
      onClick={(e) => {
        e.preventDefault();
        setPrivacyOpen(true);
      }}
    >
      Adatkezelés
    </a>
  );

  return (
    <>
      {!data ? (
        <main className="landing">
          <header className="landing-header">
            <Brand />
          </header>
          <section className="landing-main">
            <div className="landing-copy">
              <div className="eyebrow">
                <span className="live-dot" />
                ÉVKÖZI JEGYEIDBŐL
              </div>
              <h1>
                Melyik sulis
                <br />
                <em>karakter vagy?</em>
              </h1>
              <p>
                A jegyeidből kiderül.
                <br />
                30 másodperc az egész.
              </p>
              <button
                className="glow-button"
                onClick={() => {
                  setError("");
                  setLoginOpen(true);
                  lastActivity.current = Date.now();
                }}
              >
                Mutasd a rangom <Arrow />
              </button>
              <span className="landing-reassurance">
                Nem mentjük el az adataidat. Bezárás után eltűnnek.
              </span>
            </div>
            <div className="landing-art">
              <Sculpture />
            </div>
          </section>
          <footer className="landing-footer">
            <span>Nem hivatalos KRÉTA-alkalmazás.</span>
            {privacyLink}
          </footer>
        </main>
      ) : (
        <main
          className={`experience theme-${THEMES[index]}`}
          tabIndex={0}
          aria-label="A saját tanévi összefoglalód"
          onKeyDown={(event) => {
            if ((event.target as HTMLElement).closest("input, dialog")) return;
            if (event.key === "ArrowRight") go(1);
            if (event.key === "ArrowLeft") go(-1);
          }}
        >
          <div className="story-shell">
            <header className="story-header">
              <Brand />
              <div className="story-actions">
                <button
                  className="icon-button"
                  disabled={reduced}
                  onClick={() => setPaused((v) => !v)}
                  aria-label={
                    reduced ? "Kézi lapozás" : paused ? "Folytatás" : "Szünet"
                  }
                >
                  {paused || reduced ? <IconPlay /> : <IconPause />}
                </button>
                <button
                  className="icon-button"
                  onClick={clearSession}
                  aria-label="Bezárás"
                >
                  <IconClose />
                </button>
              </div>
            </header>

            <nav className="progress" aria-label="Sztorioldalak">
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

            {data.coverage.grades === "partial" && (
              <p className="coverage-note">
                Néhány időszak hiányzik. Ez részleges sztori.
              </p>
            )}

            <section
              key={index}
              className={`slide slide-${index}`}
              aria-label={`${index + 1}. oldal`}
              onTouchStart={(e) => {
                touch.current = {
                  x: e.touches[0].clientX,
                  y: e.touches[0].clientY,
                };
              }}
              onTouchEnd={(e) => {
                if (!touch.current) return;
                const dx = e.changedTouches[0].clientX - touch.current.x;
                const dy = e.changedTouches[0].clientY - touch.current.y;
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
                  Megosztom <ShareIcon />
                </button>
              ) : (
                <button className="next-button" onClick={() => go(1)}>
                  {index === 0 ? "Kezdjük" : "Tovább"} <Arrow />
                </button>
              )}
            </div>

            <div className="story-footnote">
              <span>
                {data.period.start.replaceAll("-", ".")} –{" "}
                {data.period.end.replaceAll("-", ".")}
              </span>
              {privacyLink}
            </div>
          </div>
        </main>
      )}

      {loginOpen && (
        <Modal title="BELÉPÉS" onClose={clearSession}>
          <h2>
            Lássuk
            <br />
            <em>a tanéved.</em>
          </h2>
          <p>Válaszd ki az iskolád, a többi már a naplódban van.</p>
          <form onSubmit={submit}>
            <InstitutionSearch
              value={institution}
              onChange={setInstitution}
              disabled={busy}
            />
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
                placeholder="KRÉTA-jelszó"
                required
                disabled={busy}
              />
            </label>
            <label className="consent">
              <input
                name="consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
                disabled={busy}
              />
              <span>
                Hozzájárulok az átmeneti adatkezeléshez.{" "}
                <button
                  type="button"
                  className="inline-link"
                  onClick={() => setPrivacyOpen(true)}
                >
                  Tájékoztató
                </button>
              </span>
            </label>
            <button
              className="glow-button"
              disabled={busy || !institution || !consent}
            >
              {busy ? "Összerakjuk…" : "Mutasd a karakterem"}
              {busy ? <span className="spinner" /> : <Arrow />}
            </button>
          </form>
          {busy && (
            <p className="loading-hint" role="status">
              Közvetlenül a KRÉTA-ból kérjük le a tanévedet.
            </p>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </Modal>
      )}

      {shareOpen && data && rank && (
        <Modal
          title="MEGOSZTÁS"
          onClose={() => {
            shareGeneration.current++;
            setShareOpen(false);
            setBlob(null);
            setShareBusy(false);
            setShareMessage("");
          }}
        >
          <h2>
            A kártyád.
            <br />
            <em>Vidd tovább.</em>
          </h2>
          {shareBusy ? (
            <p role="status">Készül a kártyád…</p>
          ) : imageUrl ? (
            <img
              className="share-preview"
              src={imageUrl}
              alt={`Megosztható kártya. Rang: ${rank.title}.`}
            />
          ) : null}
          <p className="share-description">Story méret</p>
          <button className="glow-button" disabled={!blob} onClick={share}>
            Megosztom <ShareIcon />
          </button>
          <button
            className="text-button save-button"
            disabled={!blob}
            onClick={() => {
              if (blob) {
                downloadStory(blob);
                setShareMessage("Kép mentése elindítva.");
              }
            }}
          >
            Inkább lementem ↓
          </button>
          {shareMessage && (
            <p className="share-description" role="status">
              {shareMessage}
            </p>
          )}
        </Modal>
      )}

      {privacyOpen && (
        <Modal title="ADATKEZELÉS" onClose={() => setPrivacyOpen(false)}>
          <PrivacyNotice />
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
