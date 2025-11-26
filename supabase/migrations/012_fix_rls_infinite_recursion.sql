-- Fix infinite recursion in RLS helper functions
-- The SECURITY DEFINER functions need to properly bypass RLS

-- Drop existing functions with CASCADE to remove dependent policies
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_teacher() CASCADE;
DROP FUNCTION IF EXISTS public.is_student() CASCADE;

-- Recreate functions with proper RLS bypass
-- Set search_path and use SECURITY DEFINER with STABLE to ensure RLS is bypassed
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_role text;
BEGIN
  -- Query profiles table with RLS bypassed (due to SECURITY DEFINER)
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN user_role = 'admin';
END;
$$;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_role text;
BEGIN
  -- Query profiles table with RLS bypassed (due to SECURITY DEFINER)
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN user_role = 'teacher';
END;
$$;

CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_role text;
BEGIN
  -- Query profiles table with RLS bypassed (due to SECURITY DEFINER)
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN user_role = 'student';
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_teacher() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_student() TO authenticated;

-- Recreate policies that were dropped with CASCADE

-- Drop existing basic policies first (in case they weren't dropped by CASCADE)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view their course students" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view other teachers" ON public.profiles;
DROP POLICY IF EXISTS "Students can view their course teachers" ON public.profiles;
DROP POLICY IF EXISTS "Students can view other students in same course" ON public.profiles;

-- Basic policy: Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Basic policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Basic policy: Users can insert their own profile (but not as admin)
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id 
    AND role != 'admin'
  );

-- Admin policies
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Teacher policies
CREATE POLICY "Teachers can view their course students"
  ON public.profiles FOR SELECT
  USING (
    public.is_teacher()
    AND role = 'student'
    AND EXISTS (
      SELECT 1
      FROM public.course_teachers ct
      INNER JOIN public.course_students cs ON ct.course_id = cs.course_id
      WHERE ct.teacher_id = auth.uid()
        AND cs.student_id = profiles.id
        AND cs.status = 'active'
    )
  );

CREATE POLICY "Teachers can view other teachers"
  ON public.profiles FOR SELECT
  USING (
    public.is_teacher()
    AND role = 'teacher'
  );

-- Student policies
CREATE POLICY "Students can view their course teachers"
  ON public.profiles FOR SELECT
  USING (
    public.is_student()
    AND role = 'teacher'
    AND EXISTS (
      SELECT 1
      FROM public.course_students cs
      INNER JOIN public.course_teachers ct ON cs.course_id = ct.course_id
      WHERE cs.student_id = auth.uid()
        AND ct.teacher_id = profiles.id
        AND cs.status = 'active'
    )
  );

CREATE POLICY "Students can view other students in same course"
  ON public.profiles FOR SELECT
  USING (
    public.is_student()
    AND role = 'student'
    AND EXISTS (
      SELECT 1
      FROM public.course_students cs1
      INNER JOIN public.course_students cs2 ON cs1.course_id = cs2.course_id
      WHERE cs1.student_id = auth.uid()
        AND cs2.student_id = profiles.id
        AND cs1.status = 'active'
        AND cs2.status = 'active'
    )
  );

