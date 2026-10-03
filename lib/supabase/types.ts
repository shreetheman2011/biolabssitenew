// Hand-written types mirroring supabase/migrations/*.sql. Once the user's Supabase project
// exists, this can be regenerated with `supabase gen types typescript` and swapped in as-is,
// since every client here imports only the `Database` type name, not these shapes directly.

export type UserRole = "teacher" | "student";
export type AssignmentStatus = "draft" | "posted";
export type GradingType = "numeric" | "rubric";
export type SubmissionStatus = "in_progress" | "submitted";
export type NotificationStatus = "pending" | "sent" | "failed";

export type JournalPrompt = {
  id: string;
  type: "short_text" | "long_text" | "table";
  label: string;
  required: boolean;
  columns?: string[];
};

export type JournalSchema = {
  version: number;
  prompts: JournalPrompt[];
};

export type JournalAnswerValue = string | Record<string, string>[];

export type JournalResponses = {
  version: number;
  answers: Record<string, JournalAnswerValue>;
};

export type RubricCriterion = {
  id: string;
  label: string;
  max_points: number;
};

export type RubricScore = {
  points: number;
  comment?: string;
};

export type RubricScores = Record<string, RubricScore>;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      classes: {
        Row: {
          id: string;
          teacher_id: string;
          name: string;
          description: string | null;
          join_code: string;
          archived_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["classes"]["Row"]> & {
          teacher_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["classes"]["Row"]>;
        Relationships: [];
      };
      class_enrollments: {
        Row: {
          id: string;
          class_id: string;
          student_id: string;
          enrolled_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["class_enrollments"]["Row"]> & {
          class_id: string;
          student_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["class_enrollments"]["Row"]>;
        Relationships: [];
      };
      lab_templates: {
        Row: {
          id: string;
          slug: "miller-urey" | "endosymbiosis" | "invasive-species" | "biomagnification";
          title: string;
          category: "origin-of-life" | "ecology";
          summary: string;
          estimated_minutes: number;
          default_journal_schema: JournalSchema;
          created_at: string;
        };
        // No INSERT/UPDATE policy exists on this table (seeded once via migration), but
        // `never` here breaks supabase-js's generic inference for the whole table, so use an
        // unconstructable-in-practice object type instead so Row/select inference stays sound.
        Insert: Database["public"]["Tables"]["lab_templates"]["Row"];
        Update: Partial<Database["public"]["Tables"]["lab_templates"]["Row"]>;
        Relationships: [];
      };
      assignments: {
        Row: {
          id: string;
          class_id: string;
          lab_template_id: string;
          teacher_id: string;
          title: string;
          instructions: string | null;
          status: AssignmentStatus;
          due_at: string | null;
          allow_multiple_attempts: boolean;
          max_attempts: number | null;
          grading_type: GradingType;
          max_score: number | null;
          rubric_criteria: RubricCriterion[] | null;
          posted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["assignments"]["Row"]> & {
          class_id: string;
          lab_template_id: string;
          teacher_id: string;
          title: string;
          grading_type: GradingType;
        };
        Update: Partial<Database["public"]["Tables"]["assignments"]["Row"]>;
        Relationships: [];
      };
      submissions: {
        Row: {
          id: string;
          assignment_id: string;
          student_id: string;
          attempt_number: number;
          status: SubmissionStatus;
          sim_state: Record<string, unknown>;
          journal_responses: JournalResponses;
          started_at: string;
          submitted_at: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["submissions"]["Row"]> & {
          assignment_id: string;
          student_id: string;
          attempt_number: number;
        };
        Update: Partial<Database["public"]["Tables"]["submissions"]["Row"]>;
        Relationships: [];
      };
      grades: {
        Row: {
          id: string;
          assignment_id: string;
          student_id: string;
          submission_id: string;
          graded_by: string;
          numeric_score: number | null;
          rubric_scores: RubricScores | null;
          feedback: string | null;
          graded_at: string;
          notified_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["grades"]["Row"]> & {
          assignment_id: string;
          student_id: string;
          submission_id: string;
          graded_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["grades"]["Row"]>;
        Relationships: [];
      };
      grade_notifications: {
        Row: {
          id: string;
          grade_id: string;
          status: NotificationStatus;
          provider_message_id: string | null;
          error: string | null;
          attempted_at: string;
        };
        // Written only by the notify-grade Edge Function via the service-role key, which
        // bypasses RLS, and the Next.js app has no write policy and should never call these.
        Insert: Database["public"]["Tables"]["grade_notifications"]["Row"];
        Update: Partial<Database["public"]["Tables"]["grade_notifications"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {
      gradebook_entries: {
        Row: {
          assignment_id: string;
          class_id: string;
          assignment_title: string;
          grading_type: GradingType;
          max_score: number | null;
          rubric_criteria: RubricCriterion[] | null;
          allow_multiple_attempts: boolean;
          due_at: string | null;
          student_id: string;
          student_name: string;
          student_email: string;
          attempt_count: number;
          latest_submission_id: string | null;
          latest_submission_status: SubmissionStatus | null;
          latest_submitted_at: string | null;
          grade_id: string | null;
          graded_submission_id: string | null;
          numeric_score: number | null;
          rubric_scores: RubricScores | null;
          feedback: string | null;
          graded_at: string | null;
          notified_at: string | null;
        };
        // Note: grade_id/graded_submission_id/numeric_score/rubric_scores/feedback/graded_at/
        // notified_at reflect only the latest attempt's grade (grades are now per-submission,
        // see 0016_grades_per_attempt.sql), not a rollup across all of a student's attempts.
        Relationships: [];
      };
    };
    Functions: {
      join_class_by_code: {
        Args: { p_join_code: string };
        Returns: { class_id: string; class_name: string }[];
      };
    };
  };
}
