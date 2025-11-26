-- signatures 테이블에 UPDATE 정책 추가
-- 사용자는 자신의 서명만 수정 가능

-- 기존 정책 삭제 (혹시 있을 수 있음)
DROP POLICY IF EXISTS "Users can update their own signatures" ON public.signatures;
DROP POLICY IF EXISTS "Admins can update all signatures" ON public.signatures;

CREATE POLICY "Users can update their own signatures"
  ON public.signatures FOR UPDATE
  TO authenticated
  USING (signer_id = auth.uid())
  WITH CHECK (signer_id = auth.uid());

-- 관리자는 모든 서명 수정 가능
CREATE POLICY "Admins can update all signatures"
  ON public.signatures FOR UPDATE
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

-- signatures 테이블에 DELETE 정책 추가
-- 사용자는 자신의 서명만 삭제 가능

-- 기존 정책 삭제 (혹시 있을 수 있음)
DROP POLICY IF EXISTS "Users can delete their own signatures" ON public.signatures;
DROP POLICY IF EXISTS "Admins can delete all signatures" ON public.signatures;

CREATE POLICY "Users can delete their own signatures"
  ON public.signatures FOR DELETE
  TO authenticated
  USING (signer_id = auth.uid());

-- 관리자는 모든 서명 삭제 가능
CREATE POLICY "Admins can delete all signatures"
  ON public.signatures FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- signatures 테이블에 updated_at 컬럼이 없으면 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'signatures'
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.signatures
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;
    
    -- updated_at 트리거 추가
    CREATE TRIGGER update_signatures_updated_at
      BEFORE UPDATE ON public.signatures
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

