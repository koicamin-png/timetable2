import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  if (error || errorDescription) {
    console.error('OAuth Callback Error:', error, errorDescription);
    const redirectUrl = new URL('/', origin);
    redirectUrl.searchParams.set('error', errorDescription || error || '인증이 취소되었거나 실패했습니다.');
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }
    console.error('exchangeCodeForSession Error:', exchangeError);
    const redirectUrl = new URL('/', origin);
    redirectUrl.searchParams.set('error', `세션 교환 실패: ${exchangeError.message}`);
    return NextResponse.redirect(redirectUrl);
  }

  // 오류 발생 또는 코드가 없는 경우 홈으로 리다이렉트
  return NextResponse.redirect(`${origin}/?error=인증 코드가 전달되지 않았습니다.`);
}

