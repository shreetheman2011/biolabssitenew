"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClassSchema, type CreateClassInput } from "@/lib/validation/classes";

export type ClassActionResult = { error: string } | undefined;

export async function createClass(values: CreateClassInput): Promise<ClassActionResult> {
  const parsed = createClassSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Enter a class name." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data, error } = await supabase
    .from("classes")
    .insert({
      teacher_id: userData.user.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Could not create the class. Try again." };
  }

  redirect(`/teacher/classes/${data.id}`);
}

export async function joinClassByCode(code: string): Promise<ClassActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect(`/login?next=${encodeURIComponent(`/join/${code}`)}`);
  }

  const { data, error } = await supabase.rpc("join_class_by_code", { p_join_code: code });

  if (error) {
    const message = error.message.includes("invalid_code")
      ? "That join code doesn't match any class."
      : error.message.includes("class_archived")
        ? "This class is no longer accepting new students."
        : error.message.includes("only_students_can_join")
          ? "Only student accounts can join a class."
          : "Something went wrong joining the class. Try again.";
    return { error: message };
  }

  const row = data?.[0];
  if (!row) {
    return { error: "Something went wrong joining the class. Try again." };
  }

  redirect(`/student/classes/${row.class_id}`);
}
