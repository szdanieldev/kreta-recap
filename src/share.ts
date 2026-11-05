import { decimal, type RecapData, type Stats } from "./stats";
export async function createStory(
  stats: Stats,
  data: RecapData,
  demo: boolean,
): Promise<Blob> {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("A böngésző nem támogatja a képkészítést.");
  const ctx: CanvasRenderingContext2D = context;
  ctx.fillStyle = "#032d30";
  ctx.fillRect(0, 0, 1080, 1920);
  const glow = ctx.createRadialGradient(860, 700, 20, 620, 850, 1000);
  glow.addColorStop(0, "#107f79");
  glow.addColorStop(1, "#032d30");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1080, 1920);
  ctx.strokeStyle = "#5af3d4";
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.ellipse(900, 300, 180 + i * 45, 300 + i * 55, 0.6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  function text(
    value: string,
    x: number,
    y: number,
    size: number,
    color = "#f4f5e9",
    weight = 700,
  ) {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px "Space Grotesk Variable", sans-serif`;
    ctx.fillText(value, x, y);
  }
  function fitted(
    value: string,
    x: number,
    y: number,
    size: number,
    width: number,
    color?: string,
  ) {
    while (size > 25) {
      ctx.font = `700 ${size}px "Space Grotesk Variable", sans-serif`;
      if (ctx.measureText(value).width <= width) break;
      size--;
    }
    text(value, x, y, size, color);
  }
  text("kréta recap", 85, 130, 42);
  text(
    `${data.period.label}  /  EDDIG${demo ? "  /  DEMÓ" : ""}`,
    85,
    195,
    25,
    "#93bdb3",
    500,
  );
  text("Ez volt az én", 80, 370, 85);
  text("tanévritmusom.", 80, 465, 85, "#5af3d4");
  text(String(stats.total), 70, 760, 255, "#5af3d4");
  text("ÉVKÖZI JEGY", 85, 825, 29, "#b4cfc4", 500);
  ctx.strokeStyle = "#57887e";
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(85, 900);
  ctx.lineTo(995, 900);
  ctx.stroke();
  ctx.globalAlpha = 1;
  text(decimal(stats.weightedAverage), 85, 1040, 103);
  text(String(stats.counts[4]), 600, 1040, 103);
  text("SÚLYOZOTT ÁTLAG", 85, 1098, 24, "#b4cfc4", 500);
  text("ÖTÖS", 600, 1098, 24, "#b4cfc4", 500);
  text(String(stats.modes.written), 85, 1250, 103);
  text(String(stats.modes.oral), 600, 1250, 103);
  text("DOLGOZATJEGY", 85, 1308, 24, "#b4cfc4", 500);
  text("FELELETJEGY", 600, 1308, 24, "#b4cfc4", 500);
  if (stats.best) {
    text("AMIBEN A LEGERŐSEBB VOLTAM", 85, 1455, 24, "#b4cfc4", 500);
    fitted(stats.best.name, 85, 1535, 65, 910, "#5af3d4");
  } else {
    text("MINDEN JEGY EGY TÖRTÉNET.", 85, 1510, 32, "#5af3d4");
  }
  fitted(
    `${data.period.start.replaceAll("-", ".")} — ${data.period.end.replaceAll("-", ".")}`,
    85,
    1730,
    26,
    910,
    "#b4cfc4",
  );
  const partial = data.coverage.grades !== "complete";
  text(
    partial ? "RÉSZLEGES ADATOKBÓL KÉSZÜLT" : "AZ ÉN SZTORIM. AZ ÉN TEMPÓM.",
    85,
    1790,
    24,
    "#b4cfc4",
    500,
  );
  text("KRÉTA RECAP  ↗", 85, 1850, 23, "#5af3d4");
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Nem sikerült elkészíteni a képet.")),
      "image/png",
    ),
  );
}
export function downloadStory(blob: Blob) {
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = "kreta-recap-story.png";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
