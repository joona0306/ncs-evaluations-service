-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');
CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'withdrawn');
CREATE TYPE evaluation_status AS ENUM ('draft', 'submitted', 'confirmed');
CREATE TYPE signature_type AS ENUM ('canvas', 'image');
CREATE TYPE signer_role AS ENUM ('teacher', 'student', 'admin');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'student',
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create training_courses table
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

-- Create course_teachers table (many-to-many relationship)
CREATE TABLE public.course_teachers (
  course_id UUID REFERENCES public.training_courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (course_id, teacher_id)
);

-- Create course_students table (many-to-many relationship)
CREATE TABLE public.course_students (
  course_id UUID REFERENCES public.training_courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status enrollment_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (course_id, student_id)
);

-- Create competency_units table
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

-- Create evaluations table
CREATE TABLE public.evaluations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  competency_unit_id UUID REFERENCES public.competency_units(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  comments TEXT,
  status evaluation_status NOT NULL DEFAULT 'draft',
  evaluated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(competency_unit_id, student_id)
);

-- Create signatures table
CREATE TABLE public.signatures (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE CASCADE NOT NULL,
  signer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  signer_role signer_role NOT NULL,
  signature_type signature_type NOT NULL,
  signature_data TEXT NOT NULL, -- URL or base64 data
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_course_teachers_teacher ON public.course_teachers(teacher_id);
CREATE INDEX idx_course_teachers_course ON public.course_teachers(course_id);
CREATE INDEX idx_course_students_student ON public.course_students(student_id);
CREATE INDEX idx_course_students_course ON public.course_students(course_id);
CREATE INDEX idx_course_students_status ON public.course_students(status);
CREATE INDEX idx_competency_units_course ON public.competency_units(course_id);
CREATE INDEX idx_evaluations_student ON public.evaluations(student_id);
CREATE INDEX idx_evaluations_teacher ON public.evaluations(teacher_id);
CREATE INDEX idx_evaluations_competency_unit ON public.evaluations(competency_unit_id);
CREATE INDEX idx_evaluations_status ON public.evaluations(status);
CREATE INDEX idx_signatures_evaluation ON public.signatures(evaluation_id);
CREATE INDEX idx_signatures_signer ON public.signatures(signer_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_courses_updated_at BEFORE UPDATE ON public.training_courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competency_units_updated_at BEFORE UPDATE ON public.competency_units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON public.evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competency_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id AND role != 'admin');

-- 관리자 프로필은 수동으로만 생성 가능 (RLS 정책으로 차단)

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for training_courses
CREATE POLICY "Anyone authenticated can view courses"
  ON public.training_courses FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage courses"
  ON public.training_courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for course_teachers
CREATE POLICY "Teachers can view their courses"
  ON public.course_teachers FOR SELECT
  USING (
    teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage course_teachers"
  ON public.course_teachers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for course_students
CREATE POLICY "Students can view their enrollments"
  ON public.course_students FOR SELECT
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.course_teachers
      WHERE course_id = course_students.course_id AND teacher_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage course_students"
  ON public.course_students FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for competency_units
CREATE POLICY "Anyone authenticated can view competency units"
  ON public.competency_units FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage competency units"
  ON public.competency_units FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for evaluations
CREATE POLICY "Students can view their evaluations"
  ON public.evaluations FOR SELECT
  USING (
    student_id = auth.uid() OR
    teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Teachers can manage evaluations for their courses"
  ON public.evaluations FOR ALL
  USING (
    teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Students can view their own evaluations"
  ON public.evaluations FOR SELECT
  USING (student_id = auth.uid());

-- RLS Policies for signatures
CREATE POLICY "Users can view signatures for their evaluations"
  ON public.signatures FOR SELECT
  USING (
    signer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.evaluations
      WHERE id = signatures.evaluation_id AND (
        student_id = auth.uid() OR
        teacher_id = auth.uid()
      )
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can create signatures"
  ON public.signatures FOR INSERT
  WITH CHECK (
    signer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.evaluations
      WHERE id = signatures.evaluation_id AND (
        student_id = auth.uid() OR
        teacher_id = auth.uid()
      )
    )
  );

