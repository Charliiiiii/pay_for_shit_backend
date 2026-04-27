/** 与前端 utils/calc.js 对齐，用于服务端校验与榜单聚合 */

const WORK_DAYS_PER_MONTH = 21.75;

export function roundMoney(n: number): number {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export function normalizeWorkHoursPerDay(h: number): number {
  const x = Number(h);
  if (!Number.isFinite(x) || x < 0.5) return 8;
  return Math.min(24, x);
}

export function hourlyWage(monthlySalary: number, workHoursPerDay: number): number {
  const s = Number(monthlySalary) || 0;
  const hours = normalizeWorkHoursPerDay(workHoursPerDay);
  if (s <= 0) return 0;
  return s / WORK_DAYS_PER_MONTH / hours;
}

export function earnedMoney(
  durationSeconds: number,
  monthlySalary: number,
  workHoursPerDay: number,
): number {
  const hw = hourlyWage(monthlySalary, workHoursPerDay);
  const sec = Math.max(0, Number(durationSeconds) || 0);
  return roundMoney((sec / 3600) * hw);
}
