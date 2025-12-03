/**
 * 공통 타입 정의
 * 프로젝트 전반에서 사용되는 공통 타입들을 정의합니다.
 */

// 사용자 역할
export type UserRole = "admin" | "teacher" | "student";

// 프로필 인터페이스
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  phone: string | null;
  approved?: boolean;
  agreed_terms_at?: string | null;
  agreed_privacy_at?: string | null;
  agreed_marketing?: boolean;
  agreed_marketing_at?: string | null;
  created_at: string;
  updated_at: string;
}

// 사용자 인터페이스 (Profile과 유사하지만 일부 필드가 다를 수 있음)
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  phone: string | null;
  approved?: boolean;
  created_at: string;
}

// API 응답 기본 형식
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

// 페이징 응답 형식
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total?: number;
    hasMore: boolean;
  };
}

// 로딩 상태
export interface LoadingState {
  loading: boolean;
  error: string | null;
}

// 폼 상태
export interface FormState<T = any> {
  data: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
}

