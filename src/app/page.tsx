'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  School,
  Calendar,
  CheckCircle,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Info,
  Layers,
  Key
} from 'lucide-react';

function GithubIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

function KakaoIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C6.477 3 2 6.477 2 10.767c0 2.767 1.877 5.19 4.707 6.557l-.957 3.518a.49.49 0 0 0 .61.603l4.238-2.793c.456.046.924.07 1.402.07 5.523 0 10-3.477 10-7.767C22 6.477 17.523 3 12 3z" />
    </svg>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isEnvConfigured, setIsEnvConfigured] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    // URL에 전달된 OAuth 콜백 오류 확인
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get('error');
    if (urlError) {
      setErrorMsg(decodeURIComponent(urlError));
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('your-project')) {
      setIsEnvConfigured(false);
    }

    // 이미 로그인된 사용자인지 체크
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push('/dashboard');
        }
      } catch (e) {
        // 무시
      }
    };
    checkAuth();
  }, [supabase, router]);

  const handleGitHubLogin = async () => {
    if (!isEnvConfigured) {
      setErrorMsg('.env.local 파일에 Supabase URL과 Anon Key를 먼저 설정해주세요.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || '로그인 요청 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    if (!isEnvConfigured) {
      setErrorMsg('.env.local 파일에 Supabase URL과 Anon Key를 먼저 설정해주세요.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Kakao login error:', err);
      setErrorMsg(err.message || '카카오 로그인 요청 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* 상단 네비게이션 */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <School className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                에듀보드 (EduBoard)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-indigo-400 border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              대진전자통신고등학교
            </span>
          </div>
        </div>
      </header>

      {/* 히어로 본문 */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 flex flex-col items-center text-center justify-center">
        {/* 상단 배지 */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-semibold mb-8 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>NEIS 교육정보 개방포털 공공데이터 실시간 연동</span>
        </div>

        {/* 메인 타이틀 */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-3xl leading-[1.15]">
          학교 시간표와 과제를 <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
            가장 스마트하게
          </span>{' '}
          관리하세요
        </h1>

        {/* 서브 설명 */}
        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          카카오 또는 깃허브 계정으로 원클릭 로그인하고, 학년과 반만 등록하면 오늘의 시간표와 주간 수업 일정이 자동으로 펼쳐집니다. 개인 과제도 마감일과 함께 체계적으로 추적하세요.
        </p>

        {/* 에러 메시지 알림 */}
        {errorMsg && (
          <div className="mt-6 p-4 max-w-md w-full bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-2xl flex items-center gap-2.5 text-left">
            <Info className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 로그인 액션 버튼 */}
        <div className="mt-10 flex flex-col gap-3 w-full max-w-sm justify-center">
          {/* 카카오 계정 로그인 */}
          <button
            onClick={handleKakaoLogin}
            disabled={loading}
            className="w-full py-3.5 px-6 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-bold rounded-2xl shadow-xl shadow-amber-500/10 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
          >
            <KakaoIcon className="w-5 h-5 text-[#191919]" />
            <span className="text-sm font-bold">
              {loading ? '인증 진행 중...' : '카카오 계정으로 계속하기'}
            </span>
            <ArrowRight className="w-4 h-4 text-[#191919]/60 ml-auto" />
          </button>

          {/* GitHub 계정 로그인 */}
          <button
            onClick={handleGitHubLogin}
            disabled={loading}
            className="w-full py-3.5 px-6 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-white font-bold rounded-2xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
          >
            <GithubIcon className="w-5 h-5" />
            <span className="text-sm font-bold">
              {loading ? '인증 진행 중...' : 'GitHub 계정으로 계속하기'}
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
          </button>
        </div>

        {/* 환경변수 안내 박스 (미설정 시 친절하게 표시) */}
        {!isEnvConfigured && (
          <div className="mt-8 p-5 max-w-lg w-full bg-slate-800/80 border border-amber-500/30 rounded-2xl text-left backdrop-blur-sm">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-2">
              <Key className="w-4 h-4" />
              <span>Supabase 환경변수 설정 가이드</span>
            </div>
            <p className="text-[12px] text-slate-300 leading-relaxed mb-3">
              현재 <code className="px-1.5 py-0.5 bg-slate-900 rounded text-indigo-300">.env.local</code> 파일이 기본값 상태입니다. 실제 GitHub 로그인을 사용하시려면 아래 단계를 완료해주세요:
            </p>
            <ol className="list-decimal list-inside text-[11px] text-slate-400 space-y-1.5">
              <li>
                <strong className="text-slate-300">Supabase 프로젝트 생성</strong> 후 <code>Project Settings &gt; API</code>에서 URL과 Anon Key 복사
              </li>
              <li>
                <code>.env.local</code> 파일의 <code className="text-indigo-300">NEXT_PUBLIC_SUPABASE_URL</code> 및 <code className="text-indigo-300">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>에 붙여넣기
              </li>
              <li>
                Supabase SQL Editor에서 <code className="text-indigo-300">supabase/schema.sql</code> 내용 실행
              </li>
              <li>
                Supabase <code>Authentication &gt; Providers</code>에서 GitHub 활성화
              </li>
            </ol>
          </div>
        )}

        {/* 기능 하이라이트 3단 카드 */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="p-6 rounded-3xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <GithubIcon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white">GitHub OAuth 원클릭 인증</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              별도의 회원가입 없이 기존 GitHub 계정으로 빠르고 안전하게 로그인합니다. 세션은 자동으로 유지됩니다.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white">나이스 실시간 시간표 연동</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              대진전자통신고등학교의 학년/반 공공데이터 시간표를 실시간 동기화하여 일간/주간 단위로 깔끔하게 시각화합니다.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white">개인화된 과제 일정 관리</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Row Level Security(RLS)가 적용된 PostgreSQL 데이터베이스로 본인만의 과제와 마감일을 안전하게 관리합니다.
            </p>
          </div>
        </div>
      </main>

      {/* 하단 푸터 */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        <p>© 2026 EduBoard. 대진전자통신고등학교 NEIS 공공데이터 시간표 연동 시스템.</p>
      </footer>
    </div>
  );
}
