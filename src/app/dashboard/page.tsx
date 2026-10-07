'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';
import Navbar from '@/components/Navbar';
import OnboardingModal from '@/components/OnboardingModal';
import ProfileEditModal from '@/components/ProfileEditModal';
import TimetableSection from '@/components/TimetableSection';
import AssignmentSection from '@/components/AssignmentSection';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showEditProfile, setShowEditProfile] = useState<boolean>(false);
  const [configError, setConfigError] = useState<string>('');

  const loadUserData = useCallback(async () => {
    setLoading(true);
    setConfigError('');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('your-project')) {
      setConfigError(
        'Supabase 환경변수가 설정되지 않았습니다. .env.local 파일에 NEXT_PUBLIC_SUPABASE_URL 및 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정해주세요.'
      );
      setLoading(false);
      return;
    }

    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        router.push('/');
        return;
      }

      setUser(authUser);

      // 프로필 테이블 조회 (초기 미등록 시 406 방지를 위해 maybeSingle 사용)
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profileErr) {
        console.error('Error fetching profile:', profileErr);
      }

      if (!profileData || !profileData.grade || !profileData.class_num) {
        // 학적 정보가 미등록된 경우 온보딩 모달 표시
        setShowOnboarding(true);
        if (profileData) {
          setProfile({
            ...profileData,
            name: profileData.name || authUser.user_metadata?.full_name || '사용자',
            user_name: profileData.name || authUser.user_metadata?.full_name || '사용자',
            class_nm: profileData.class_num ? String(profileData.class_num) : null,
          });
        } else {
          // 기본 프로필 세팅
          setProfile({
            id: authUser.id,
            email: authUser.email || null,
            name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '사용자',
            user_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '사용자',
            school_code: process.env.NEXT_PUBLIC_DEFAULT_SCHOOL_CODE || '7150597',
            office_code: process.env.NEXT_PUBLIC_DEFAULT_OFFICE_CODE || 'C10',
            school_name: process.env.NEXT_PUBLIC_DEFAULT_SCHOOL_NAME || '대진전자통신고등학교',
            grade: null,
            class_num: null,
            class_nm: null,
          });
        }
      } else {
        setProfile({
          ...profileData,
          name: profileData.name || authUser.user_metadata?.full_name || '사용자',
          user_name: profileData.name || authUser.user_metadata?.full_name || '사용자',
          class_nm: String(profileData.class_num),
        });
        setShowOnboarding(false);
      }
    } catch (err: any) {
      console.error('Unexpected error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleOnboardingSuccess = (updated: Profile) => {
    setProfile(updated);
    setShowOnboarding(false);
  };

  const handleProfileUpdateSuccess = (updated: Profile) => {
    setProfile(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          대시보드를 불러오는 중입니다...
        </p>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-6 rounded-3xl border border-rose-200 dark:border-rose-900 shadow-xl text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            설정 안내
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            {configError}
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col font-sans">
      {/* 상단 네비게이션 */}
      <Navbar
        profile={profile}
        onOpenEditProfile={() => setShowEditProfile(true)}
      />

      {/* 메인 대시보드 그리드 영역 */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 좌측/중앙: 나이스 실시간 시간표 (7컬럼) */}
          <div className="lg:col-span-7 h-[760px]">
            <TimetableSection
              grade={profile?.grade || null}
              classNm={profile?.class_nm || null}
              schoolCode={profile?.school_code || process.env.NEXT_PUBLIC_DEFAULT_SCHOOL_CODE || '7150597'}
              officeCode={profile?.office_code || process.env.NEXT_PUBLIC_DEFAULT_OFFICE_CODE || 'C10'}
              schoolName={profile?.school_name || process.env.NEXT_PUBLIC_DEFAULT_SCHOOL_NAME || '대진전자통신고등학교'}
            />
          </div>

          {/* 우측: 내 과제 및 일정 관리 (5컬럼) */}
          <div className="lg:col-span-5 h-[760px]">
            {user && <AssignmentSection userId={user.id} />}
          </div>
        </div>
      </main>

      {/* 학적 정보 온보딩 강제 모달 (미등록 시) */}
      {showOnboarding && user && (
        <OnboardingModal
          userId={user.id}
          userEmail={user.email}
          userName={user.user_metadata?.full_name || user.user_metadata?.user_name}
          onSuccess={handleOnboardingSuccess}
        />
      )}

      {/* 개인정보 수정 모달 */}
      {profile && (
        <ProfileEditModal
          profile={profile}
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          onSuccess={handleProfileUpdateSuccess}
        />
      )}
    </div>
  );
}
