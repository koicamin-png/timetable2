import { TimetableItem } from '@/types';

interface FetchTimetableParams {
  officeCode: string; // ATPT_OFCDC_SC_CODE (예: 'C10')
  schoolCode: string; // SD_SCHUL_CODE (예: '7150597')
  grade: number;      // 학년 (1~3)
  classNm: string;    // 반 (예: '1', '2')
  date?: string;      // 특정일자 YYYYMMDD
  fromDate?: string;  // 시작일자 YYYYMMDD
  toDate?: string;    // 종료일자 YYYYMMDD
}

// 현재 날짜 기준 학년도(AY) 및 학기(SEM) 계산
export function getSchoolYearAndSemester(targetDate: Date = new Date()) {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1; // 1 ~ 12

  let ay = year;
  let sem = '1';

  if (month === 1 || month === 2) {
    // 1~2월은 직전 학년도의 2학기
    ay = year - 1;
    sem = '2';
  } else if (month >= 3 && month <= 7) {
    // 3~7월: 해당 연도 1학기
    ay = year;
    sem = '1';
  } else {
    // 8~12월: 해당 연도 2학기
    ay = year;
    sem = '2';
  }

  return { ay: ay.toString(), sem };
}

export async function getTimetableFromNeis(params: FetchTimetableParams): Promise<{
  data: TimetableItem[];
  message?: string;
  isFallback?: boolean;
}> {
  const { officeCode, schoolCode, grade, classNm, date, fromDate, toDate } = params;
  const apiKey = process.env.NEXT_PUBLIC_NEIS_API_KEY || '';

  const targetDateObj = date
    ? new Date(
        parseInt(date.substring(0, 4)),
        parseInt(date.substring(4, 6)) - 1,
        parseInt(date.substring(6, 8))
      )
    : new Date();

  const { ay, sem } = getSchoolYearAndSemester(targetDateObj);

  const queryParams = new URLSearchParams({
    Type: 'json',
    pIndex: '1',
    pSize: '100',
    ATPT_OFCDC_SC_CODE: officeCode,
    SD_SCHUL_CODE: schoolCode,
    AY: ay,
    SEM: sem,
    GRADE: grade.toString(),
    CLASS_NM: classNm.trim(),
  });

  if (apiKey) {
    queryParams.set('KEY', apiKey);
  }

  if (date) {
    queryParams.set('ALL_TI_YMD', date);
  } else if (fromDate && toDate) {
    queryParams.set('TI_FROM_YMD', fromDate);
    queryParams.set('TI_TO_YMD', toDate);
  }

  const endpoint = `https://open.neis.go.kr/hub/hisTimetable?${queryParams.toString()}`;

  try {
    const res = await fetch(endpoint, { next: { revalidate: 3600 } });
    if (!res.ok) {
      throw new Error(`NEIS API HTTP error: ${res.status}`);
    }

    const json = await res.json();

    // 에러 또는 결과 없음 응답 처리
    if (json.RESULT && json.RESULT.CODE !== 'INFO-000') {
      return {
        data: [],
        message: json.RESULT.MESSAGE || '등록된 시간표 정보가 없습니다 (방학/휴일 또는 미등록).',
      };
    }

    if (!json.hisTimetable || !json.hisTimetable[1] || !json.hisTimetable[1].row) {
      return {
        data: [],
        message: '해당 일자에는 시간표가 등록되어 있지 않습니다.',
      };
    }

    const rows = json.hisTimetable[1].row;
    const items: TimetableItem[] = rows.map((r: any) => ({
      period: r.PERIO || '',
      subject: (r.ITRT_CNTNT || '').replace(/<[^>]+>/g, '').trim(), // 혹시 모를 HTML 태그 제거
      date: r.ALL_TI_YMD || '',
      grade: r.GRADE || '',
      className: r.CLASS_NM || '',
    }));

    // 교시 순으로 정렬
    items.sort((a, b) => parseInt(a.period || '0') - parseInt(b.period || '0'));

    return { data: items };
  } catch (err: any) {
    console.error('NEIS API fetch error:', err);
    return {
      data: [],
      message: '시간표 정보를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
}
