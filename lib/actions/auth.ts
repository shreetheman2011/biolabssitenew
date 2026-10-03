"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from "@/lib/validation/auth";

export type AuthActionResult = { error: string } | undefined;

// Only ever redirect to a same-origin path, which guards against an open-redirect via a crafted
// `next` query param (e.g. `//evil.com` or `https://evil.com`).
function safeNext(next: string | undefined | null): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export async function signIn(values: LoginInput, next?: string | null): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Incorrect email or password." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  redirect(safeNext(next) ?? (profile?.role === "teacher" ? "/teacher" : "/student"));
}

export async function signUp(values: SignupInput, next?: string | null): Promise<AuthActionResult> {
  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Please check the form for errors." };
  }

  const { fullName, email, password, role } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role } },
  });

  if (error) {
    return { error: error.message.includes("already registered") ? "An account with this email already exists." : error.message };
  }

  if (!data.session) {
    return { error: "Account created, but sign-in failed. Try logging in." };
  }

  redirect(safeNext(next) ?? (role === "teacher" ? "/teacher" : "/student"));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
