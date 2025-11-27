-- ============================================================================
-- submissions 테이블 DELETE 정책 추가
-- ============================================================================
-- 학생이 자신의 과제물을 삭제할 수 있도록 RLS 정책 추가

CREATE POLICY "Students can delete their own submissions"
  ON public.submissions FOR DELETE
  TO authenticated
  USING (student_id = auth.uid());

-- 관리자와 교사도 삭제할 수 있도록 정책 추가 (선택사항)
CREATE POLICY "Admins and teachers can delete submissions"
  ON public.submissions FOR DELETE
  TO authenticated
  USING (public.check_can_manage());

