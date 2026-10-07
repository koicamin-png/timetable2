'use client';

import { Profile } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { School, Settings, LogOut, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface NavbarProps {
  profile: Profile | null;
  onOpenEditProfile: () => void;
}

export default function Navbar({ profile, onOpenEditProfile }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* 로고 및 학교 정보 */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <School className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                에듀보드
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                NEIS 연동
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {profile?.school_name || '대진전자통신고등학교'}
            </p>
          </div>
        </div>

        {/* 사용자 정보 및 액션 버튼 */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {profile?.grade && profile?.class_nm ? (
            <div className="hidden sm:flex items-center px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              <span className="text-indigo-600 dark:text-indigo-400 mr-1.5">●</span>
              {profile.grade}학년 {profile.class_nm}반
            </div>
          ) : (
            <div className="hidden sm:flex items-center px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-xs font-semibold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              학적 정보 미등록
            </div>
          )}

          {/* 프로필 수정 버튼 */}
          <button
            onClick={onOpenEditProfile}
            title="개인정보 및 학년/반 수정"
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">학적 정보 수정</span>
          </button>

          {/* 프로필 아바타 & 닉네임 */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.user_name || '프로필'}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-200 dark:border-indigo-800">
                {(profile?.user_name || profile?.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[90px] truncate hidden md:inline">
              {profile?.name || profile?.user_name || '학생'}
            </span>
          </div>

          {/* 로그아웃 버튼 */}
          <button
            onClick={handleSignOut}
            title="로그아웃"
            className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
