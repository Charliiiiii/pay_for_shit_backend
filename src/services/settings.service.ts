import { roundMoney, normalizeWorkHoursPerDay, hourlyWage } from "../utils/calc.js";
import { SettingsRepository } from "../repositories/settings.repository.js";
import { NotFoundError } from "../utils/errors.js";

export type SettingsDto = {
  monthlySalary: number;
  workDaysPerMonth: number;
  workHoursPerDay: number;
  hourlyWage: number;
};

export class SettingsService {
  constructor(private readonly settingsRepo: SettingsRepository) {}

  getForUser(userId: number): SettingsDto {
    const row = this.settingsRepo.ensureDefaults(userId);
    return this.toDto(row);
  }

  updateForUser(
    userId: number,
    input: { monthlySalary: number; workDaysPerMonth?: number; workHoursPerDay?: number },
  ): SettingsDto {
    const current = this.settingsRepo.getByUserId(userId);
    if (!current) throw new NotFoundError("用户设置不存在");

    const workDaysPerMonth =
      input.workDaysPerMonth != null && Number.isFinite(input.workDaysPerMonth)
        ? Math.max(1, input.workDaysPerMonth)
        : current.work_days_per_month;

    const workHoursPerDay =
      input.workHoursPerDay != null && Number.isFinite(input.workHoursPerDay)
        ? normalizeWorkHoursPerDay(input.workHoursPerDay)
        : normalizeWorkHoursPerDay(current.work_hours_per_day);

    const row = this.settingsRepo.upsert(userId, {
      monthly_salary: input.monthlySalary,
      work_days_per_month: workDaysPerMonth,
      work_hours_per_day: workHoursPerDay,
    });
    return this.toDto(row);
  }

  private toDto(row: {
    monthly_salary: number;
    work_days_per_month: number;
    work_hours_per_day: number;
  }): SettingsDto {
    const workHoursPerDay = normalizeWorkHoursPerDay(row.work_hours_per_day);
    return {
      monthlySalary: roundMoney(row.monthly_salary),
      workDaysPerMonth: row.work_days_per_month,
      workHoursPerDay,
      hourlyWage: roundMoney(hourlyWage(row.monthly_salary, workHoursPerDay)),
    };
  }
}
