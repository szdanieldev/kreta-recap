import { decimal, type Stats, type RecapData } from './stats';
export type Rank = { id: string; title: string; line: string; symbol: string; reasons: string[]; provisional: boolean };
export const rankNames = ['Stréber deluxe', 'Ötösmágnes', 'Kombókirály', 'Plot twist: feltámadás', 'Csak melegedni ültem be', 'Kettesből diplomáznék', 'Energiatakarékos mód', 'Szelektív zseni', 'Dumával megoldom', 'Dolgozatdominátor', 'Házi legenda', 'Feladatlavina túlélője', 'Naplómaratonista', 'Mindenből hozom', 'Csendes erő', 'Saját tempóban', 'Turbófokozat'];
export function getRank(s: Stats, coverage: RecapData['coverage']): Rank {
  const base = { reasons: [`${s.total} évközi jegy · ${decimal(s.weightedAverage)} súlyozott átlag`, `${s.fivePercent}% ötös · ${s.bestStreak} ötös a leghosszabb sorozatban`], provisional: false };
  const result = (id: string, title: string, line: string, symbol: string): Rank => ({ ...base, id, title, line, symbol });
  if (s.total < 8 || coverage.grades !== 'complete') return { ...result('loading', 'A sztori még alakul', s.total < 8 ? 'Nyolc jegytől rajzolódik ki a karaktered.' : 'Hiányzó adatokból nem ragasztunk rád címkét.', '↗'), provisional: true };
  const average = s.weightedAverage ?? 0, low = (s.counts[0] + s.counts[1]) / s.total;
  const meanOf = (pattern: RegExp) => { const list = s.grades.filter(g => pattern.test(JSON.stringify(g.Mod ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())); return list.length ? list.reduce((sum,g)=>sum+Number(g.SzamErtek),0)/list.length : 0; };
  const subjects = s.ranking.filter(v => v.count >= 3);
  const spread = subjects.length > 1 ? Math.max(...subjects.map(v=>v.average)) - Math.min(...subjects.map(v=>v.average)) : 0;
  if (average >= 4.8 && s.fivePercent >= 80) return result('scholar', rankNames[0], 'Az ötös nálad nem alkalom. Alapbeállítás.', '✳');
  if (average >= 4.5 && s.fivePercent >= 65) return result('magnet', rankNames[1], 'Valahogy mindig hozzád kerülnek az ötösök.', '✦');
  if ((s.trend ?? 0) >= .6) return result('comeback', rankNames[3], 'A második felvonásban szintet léptél.', '↗');
  if (s.bestStreak >= 5 && average >= 4) return result('combo', rankNames[2], 'Nem egy ötös. Egy egész sorozat.', '×');
  if (average <= 2.25 && low >= .5) return result('warm', rankNames[4], 'Az idei pontok még váratnak magukra. A következő fejezet a tiéd.', '≈');
  if (average < 2.75) return result('survivor', rankNames[5], 'A jegyek alapján a minimum környékén ment a játék.', 'Ⅱ');
  if (spread >= 1.6 && (s.best?.average ?? 0) >= 4.5) return result('selective', rankNames[7], 'Van, amire nagyon ráéreztél. És van a többi.', '✧');
  if (s.modes.oral / s.total >= .3 && meanOf(/felel|szobeli/) >= 4) return result('speaker', rankNames[8], 'A szóbeli jegyeid beszélnek helyetted.', '”');
  if (s.modes.written / s.total >= .5 && meanOf(/dolgozat|irasbeli|teszt|temazaro/) >= 4) return result('writer', rankNames[9], 'Papíron is hozod a formád.', '↗');
  if (s.modes.homework / s.total >= .2 && meanOf(/hazi/) >= 4) return result('homework', rankNames[10], 'A házira kapott jegyeid külön fejezetet érnek.', '⌂');
  if (coverage.homeworks === 'complete' && s.homeworks >= 40 && s.total >= 20) return { ...result('avalanche', rankNames[11], 'Sok kiadott házi, sok jegy. Nem volt üres a menetrend.', '≋'), reasons: [base.reasons[0], `${s.homeworks} kiadott házi · ${s.modes.written} dolgozatjegy`] };
  if (s.total >= 20 && (s.busiest?.[1] ?? 0) / s.total >= .5) return { ...result('turbo', rankNames[16], 'A jegyeid nagy része egyetlen hónapra sűrűsödött.', '↗'), reasons: [base.reasons[0], `${s.busiest?.[1]} jegy a legsűrűbb hónapodban`] };
  if (s.total >= 80) return result('marathon', rankNames[12], 'A naplódban bőven volt mit visszanézni.', '∞');
  if (subjects.length >= 5 && spread <= .65 && average >= 3.8) return result('balanced', rankNames[13], 'Több pályán is egyenletesen hozod.', '≡');
  if (average >= 3.8) return result('quiet', rankNames[14], 'A számok mögött stabil teljesítmény áll.', '◇');
  if (average < 3.25) return result('eco', rankNames[6], 'A jegyeid alapján visszafogott fokozaton futott a tanév.', '◌');
  return result('own', rankNames[15], 'Nem sablonból tanulsz. Ez a te ritmusod.', '∿');
}
