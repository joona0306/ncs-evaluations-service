import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getCurrentUserProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("프로필 조회 오류:", error);
    return null;
  }

  return profile;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireRole(role: "admin" | "teacher" | "student") {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== role) {
    redirect("/dashboard");
  }
  return profile;
}

export async function requireAdmin() {
  return requireRole("admin");
}

export async function requireTeacher() {
  return requireRole("teacher");
}

