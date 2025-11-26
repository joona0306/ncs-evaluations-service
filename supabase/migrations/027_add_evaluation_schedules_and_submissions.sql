-- 평가일정 및 과제물 제출 시스템 추가

-- 평가일정 상태 enum 타입 생성 (이미 존재하면 건너뜀)
DO $$ BEGIN
  CREATE TYPE schedule_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 과제물 제출 타입 enum (이미 존재하면 건너뜀)
DO $$ BEGIN
  CREATE TYPE submission_type AS ENUM ('image', 'url');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 평가일정 테이블 생성 (이미 존재하면 건너뜀)
CREATE TABLE IF NOT EXISTS public.evaluation_schedules (
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

-- 과제물 제출 테이블 생성 (이미 존재하면 건너뜀)
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  evaluation_schedule_id UUID REFERENCES public.evaluation_schedules(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  competency_unit_id UUID REFERENCES public.competency_units(id) ON DELETE CASCADE NOT NULL,
  submission_type submission_type NOT NULL,
  file_url TEXT, -- 이미지 파일의 경우 Storage URL
  url TEXT, -- URL 입력의 경우
  file_name TEXT, -- 파일명 (이미지인 경우)
  file_size INTEGER, -- 파일 크기 (bytes)
  comments TEXT, -- 학생의 제출 코멘트
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(evaluation_schedule_id, student_id), -- 한 학생은 한 평가일정에 하나의 과제물만 제출 가능
  CONSTRAINT valid_submission CHECK (
    (submission_type = 'image' AND file_url IS NOT NULL) OR
    (submission_type = 'url' AND url IS NOT NULL)
  )
);

-- evaluations 테이블에 submission_id 추가 (선택적, 이미 존재하면 건너뜀)
DO $$ BEGIN
  ALTER TABLE public.evaluations
  ADD COLUMN submission_id UUID REFERENCES public.submissions(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- 인덱스 생성 (이미 존재하면 건너뜀)
CREATE INDEX IF NOT EXISTS idx_evaluation_schedules_unit ON public.evaluation_schedules(competency_unit_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_schedules_status ON public.evaluation_schedules(status);
CREATE INDEX IF NOT EXISTS idx_evaluation_schedules_dates ON public.evaluation_schedules(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_submissions_schedule ON public.submissions(evaluation_schedule_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_unit ON public.submissions(competency_unit_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_submission ON public.evaluations(submission_id);

-- updated_at 트리거 추가 (이미 존재하면 건너뜀)
DROP TRIGGER IF EXISTS update_evaluation_schedules_updated_at ON public.evaluation_schedules;
CREATE TRIGGER update_evaluation_schedules_updated_at
  BEFORE UPDATE ON public.evaluation_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_submissions_updated_at ON public.submissions;
CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE public.evaluation_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 평가일정 RLS 정책
-- 모든 인증된 사용자가 평가일정 조회 가능
DROP POLICY IF EXISTS "Anyone authenticated can view evaluation schedules" ON public.evaluation_schedules;
CREATE POLICY "Anyone authenticated can view evaluation schedules"
  ON public.evaluation_schedules FOR SELECT
  TO authenticated
  USING (true);

-- 관리자와 교사는 평가일정 관리 가능
DROP POLICY IF EXISTS "Admins and teachers can manage evaluation schedules" ON public.evaluation_schedules;
CREATE POLICY "Admins and teachers can manage evaluation schedules"
  ON public.evaluation_schedules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- 과제물 제출 RLS 정책
-- 학생은 자신의 과제물 조회 가능
DROP POLICY IF EXISTS "Students can view their own submissions" ON public.submissions;
CREATE POLICY "Students can view their own submissions"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- 교사는 자신의 과정의 과제물 조회 가능
DROP POLICY IF EXISTS "Teachers can view submissions for their courses" ON public.submissions;
CREATE POLICY "Teachers can view submissions for their courses"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.competency_units cu
      INNER JOIN public.course_teachers ct ON cu.course_id = ct.course_id
      WHERE cu.id = submissions.competency_unit_id
      AND ct.teacher_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 학생은 자신의 과제물 생성 가능 (평가 기간 제한 없음)
DROP POLICY IF EXISTS "Students can create their own submissions" ON public.submissions;
CREATE POLICY "Students can create their own submissions"
  ON public.submissions FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- 학생은 자신의 과제물 수정 가능 (평가 기간 제한 없음)
DROP POLICY IF EXISTS "Students can update their own submissions" ON public.submissions;
CREATE POLICY "Students can update their own submissions"
  ON public.submissions FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- 관리자는 모든 과제물 관리 가능
DROP POLICY IF EXISTS "Admins can manage all submissions" ON public.submissions;
CREATE POLICY "Admins can manage all submissions"
  ON public.submissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Storage bucket for submissions 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for submissions bucket
DROP POLICY IF EXISTS "Students can upload their own submissions" ON storage.objects;
CREATE POLICY "Students can upload their own submissions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'submissions' AND
  (
    -- 폴더 구조: {user_id}/...
    -- 첫 번째 폴더명이 사용자 ID와 일치하거나
    (storage.foldername(name))[1] = auth.uid()::text OR
    -- 또는 경로가 {user_id}/... 형식이고 user_id가 사용자 ID와 일치
    (name LIKE auth.uid()::text || '/%')
  )
);

DROP POLICY IF EXISTS "Users can view submissions they have access to" ON storage.objects;
CREATE POLICY "Users can view submissions they have access to"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'submissions' AND
  (
    -- 자신의 폴더에 있는 파일
    (storage.foldername(name))[1] = auth.uid()::text OR
    name LIKE auth.uid()::text || '/%' OR
    -- 또는 제출 데이터에 포함된 파일
    EXISTS (
      SELECT 1 FROM public.submissions
      WHERE file_url LIKE '%' || name || '%'
    ) OR
    -- 또는 관리자/교사 역할
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  )
);

DROP POLICY IF EXISTS "Students can delete their own submissions" ON storage.objects;
CREATE POLICY "Students can delete their own submissions"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'submissions' AND
  (
    -- 자신의 폴더에 있는 파일
    (storage.foldername(name))[1] = auth.uid()::text OR
    name LIKE auth.uid()::text || '/%'
  )
);

