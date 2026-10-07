'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { School, GraduationCap, Users, AlertCircle, ArrowRight } from 'lucide-react';
import { Profile } from '@/types';

interface OnboardingModalProps {
  userId: string;
  userEmail?: string | null;
  userName?: string | null;
  onSuccess: (updatedProfile: Profile) => void;
}

export default function OnboardingModal({
  userId,
  userEmail,
  userName,
  onSuccess,
}: OnboardingModalProps) {
  const [grade, setGrade] = useState<number>(1);
  const [classNm, setClassNm] = useState<string>('1');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNm.trim()) {
      setErrorMsg('반 번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const defaultSchoolCode = process.env.NEXT_PUBLIC_DEFAULT_SCHOOL_CODE || '7150597';
      const defaultOfficeCode = process.env.NEXT_PUBLIC_DEFAULT_OFFICE_CODE || 'C10';
      const defaultSchoolName = process.env.NEXT_PUBLIC_DEFAULT_SCHOOL_NAME || '대진전자통신고등학교';

      const parsedClassNum = parseInt(classNm.trim(), 10) || 1;

      const updateData = {
        grade: grade,
        class_num: parsedClassNum,
        school_code: defaultSchoolCode,
        office_code: defaultOfficeCode,
        school_name: defaultSchoolName,
        updated_at: new Date().toISOString(),
      };

      // 1. 이미 트리거로 생성된 프로필이 있을 수 있으므로 update를 우선 시도
      let { data: profileResult, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .maybeSingle();

      // 2. 만약 기존 프로필이 없었다면 insert 실행
      if (!profileResult && !updateError) {
        const insertPayload = {
          id: userId,
          email: userEmail || null,
          name: userName || null,
          ...updateData,
        };
        const { data: insertResult, error: insertError } = await supabase
          .from('profiles')
          .insert(insertPayload)
          .select()
          .maybeSingle();

        if (insertError) {
          throw insertError;
        }
        profileResult = insertResult || insertPayload;
      } else if (updateError) {
        throw updateError;
      }

      if (profileResult) {
        const fullProfile: Profile = {
          ...profileResult,
          class_nm: String(profileResult.class_num),
          user_name: profileResult.name,
        };
        onSuccess(fullProfile);
      }
    } catch (err: any) {
      console.error('Error saving profile:', err);
      const message =
        err.message ||
        err.details ||
        err.error_description ||
        (typeof err === 'object' ? JSON.stringify(err) : String(err)) ||
        '저장 중 오류가 발생했습니다. 다시 시도해주세요.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* 상단 배너 */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white text-center relative">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">학적 정보를 등록해주세요</h2>
          <p className="text-xs text-indigo-100 mt-1">
            원활한 실시간 시간표 조회를 위해 학년과 반 설정이 필요합니다.
          </p>
        </div>

        {/* 폼 본문 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 rounded-xl border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 학교 기본 정보 안내 */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <School className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">지정 학교</p>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {process.env.NEXT_PUBLIC_DEFAULT_SCHOOL_NAME || '대진전자통신고등학교'}
                <span className="ml-1 text-[10px] text-slate-500 font-normal">(부산광역시교육청)</span>
              </p>
            </div>
          </div>

          {/* 학년 선택 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              학년 선택
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    grade === g
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20 scale-[1.02]'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                  }`}
                >
                  {g}학년
                </button>
              ))}
            </div>
          </div>

          {/* 반 입력 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              반 입력
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Users className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={classNm}
                onChange={(e) => setClassNm(e.target.value)}
                placeholder="예: 1, 2, 3 ..."
                className="w-full pl-10 pr-12 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-slate-400">
                반
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              * 숫자만 입력해주세요 (추후 상단 프로필에서 언제든 수정 가능합니다).
            </p>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block animate-pulse">등록하는 중...</span>
            ) : (
              <>
                <span>등록 완료하고 시간표 확인하기</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
