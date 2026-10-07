export interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  user_name?: string | null; // 호환용
  avatar_url?: string | null;
  school_code: string;
  office_code: string;
  school_name: string;
  grade: number | null;
  class_num: number | null;
  class_nm?: string | null; // NEIS 시간표 조회 호환용
  created_at?: string;
  updated_at?: string;
}

export interface TimetableItem {
  period: string; // 교시 (1~7)
  subject: string; // 과목명 / 수업내용
  date: string; // YYYYMMDD
  grade: string;
  className: string;
}

export interface Assignment {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  description: string;
  due_date: string | null;
  status: 'pending' | 'completed' | string;
  is_completed?: boolean; // UI 호환용 (status === 'completed')
  created_at?: string;
  updated_at?: string;
}
