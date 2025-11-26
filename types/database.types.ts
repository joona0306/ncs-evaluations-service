export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: "admin" | "teacher" | "student"
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role: "admin" | "teacher" | "student"
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: "admin" | "teacher" | "student"
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      training_courses: {
        Row: {
          id: string
          name: string
          code: string
          start_date: string
          end_date: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          start_date: string
          end_date: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          start_date?: string
          end_date?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      course_teachers: {
        Row: {
          course_id: string
          teacher_id: string
          created_at: string
        }
        Insert: {
          course_id: string
          teacher_id: string
          created_at?: string
        }
        Update: {
          course_id?: string
          teacher_id?: string
          created_at?: string
        }
      }
      course_students: {
        Row: {
          course_id: string
          student_id: string
          enrollment_date: string
          status: "active" | "completed" | "withdrawn"
          created_at: string
        }
        Insert: {
          course_id: string
          student_id: string
          enrollment_date: string
          status?: "active" | "completed" | "withdrawn"
          created_at?: string
        }
        Update: {
          course_id?: string
          student_id?: string
          enrollment_date?: string
          status?: "active" | "completed" | "withdrawn"
          created_at?: string
        }
      }
      competency_units: {
        Row: {
          id: string
          course_id: string
          name: string
          code: string
          description: string | null
          evaluation_criteria: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          name: string
          code: string
          description?: string | null
          evaluation_criteria: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          name?: string
          code?: string
          description?: string | null
          evaluation_criteria?: Json
          created_at?: string
          updated_at?: string
        }
      }
      evaluations: {
        Row: {
          id: string
          competency_unit_id: string
          student_id: string
          teacher_id: string
          scores: Json
          comments: string | null
          status: "draft" | "submitted" | "confirmed"
          evaluated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          competency_unit_id: string
          student_id: string
          teacher_id: string
          scores: Json
          comments?: string | null
          status?: "draft" | "submitted" | "confirmed"
          evaluated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          competency_unit_id?: string
          student_id?: string
          teacher_id?: string
          scores?: Json
          comments?: string | null
          status?: "draft" | "submitted" | "confirmed"
          evaluated_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      signatures: {
        Row: {
          id: string
          evaluation_id: string
          signer_id: string
          signer_role: "teacher" | "student" | "admin"
          signature_type: "canvas" | "image"
          signature_data: string
          signed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          evaluation_id: string
          signer_id: string
          signer_role: "teacher" | "student" | "admin"
          signature_type: "canvas" | "image"
          signature_data: string
          signed_at: string
          created_at?: string
        }
        Update: {
          id?: string
          evaluation_id?: string
          signer_id?: string
          signer_role?: "teacher" | "student" | "admin"
          signature_type?: "canvas" | "image"
          signature_data?: string
          signed_at?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "admin" | "teacher" | "student"
      enrollment_status: "active" | "completed" | "withdrawn"
      evaluation_status: "draft" | "submitted" | "confirmed"
      signature_type: "canvas" | "image"
      signer_role: "teacher" | "student" | "admin"
    }
  }
}

