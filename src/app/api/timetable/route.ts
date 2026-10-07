import { NextResponse } from 'next/server';
import { getTimetableFromNeis } from '@/lib/neis';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const officeCode = searchParams.get('officeCode') || process.env.NEXT_PUBLIC_DEFAULT_OFFICE_CODE || 'C10';
  const schoolCode = searchParams.get('schoolCode') || process.env.NEXT_PUBLIC_DEFAULT_SCHOOL_CODE || '7150597';
  const gradeStr = searchParams.get('grade');
  const classNm = searchParams.get('classNm');
  const date = searchParams.get('date') || undefined;
  const fromDate = searchParams.get('fromDate') || undefined;
  const toDate = searchParams.get('toDate') || undefined;

  if (!gradeStr || !classNm) {
    return NextResponse.json(
      { error: '학년과 반 정보가 필요합니다.' },
      { status: 400 }
    );
  }

  const grade = parseInt(gradeStr);
  if (isNaN(grade) || grade < 1 || grade > 3) {
    return NextResponse.json(
      { error: '유효한 학년(1~3)을 입력해주세요.' },
      { status: 400 }
    );
  }

  const result = await getTimetableFromNeis({
    officeCode,
    schoolCode,
    grade,
    classNm,
    date,
    fromDate,
    toDate,
  });

  return NextResponse.json(result);
}
