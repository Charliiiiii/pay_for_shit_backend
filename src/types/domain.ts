export type UserRow = {
  id: number;
  openid: string;
  unionid: string | null;
  nickname: string | null;
  created_at: number;
  updated_at: number;
};

export type UserSettingsRow = {
  user_id: number;
  monthly_salary: number;
  work_days_per_month: number;
  work_hours_per_day: number;
  updated_at: number;
};

export type PoopRecordRow = {
  id: number;
  user_id: number;
  client_id: string | null;
  start_time: number;
  end_time: number;
  duration_seconds: number;
  earned_money: number;
  created_at: number;
};

/** 自定义 access token payload（避免与 jwt.JwtPayload.sub 的 string 语义冲突） */
export type AccessTokenPayload = {
  userId: number;
  iat?: number;
  exp?: number;
};
