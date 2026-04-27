import { roundMoney } from "../utils/calc.js";
import { RecordRepository } from "../repositories/record.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { startOfWeekMonday, weekWindowEnd } from "../utils/week.js";

export type LeaderboardRow = {
  id: string;
  name: string;
  weekly: number;
  sessions: number;
  isMe: boolean;
  rank: number;
  weeklyDisplay: string;
};

export class LeaderboardService {
  constructor(
    private readonly records: RecordRepository,
    private readonly users: UserRepository,
  ) {}

  weekGlobal(nowMs: number, currentUserId: number | null, limit: number): LeaderboardRow[] {
    const start = startOfWeekMonday(nowMs);
    const end = weekWindowEnd(nowMs);
    const raw = this.records.leaderboardByWeek(start, end, limit);

    return raw.map((r, idx) => {
      const weekly = roundMoney(Number(r.weekly));
      const displayName =
        r.nickname?.trim() || `用户${String(r.user_id).padStart(4, "0")}`;
      return {
        id: `u-${r.user_id}`,
        name: displayName,
        weekly,
        sessions: r.sessions,
        isMe: currentUserId != null && r.user_id === currentUserId,
        rank: idx + 1,
        weeklyDisplay: weekly.toFixed(2),
      };
    });
  }

  /** 若用户不在 Top N，可附加一行「自己」 */
  weekWithSelf(nowMs: number, userId: number, limit: number): LeaderboardRow[] {
    const rows = this.weekGlobal(nowMs, userId, limit);
    if (rows.some((r) => r.isMe)) return rows;

    const start = startOfWeekMonday(nowMs);
    const end = weekWindowEnd(nowMs);
    const stat = this.records.weekStats(userId, start, end);
    const user = this.users.findById(userId);
    const name =
      user?.nickname?.trim() || `用户${String(userId).padStart(4, "0")}`;
    const weekly = roundMoney(stat.earned);
    const meRow: LeaderboardRow = {
      id: `u-${userId}`,
      name: `${name}（我）`,
      weekly,
      sessions: stat.sessions,
      isMe: true,
      rank: rows.length + 1,
      weeklyDisplay: weekly.toFixed(2),
    };
    return [...rows, meRow];
  }
}
