/** 与前端 storage.js 的 startOfWeek / isInWeek 对齐：自然周从周一开始 */

export function startOfWeekMonday(ts: number): number {
  const d = new Date(ts);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** 与前端 isInWeek 上界一致：<= now + 1 */
export function weekWindowEnd(nowMs: number): number {
  return nowMs + 1;
}
