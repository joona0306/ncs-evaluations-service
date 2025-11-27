-- ============================================================================
-- 통합 스키마 마이그레이션 파일
-- ============================================================================
-- 이 파일은 모든 마이그레이션을 논리적으로 그룹화하여 통합한 것입니다.
-- 새 프로젝트에서는 이 파일 하나로 전체 스키마를 구축할 수 있습니다.
-- 
-- ⚠️ 주의사항:
-- - 기존 프로젝트에서는 이미 적용된 마이그레이션이므로 이 파일을 그대로 실행하지 마세요.
-- - 필요한 부분만 선택하여 실행하거나, 새로운 마이그레이션 파일을 생성하세요.
-- 
-- 실행 방법:
-- 1. Supabase 대시보드 > SQL Editor로 이동
-- 2. 이 파일의 전체 내용을 복사하여 실행
-- 3. 또는 필요한 섹션만 선택하여 실행
-- ============================================================================

-- ============================================================================
-- 1. 확장 및 타입 정의
-- ============================================================================

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum 타입 생성
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');
CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'withdrawn');
CREATE TYPE evaluation_status AS ENUM ('draft', 'submitted', 'confirmed');
CREATE TYPE signature_type AS ENUM ('canvas', 'image');
CREATE TYPE signer_role AS ENUM ('teacher', 'student', 'admin');
CREATE TYPE difficulty_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE schedule_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE submission_type AS ENUM ('image', 'url');

-- ============================================================================
-- 2. 기본 테이블 생성
-- ============================================================================

-- 프로필 테이블
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'student',
  phone TEXT,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 훈련과정 테이블
CREATE TABLE public.training_courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 훈련과정-교사 관계 테이블
CREATE TABLE public.course_teachers (
  course_id UUID REFERENCES public.training_courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (course_id, teacher_id)
);

-- 훈련과정-학생 관계 테이블
CREATE TABLE public.course_students (
  course_id UUID REFERENCES public.training_courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status enrollment_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (course_id, student_id)
);

-- 능력단위 테이블
CREATE TABLE public.competency_units (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID REFERENCES public.training_courses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  evaluation_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(course_id, code)
);

-- 능력단위요소 테이블
CREATE TABLE public.competency_elements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  competency_unit_id UUID REFERENCES public.competency_units(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(competency_unit_id, code)
);

-- 수행준거 테이블
CREATE TABLE public.performance_criteria (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  competency_element_id UUID REFERENCES public.competency_elements(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  difficulty difficulty_level NOT NULL DEFAULT 'medium',
  max_score INTEGER NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(competency_element_id, code)
);

-- 평가일정 테이블
CREATE TABLE public.evaluation_schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  competency_unit_id UUID REFERENCES public.competency_units(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status schedule_status NOT NULL DEFAULT 'scheduled',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 과제물 제출 테이블
CREATE TABLE public.submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  evaluation_schedule_id UUID REFERENCES public.evaluation_schedules(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  competency_unit_id UUID REFERENCES public.competency_units(id) ON DELETE CASCADE NOT NULL,
  submission_type submission_type NOT NULL,
  file_url TEXT,
  url TEXT,
  file_name TEXT,
  file_size INTEGER,
  comments TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(evaluation_schedule_id, student_id),
  CONSTRAINT valid_submission CHECK (
    (submission_type = 'image' AND file_url IS NOT NULL) OR
    (submission_type = 'url' AND url IS NOT NULL)
  )
);

-- 평가 테이블
CREATE TABLE public.evaluations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  competency_unit_id UUID REFERENCES public.competency_units(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  comments TEXT,
  status evaluation_status NOT NULL DEFAULT 'draft',
  evaluated_at TIMESTAMP WITH TIME ZONE,
  submission_id UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
  total_score DECIMAL(5,2),
  raw_total_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(competency_unit_id, student_id)
);

-- 평가 점수 상세 테이블 (수행준거별)
CREATE TABLE public.evaluation_criteria_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE CASCADE NOT NULL,
  criteria_id UUID REFERENCES public.performance_criteria(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(evaluation_id, criteria_id),
  CONSTRAINT valid_criteria_score CHECK (score >= 0)
);

-- 서명 테이블
CREATE TABLE public.signatures (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE CASCADE NOT NULL,
  signer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  signer_role signer_role NOT NULL,
  signature_type signature_type NOT NULL,
  signature_data TEXT NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- 3. 인덱스 생성
-- ============================================================================

-- 프로필 인덱스
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- 훈련과정 관계 인덱스
CREATE INDEX idx_course_teachers_teacher ON public.course_teachers(teacher_id);
CREATE INDEX idx_course_teachers_course ON public.course_teachers(course_id);
CREATE INDEX idx_course_students_student ON public.course_students(student_id);
CREATE INDEX idx_course_students_course ON public.course_students(course_id);
CREATE INDEX idx_course_students_status ON public.course_students(status);

-- 능력단위 인덱스
CREATE INDEX idx_competency_units_course ON public.competency_units(course_id);
CREATE INDEX idx_competency_elements_unit ON public.competency_elements(competency_unit_id);
CREATE INDEX idx_performance_criteria_element ON public.performance_criteria(competency_element_id);
CREATE INDEX idx_performance_criteria_difficulty ON public.performance_criteria(difficulty);

-- 평가일정 인덱스
CREATE INDEX idx_evaluation_schedules_unit ON public.evaluation_schedules(competency_unit_id);
CREATE INDEX idx_evaluation_schedules_status ON public.evaluation_schedules(status);
CREATE INDEX idx_evaluation_schedules_dates ON public.evaluation_schedules(start_date, end_date);

-- 과제물 인덱스
CREATE INDEX idx_submissions_schedule ON public.submissions(evaluation_schedule_id);
CREATE INDEX idx_submissions_student ON public.submissions(student_id);
CREATE INDEX idx_submissions_unit ON public.submissions(competency_unit_id);

-- 평가 인덱스
CREATE INDEX idx_evaluations_student ON public.evaluations(student_id);
CREATE INDEX idx_evaluations_teacher ON public.evaluations(teacher_id);
CREATE INDEX idx_evaluations_competency_unit ON public.evaluations(competency_unit_id);
CREATE INDEX idx_evaluations_status ON public.evaluations(status);
CREATE INDEX idx_evaluations_submission ON public.evaluations(submission_id);
CREATE INDEX idx_evaluation_criteria_scores_evaluation ON public.evaluation_criteria_scores(evaluation_id);
CREATE INDEX idx_evaluation_criteria_scores_criteria ON public.evaluation_criteria_scores(criteria_id);

-- 서명 인덱스
CREATE INDEX idx_signatures_evaluation ON public.signatures(evaluation_id);
CREATE INDEX idx_signatures_signer ON public.signatures(signer_id);

-- ============================================================================
-- 4. 함수 및 트리거
-- ============================================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_courses_updated_at BEFORE UPDATE ON public.training_courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_competency_units_updated_at BEFORE UPDATE ON public.competency_units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_competency_elements_updated_at BEFORE UPDATE ON public.competency_elements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_criteria_updated_at BEFORE UPDATE ON public.performance_criteria
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evaluation_schedules_updated_at BEFORE UPDATE ON public.evaluation_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON public.evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evaluation_criteria_scores_updated_at BEFORE UPDATE ON public.evaluation_criteria_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 사용자 생성 시 프로필 자동 생성 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_value user_role;
  user_full_name TEXT;
  user_phone TEXT;
BEGIN
  user_role_value := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'student'::user_role
  );
  
  IF user_role_value = 'admin' THEN
    RETURN NEW;
  END IF;
  
  user_full_name := NEW.raw_user_meta_data->>'full_name';
  user_phone := NEW.raw_user_meta_data->>'phone';
  
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (NEW.id, NEW.email, user_full_name, user_phone, user_role_value)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 관리자 프로필 생성 방지 함수
CREATE OR REPLACE FUNCTION prevent_admin_profile_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.role = 'admin' AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION '관리자 계정은 회원가입을 통해 생성할 수 없습니다. 관리자 계정은 Supabase 대시보드에서 수동으로 생성해야 합니다.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_admin_role_on_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_admin_profile_creation();

-- 관리자 역할 변경 방지 함수
CREATE OR REPLACE FUNCTION prevent_admin_role_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.role = 'admin' AND OLD.role != 'admin' AND auth.uid() IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION '관리자 역할로 변경할 권한이 없습니다.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_admin_role_on_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_admin_role_update();

-- 평가 점수 계산 함수
CREATE OR REPLACE FUNCTION calculate_evaluation_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  raw_total INTEGER;
  max_total INTEGER;
  converted_score DECIMAL(5,2);
  eval_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    eval_id := OLD.evaluation_id;
  ELSE
    eval_id := NEW.evaluation_id;
  END IF;

  SELECT 
    COALESCE(SUM(ecs.score), 0),
    COALESCE(SUM(pc.max_score), 0)
  INTO raw_total, max_total
  FROM public.evaluation_criteria_scores ecs
  INNER JOIN public.performance_criteria pc ON ecs.criteria_id = pc.id
  WHERE ecs.evaluation_id = eval_id;

  IF max_total > 0 THEN
    converted_score := ROUND((raw_total::DECIMAL / max_total::DECIMAL) * 100, 2);
  ELSE
    converted_score := 0;
  END IF;

  UPDATE public.evaluations
  SET 
    raw_total_score = raw_total,
    total_score = converted_score,
    updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = eval_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_evaluation_total_score
  AFTER INSERT OR UPDATE OR DELETE ON public.evaluation_criteria_scores
  FOR EACH ROW
  EXECUTE FUNCTION calculate_evaluation_score();

-- 수행준거 점수 유효성 검증 함수
CREATE OR REPLACE FUNCTION validate_criteria_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  criteria_max_score INTEGER;
BEGIN
  SELECT max_score INTO criteria_max_score
  FROM public.performance_criteria
  WHERE id = NEW.criteria_id;

  IF NEW.score < 0 OR NEW.score > criteria_max_score THEN
    RAISE EXCEPTION '점수는 0에서 %점 사이여야 합니다.', criteria_max_score;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_criteria_score_trigger
  BEFORE INSERT OR UPDATE ON public.evaluation_criteria_scores
  FOR EACH ROW
  EXECUTE FUNCTION validate_criteria_score();

-- ============================================================================
-- 5. Row Level Security (RLS) 활성화 및 정책
-- ============================================================================

-- RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competency_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competency_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_criteria_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;

-- RLS 헬퍼 함수 생성 (SECURITY DEFINER로 RLS 우회)
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN user_role = 'admin';
END;
$$;

CREATE OR REPLACE FUNCTION public.check_is_teacher()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN user_role = 'teacher';
END;
$$;

CREATE OR REPLACE FUNCTION public.check_can_manage()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN user_role IN ('admin', 'teacher');
END;
$$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.check_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_teacher() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_can_manage() TO authenticated;

-- 이메일 중복 확인 함수 (보안을 위해 이메일만 반환)
CREATE OR REPLACE FUNCTION public.check_email_exists(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  email_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM public.profiles 
    WHERE email = LOWER(TRIM(check_email))
  ) INTO email_exists;
  
  RETURN email_exists;
END;
$$;

-- 함수 실행 권한 부여 (anon과 authenticated 모두)
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO anon, authenticated;

-- 기본 RLS 정책 생성
-- profiles 테이블 정책
-- 참고: 이메일 중복 확인은 check_email_exists 함수를 사용하므로 별도의 공개 RLS 정책이 필요 없습니다.

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.check_is_admin());

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.check_is_admin())
  WITH CHECK (public.check_is_admin());

-- training_courses 테이블 정책
CREATE POLICY "Anyone authenticated can view courses"
  ON public.training_courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert courses"
  ON public.training_courses FOR INSERT
  TO authenticated
  WITH CHECK (public.check_is_admin());

CREATE POLICY "Admins can update courses"
  ON public.training_courses FOR UPDATE
  TO authenticated
  USING (public.check_is_admin())
  WITH CHECK (public.check_is_admin());

CREATE POLICY "Admins can delete courses"
  ON public.training_courses FOR DELETE
  TO authenticated
  USING (public.check_is_admin());

-- competency_units 테이블 정책
CREATE POLICY "Anyone authenticated can view units"
  ON public.competency_units FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and teachers can manage units"
  ON public.competency_units FOR ALL
  TO authenticated
  USING (public.check_can_manage())
  WITH CHECK (public.check_can_manage());

-- competency_elements 테이블 정책
CREATE POLICY "Anyone authenticated can view elements"
  ON public.competency_elements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and teachers can manage elements"
  ON public.competency_elements FOR ALL
  TO authenticated
  USING (public.check_can_manage())
  WITH CHECK (public.check_can_manage());

-- performance_criteria 테이블 정책
CREATE POLICY "Anyone authenticated can view criteria"
  ON public.performance_criteria FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and teachers can manage criteria"
  ON public.performance_criteria FOR ALL
  TO authenticated
  USING (public.check_can_manage())
  WITH CHECK (public.check_can_manage());

-- course_teachers, course_students 테이블 정책
CREATE POLICY "Anyone authenticated can view course teachers"
  ON public.course_teachers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage course teachers"
  ON public.course_teachers FOR ALL
  TO authenticated
  USING (public.check_is_admin())
  WITH CHECK (public.check_is_admin());

CREATE POLICY "Anyone authenticated can view course students"
  ON public.course_students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage course students"
  ON public.course_students FOR ALL
  TO authenticated
  USING (public.check_is_admin())
  WITH CHECK (public.check_is_admin());

-- evaluation_schedules, submissions, evaluations 정책
CREATE POLICY "Anyone authenticated can view schedules"
  ON public.evaluation_schedules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and teachers can manage schedules"
  ON public.evaluation_schedules FOR ALL
  TO authenticated
  USING (public.check_can_manage())
  WITH CHECK (public.check_can_manage());

CREATE POLICY "Students can view their own submissions"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own submissions"
  ON public.submissions FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own submissions"
  ON public.submissions FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins and teachers can view all submissions"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (public.check_can_manage());

CREATE POLICY "Anyone authenticated can view evaluations"
  ON public.evaluations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and teachers can manage evaluations"
  ON public.evaluations FOR ALL
  TO authenticated
  USING (public.check_can_manage())
  WITH CHECK (public.check_can_manage());

-- signatures 테이블 정책
CREATE POLICY "Users can view their own signatures"
  ON public.signatures FOR SELECT
  TO authenticated
  USING (signer_id = auth.uid());

CREATE POLICY "Users can insert their own signatures"
  ON public.signatures FOR INSERT
  TO authenticated
  WITH CHECK (signer_id = auth.uid());

CREATE POLICY "Users can update their own signatures"
  ON public.signatures FOR UPDATE
  TO authenticated
  USING (signer_id = auth.uid())
  WITH CHECK (signer_id = auth.uid());

CREATE POLICY "Users can delete their own signatures"
  ON public.signatures FOR DELETE
  TO authenticated
  USING (signer_id = auth.uid());

CREATE POLICY "Admins can manage all signatures"
  ON public.signatures FOR ALL
  TO authenticated
  USING (public.check_is_admin())
  WITH CHECK (public.check_is_admin());

-- ============================================================================
-- 6. Storage Buckets 및 정책
-- ============================================================================

-- 서명 Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', false)
ON CONFLICT (id) DO NOTHING;

-- 과제물 Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Storage 정책 생성
-- signatures bucket 정책
CREATE POLICY "Users can upload their own signatures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'signatures' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    name LIKE 'signatures/' || auth.uid()::text || '/%'
  )
);

CREATE POLICY "Users can view signatures they have access to"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'signatures' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    name LIKE 'signatures/' || auth.uid()::text || '/%' OR
    EXISTS (
      SELECT 1 FROM public.signatures
      WHERE signature_data LIKE '%' || name || '%'
    )
  )
);

CREATE POLICY "Users can delete their own signatures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'signatures' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    name LIKE 'signatures/' || auth.uid()::text || '/%'
  )
);

-- submissions bucket 정책
CREATE POLICY "Students can upload their own submissions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'submissions' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    name LIKE auth.uid()::text || '/%'
  )
);

CREATE POLICY "Users can view submissions they have access to"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'submissions' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    name LIKE auth.uid()::text || '/%' OR
    EXISTS (
      SELECT 1 FROM public.submissions
      WHERE file_url LIKE '%' || name || '%'
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  )
);

CREATE POLICY "Students can delete their own submissions"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'submissions' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    name LIKE auth.uid()::text || '/%'
  )
);

-- ============================================================================
-- 완료
-- ============================================================================

