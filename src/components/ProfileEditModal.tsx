'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, School, Users, AlertCircle, Check } from 'lucide-react';
import { Profile } from '@/types';

interface ProfileEditModalProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProfile: Profile) => void;
}

export default function ProfileEditModal({
  profile,
  isOpen,
  onClose,
  onSuccess,
}: ProfileEditModalProps) {
  const [grade, setGrade] = useState<number>(profile.grade || 1);
  const [classNm, setClassNm] = useState<string>(profile.class_nm || '1');
  const [schoolName, setSchoolName] = useState<string>(profile.school_name || '대진전자통신고등학교');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const supabase = createClient();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNm.trim()) {
      setErrorMsg('반 번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const parsedClassNum = parseInt(classNm.trim(), 10) || 1;
      const payload = {
        grade: grade,
        class_num: parsedClassNum,
        school_name: schoolName.trim(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      onSuccess({
        ...data,
        name: data.name || profile.name,
        user_name: data.name || profile.name,
        class_nm: String(data.class_num),
      } as Profile);
      onClose();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setErrorMsg(err.message || '수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            개인정보 및 학적 설정
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 rounded-xl border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 학교명 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              학교명
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <School className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                readOnly
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              * 학교기본정보.csv에 등록된 학교입니다.
            </p>
          </div>

          {/* 학년 선택 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              학년
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    grade === g
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20'
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              반
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Users className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={classNm}
                onChange={(e) => setClassNm(e.target.value)}
                placeholder="예: 1, 2, 3"
                className="w-full pl-10 pr-10 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-slate-400">
                반
              </span>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{loading ? '저장 중...' : '저장하기'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
