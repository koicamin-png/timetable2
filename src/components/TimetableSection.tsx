'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, RefreshCw, BookOpen, Sparkles } from 'lucide-react';
import { TimetableItem } from '@/types';

interface TimetableSectionProps {
  grade: number | null;
  classNm: string | null;
  schoolCode: string;
  officeCode: string;
  schoolName: string;
}

// YYYYMMDD 포맷 헬퍼
function formatDateToYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

// 요일 한글 변환
function getDayKorean(d: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[d.getDay()];
}

// 주간(월~금) 일자 계산 순수 함수
function getWeekDates(baseDate: Date): Date[] {
  const current = new Date(baseDate);
  const day = current.getDay();
  // 일요일(0)은 지난주 월요일 또는 다음주 월요일로 보정
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(current);
  monday.setDate(current.getDate() + diffToMonday);

  const weekDays: Date[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDays.push(d);
  }
  return weekDays;
}

export default function TimetableSection({
  grade,
  classNm,
  schoolCode,
  officeCode,
  schoolName,
}: TimetableSectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [timetableData, setTimetableData] = useState<TimetableItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [emptyMessage, setEmptyMessage] = useState<string>('');

  const selectedDateStr = formatDateToYYYYMMDD(selectedDate);
  const weekDates = getWeekDates(selectedDate);

  const fetchTimetable = useCallback(async () => {
    if (!grade || !classNm) return;

    setLoading(true);
    setEmptyMessage('');

    try {
      const params = new URLSearchParams({
        officeCode,
        schoolCode,
        grade: grade.toString(),
        classNm: classNm.trim(),
      });

      if (viewMode === 'day') {
        params.set('date', selectedDateStr);
      } else {
        const currentWeeks = getWeekDates(selectedDate);
        const fromDate = formatDateToYYYYMMDD(currentWeeks[0]);
        const toDate = formatDateToYYYYMMDD(currentWeeks[4]);
        params.set('fromDate', fromDate);
        params.set('toDate', toDate);
      }

      const res = await fetch(`/api/timetable?${params.toString()}`);
      const json = await res.json();

      if (json.data && json.data.length > 0) {
        setTimetableData(json.data);
      } else {
        setTimetableData([]);
        setEmptyMessage(json.message || '해당 일자에는 등록된 시간표가 없습니다.');
      }
    } catch (err) {
      console.error('Failed to fetch timetable:', err);
      setTimetableData([]);
      setEmptyMessage('시간표를 불러오는 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [grade, classNm, schoolCode, officeCode, viewMode, selectedDateStr]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  // 날짜 이동 핸들러
  const handlePrevDay = () => {
    const next = new Date(selectedDate);
    if (viewMode === 'day') {
      next.setDate(next.getDate() - 1);
    } else {
      next.setDate(next.getDate() - 7);
    }
    setSelectedDate(next);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    if (viewMode === 'day') {
      next.setDate(next.getDate() + 1);
    } else {
      next.setDate(next.getDate() + 7);
    }
    setSelectedDate(next);
  };

  const handleGoToday = () => {
    setSelectedDate(new Date());
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col h-full">
      {/* 헤더 섹션 */}
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/60 bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-900/50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Calendar className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                나이스 실시간 시간표
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-9">
              {schoolName} • {grade ? `${grade}학년 ${classNm}반` : '학적 정보 확인 중'}
            </p>
          </div>

          {/* 뷰 모드 탭 (일간 / 주간) */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center">
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'day'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                일간
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'week'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                주간
              </button>
            </div>

            <button
              onClick={fetchTimetable}
              title="새로고침"
              disabled={loading}
              className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 rounded-xl transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 날짜 선택 내비게이터 */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevDay}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {viewMode === 'day' ? (
                <>
                  {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월{' '}
                  {selectedDate.getDate()}일 ({getDayKorean(selectedDate)})
                </>
              ) : (
                <>
                  {weekDates[0].getMonth() + 1}월 {weekDates[0].getDate()}일 ~{' '}
                  {weekDates[4].getMonth() + 1}월 {weekDates[4].getDate()}일 (주간)
                </>
              )}
            </span>
            <button
              onClick={handleNextDay}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleGoToday}
            className="px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition-colors border border-indigo-200/50 dark:border-indigo-800/50"
          >
            오늘로 이동
          </button>
        </div>
      </div>

      {/* 본문 콘텐츠 */}
      <div className="p-5 sm:p-6 flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-3 py-6">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/60 animate-pulse flex items-center px-4 justify-between"
              >
                <div className="w-16 h-5 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                <div className="w-32 h-5 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              </div>
            ))}
          </div>
        ) : viewMode === 'day' ? (
          /* 일간 시간표 뷰 */
          timetableData.length > 0 ? (
            <div className="space-y-2.5">
              {timetableData.map((item, idx) => (
                <div
                  key={`${item.period}-${idx}`}
                  className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 border border-slate-200/60 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800/60 transition-all duration-200"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-black text-sm flex items-center justify-center border border-slate-200/80 dark:border-slate-700 shadow-xs group-hover:scale-105 transition-transform">
                      {item.period}교시
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.subject}
                      </h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        정규 수업
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-700 dark:group-hover:bg-indigo-900/60 dark:group-hover:text-indigo-300 transition-colors">
                    출석
                  </span>
                </div>
              ))}
            </div>
          ) : (
            /* 빈 상태 안내 */
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                시간표 데이터 없음
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                {emptyMessage || '주말, 공휴일이거나 방학 기간에는 시간표가 제공되지 않습니다.'}
              </p>
            </div>
          )
        ) : (
          /* 주간 시간표 뷰 */
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {weekDates.map((d) => {
              const dateStr = formatDateToYYYYMMDD(d);
              const dayItems = timetableData.filter((item) => item.date === dateStr);
              const isToday = formatDateToYYYYMMDD(new Date()) === dateStr;

              return (
                <div
                  key={dateStr}
                  className={`rounded-2xl p-3 border flex flex-col ${
                    isToday
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800'
                      : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800'
                  }`}
                >
                  <div className="text-center pb-2.5 mb-2.5 border-b border-slate-200/60 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {getDayKorean(d)}요일
                    </span>
                    <span
                      className={`block text-[11px] font-medium mt-0.5 ${
                        isToday ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {d.getMonth() + 1}/{d.getDate()}
                    </span>
                  </div>

                  <div className="space-y-1.5 flex-1">
                    {dayItems.length > 0 ? (
                      dayItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 text-[11px]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-[10px]">
                              {item.period}교시
                            </span>
                          </div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                            {item.subject}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="h-28 flex items-center justify-center text-center text-slate-400 text-[11px]">
                        수업 없음
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
