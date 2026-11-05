import { decimal, type RecapData, type Stats } from "./stats";
import type { Rank } from "./rank";

export async function createStory(
  stats: Stats,
  data: RecapData,
  rank: Rank,
): Promise<Blob> {
  await document.fonts.ready;

  const W = 1080,
    H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Ez a böngésző most nem tud képet készíteni.");
  const ctx: CanvasRenderingContext2D = context;

  /* ─────────── BACKGROUND ─────────── */
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#eaf2ff");
  bg.addColorStop(0.45, "#d4e3ff");
  bg.addColorStop(1, "#a8c6f5");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow1 = ctx.createRadialGradient(920, 180, 40, 920, 180, 820);
  glow1.addColorStop(0, "rgba(96, 165, 250, 0.55)");
  glow1.addColorStop(0.55, "rgba(59, 130, 246, 0.18)");
  glow1.addColorStop(1, "rgba(59, 130, 246, 0)");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, W, H);

  const glow2 = ctx.createRadialGradient(120, 1750, 60, 120, 1750, 720);
  glow2.addColorStop(0, "rgba(255, 255, 255, 0.6)");
  glow2.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  // Dekoratív gyűrűk
  ctx.strokeStyle = "rgba(37, 99, 235, 0.09)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(950, 280, 130 + i * 92, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(80, 1650, 72 + i * 68, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Dekoratív pöttyök
  ctx.fillStyle = "rgba(37, 99, 235, 0.20)";
  const dots: [number, number, number][] = [
    [880, 920, 5],
    [180, 480, 4],
    [860, 1280, 4],
    [200, 1050, 3],
    [780, 320, 5],
    [320, 1780, 4],
  ];
  for (const [x, y, r] of dots) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ─────────── HELPERS ─────────── */
  function roundRect(x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function text(
    value: string,
    x: number,
    y: number,
    size: number,
    color: string,
    weight: number = 600,
    align: CanvasTextAlign = "left",
  ) {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px "Space Grotesk Variable", sans-serif`;
    ctx.textAlign = align;
    ctx.fillText(value, x, y);
    ctx.textAlign = "left";
  }

  /* ─────────── SAFE AREA ─────────── */
  const SX = 80;
  const SY = 290;
  const SW = 860;
  const bottomSafe = 1620;

  /* ─────────── TOP BAR ─────────── */
  text("jegyem", SX, SY, 52, "#0a2540", 700);
  const wmW = ctx.measureText("jegyem").width;
  text(".", SX + wmW, SY, 52, "#2563eb", 700);
  text(data.period.label, SX + SW, SY, 22, "#5a7599", 600, "right");

  /* ─────────── HERO ─────────── */
  text("ÉVKÖZI JEGYEID", SX, SY + 130, 22, "#5a7599", 600);

  const totalStr = String(stats.total);
  const heroSize =
    totalStr.length >= 5 ? 170 : totalStr.length >= 4 ? 200 : 230;
  text(totalStr, SX - 6, SY + 350, heroSize, "#0a2540", 600);

  text(
    `${stats.subjectCount} tantárgyból`,
    SX + 20,
    SY + 398,
    28,
    "#2563eb",
    500,
  );

  /* ─────────── GLASS CARD ─────────── */
  const cardX = SX - 24;
  const cardY = 720;
  const cardW = SW + 48;
  const cardH = 570;

  ctx.save();
  ctx.shadowColor = "rgba(37, 99, 235, 0.14)";
  ctx.shadowBlur = 55;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = "rgba(255, 255, 255, 0.68)";
  roundRect(cardX, cardY, cardW, cardH, 34);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 2;
  roundRect(cardX, cardY, cardW, cardH, 34);
  ctx.stroke();

  /* ─────────── STATS GRID ─────────── */
  const gridX = SX;
  const gridY = 780;
  const colW = (SW - 40) / 2;

  function statCell(label: string, value: string, col: number, row: number) {
    const x = gridX + col * (colW + 40);
    const y = gridY + row * 120;
    text(label.toUpperCase(), x, y, 17, "#5a7599", 600);
    text(value, x - 3, y + 50, 58, "#0a2540", 600);
  }

  statCell("Súlyozott átlag", decimal(stats.weightedAverage), 0, 0);
  statCell("Ötös", String(stats.counts[4]), 1, 0);
  statCell("Dolgozatjegy", String(stats.modes.written), 0, 1);
  statCell("Feleletjegy", String(stats.modes.oral), 1, 1);

  /* ─────────── DIVIDER ─────────── */
  ctx.strokeStyle = "rgba(37, 99, 235, 0.14)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(gridX, 1000);
  ctx.lineTo(gridX + SW, 1000);
  ctx.stroke();

  /* ─────────── TOP SUBJECTS ─────────── */
  text("TOP TANTÁRGYAK", gridX, 1050, 17, "#5a7599", 600);

  if (stats.topSubjects.length > 0) {
    stats.topSubjects.forEach((subj, i) => {
      const y = 1110 + i * 60;

      // Rang szám
      text(String(i + 1), gridX, y, 32, i === 0 ? "#2563eb" : "#5a7599", 700);

      // Tantárgy név
      let name = subj.name;
      if (name.length > 24) name = name.slice(0, 22) + "…";
      text(name, gridX + 50, y, 27, "#0a2540", 500);

      // Súlyozott átlag jobbra
      text(
        decimal(subj.average),
        gridX + SW,
        y,
        30,
        i === 0 ? "#2563eb" : "#0a2540",
        600,
        "right",
      );
    });
  } else {
    text("Még nincs elég jegy.", gridX, 1120, 26, "#5a7599", 500);
  }

  /* ─────────── RANK BADGE ─────────── */
  const rankBaseY = 1360;

  // Spark ikon (8 pontú csillag)
  const sparkCX = SX + 28;
  const sparkCY = rankBaseY + 44;
  const sparkR = 26;
  ctx.fillStyle = "#2563eb";
  ctx.beginPath();
  const points = 8;
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? sparkR : sparkR * 0.4;
    const px = sparkCX + Math.cos(angle) * r;
    const py = sparkCY + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  text("A SULIS KARAKTERED", SX + 72, rankBaseY + 32, 18, "#5a7599", 600);

  let titleSize = 68;
  while (titleSize > 38) {
    ctx.font = `600 ${titleSize}px "Space Grotesk Variable", sans-serif`;
    if (ctx.measureText(rank.title).width <= SW) break;
    titleSize -= 2;
  }
  text(rank.title, SX, rankBaseY + 100, titleSize, "#2563eb", 600);

  /* ─────────── FOOTER CTA ─────────── */
  const footerY = bottomSafe - 40;
  text("Te melyik vagy?", W / 2, footerY, 38, "#0a2540", 600, "center");
  text("jegyem.app", W / 2, footerY + 46, 26, "#2563eb", 600, "center");

  /* ─────────── EXPORT ─────────── */
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Nem sikerült a képkészítés.")),
      "image/png",
    ),
  );
}

export function downloadStory(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "jegyem-story.png";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
