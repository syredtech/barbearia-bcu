export function generateSlots(
  start: string,
  end: string,
  duration: number,
  breakStart?: string | null,
  breakEnd?: string | null,
  break2Start?: string | null,
  break2End?: string | null,
): string[] {
  const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const toStr = (min: number) =>
    `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

  const startMin = toMin(start);
  const endMin   = toMin(end);
  const bsMin    = breakStart  ? toMin(breakStart)  : null;
  const beMin    = breakEnd    ? toMin(breakEnd)    : null;
  const bs2Min   = break2Start ? toMin(break2Start) : null;
  const be2Min   = break2End   ? toMin(break2End)   : null;

  const slots: string[] = [];
  let cur = startMin;
  while (cur + duration <= endMin) {
    if (bsMin !== null && beMin !== null && cur >= bsMin && cur < beMin) { cur = beMin; continue; }
    if (bs2Min !== null && be2Min !== null && cur >= bs2Min && cur < be2Min) { cur = be2Min; continue; }
    slots.push(toStr(cur));
    cur += duration;
  }
  return slots;
}
