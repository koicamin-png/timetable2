-- ========================================================
-- 1. 프로필 테이블 (profiles)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    user_name TEXT,
    avatar_url TEXT,
    school_code TEXT NOT NULL DEFAULT '7150597',
    office_code TEXT NOT NULL DEFAULT 'C10',
    school_name TEXT NOT NULL DEFAULT '대진전자통신고등학교',
    grade INTEGER CHECK (grade >= 1 AND grade <= 3),
    class_nm TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ========================================================
-- 2. 과제 관리 테이블 (assignments)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject TEXT DEFAULT '',
    description TEXT DEFAULT '',
    due_date DATE,
    is_completed BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ========================================================
-- 3. Row Level Security (RLS) 활성화
-- ========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- 4. RLS 보안 정책 (Profiles)
-- ========================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ========================================================
-- 5. RLS 보안 정책 (Assignments)
-- ========================================================
DROP POLICY IF EXISTS "Users can view own assignments" ON public.assignments;
CREATE POLICY "Users can view own assignments"
    ON public.assignments FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own assignments" ON public.assignments;
CREATE POLICY "Users can insert own assignments"
    ON public.assignments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own assignments" ON public.assignments;
CREATE POLICY "Users can update own assignments"
    ON public.assignments FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own assignments" ON public.assignments;
CREATE POLICY "Users can delete own assignments"
    ON public.assignments FOR DELETE
    USING (auth.uid() = user_id);

-- ========================================================
-- 6. 신규 사용자 가입 시 profiles 자동 생성 트리거
-- ========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, user_name, avatar_url, school_code, office_code, school_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'user_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        '7150597',
        'C10',
        '대진전자통신고등학교'
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        user_name = COALESCE(EXCLUDED.user_name, public.profiles.user_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
