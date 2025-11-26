-- submissions Storage bucket의 업로드 정책 수정
-- 서버 사이드 업로드를 허용하도록 개선

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Students can upload their own submissions" ON storage.objects;

-- 새로운 업로드 정책 생성
-- 인증된 사용자는 자신의 폴더에 업로드 가능
-- 파일 경로: {user_id}/{filename}
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

-- 기존 SELECT 정책도 확인 및 개선
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

-- 기존 DELETE 정책도 확인 및 개선
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

