# Verdant Labs

A virtual biology labs platform: teachers create classes, post one of four interactive lab
simulations, and grade student work (numeric or rubric) with written feedback. Students get an
email the moment a grade is posted.

Built with Next.js (App Router), Supabase (Postgres + Auth), and Brevo for email.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), create a new project, and wait for it to finish provisioning.
2. **Disable email confirmation** (this app does not do email verification): in the dashboard go to
   **Authentication → Sign In / Providers → Email**, and turn off **Confirm email**.
3. Run the migrations in `supabase/migrations/`, in order (`0001` through `0016`). Easiest way:
   open the **SQL Editor** in the dashboard and paste in each file's contents one at a time, in
   numeric order, running each before moving to the next. (If you have the Supabase CLI linked to
   this project instead, `supabase db push` applies all of them at once.)
4. In **Project Settings → API**, copy the **Project URL** and the **anon/public key**.

## 2. Configure the Next.js app

```bash
cp .env.local.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=<your project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon key>
```

(`SUPABASE_SERVICE_ROLE_KEY` is left blank, it's only used by the Edge Function below, never by
the Next.js app itself.)

```bash
npm install
npm run build   # verifies everything compiles
npm run dev     # starts local dev at http://localhost:3000
```

## 3. Set up Brevo (for grade-notification emails)

1. Create a free account at [brevo.com](https://www.brevo.com).
2. Verify a sender: under **Senders, Domains & Dedicated IPs → Senders**, add the "from" address
   you want students' grade emails to come from, and verify it (Brevo emails a confirmation
   link to that address). For better deliverability, you can instead verify a full sending
   domain under **Domains** (adds SPF/DKIM DNS records), which isn't required to get started.
3. Create an API key under **SMTP & API → API Keys** (the v3 API key, not an SMTP password).

## 4. Deploy the `notify-grade` Edge Function

This function sends the grade-notification email. It's triggered by a Database Webhook, not by
the Next.js app directly, so it keeps working even if the teacher closes their browser right
after saving a grade.

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>   # found in Project Settings → General
npx supabase functions deploy notify-grade
```

Then set its secrets (these are separate from the Next.js `.env.local`, the Brevo key must
never be exposed to the browser):

```bash
npx supabase secrets set \
  BREVO_API_KEY=<your brevo api key> \
  BREVO_FROM_EMAIL=<the sender address you verified in brevo> \
  BREVO_FROM_NAME="Verdant Labs" \
  APP_BASE_URL=https://<your deployed app domain>
```

`BREVO_FROM_EMAIL` must exactly match the sender you verified in step 3. `BREVO_FROM_NAME` is
optional, it defaults to "Verdant Labs" if you skip it.

## 5. Wire up the Database Webhook

In the Supabase dashboard, go to **Database → Webhooks → Create a new webhook**:

- **Table**: `grades`
- **Events**: `Insert` and `Update`
- **Type**: HTTP Request
- **URL**: `https://<your-project-ref>.supabase.co/functions/v1/notify-grade`
- **HTTP Headers**: add `Authorization: Bearer <your service-role key>`
  (this is what lets the request past the Edge Function's default JWT check, since Supabase's
  service-role key is itself a valid signed JWT)

Save it. Every grade insert/update (including re-grades) will now trigger an email attempt, and
every attempt is logged to the `grade_notifications` table for auditing.

## 6. Try it end-to-end

1. Visit `/signup?role=teacher`, create a teacher account, create a class.
2. In a different browser (or incognito window), sign up as a student using the class's join
   code or link.
3. As the teacher, post one of the four labs to the class with a due date and grading mode.
4. As the student, complete the lab and submit it.
5. As the teacher, open the gradebook, grade the submission, and save.
6. Confirm the student receives the grade email, including if you close the gradebook tab
   immediately after clicking save, since the email is sent by the webhook/Edge Function, not
   the browser request.

## Notes

- Node 20 works but `@supabase/supabase-js` warns that it's deprecated upstream; Node 22+ is
  recommended if you hit any issues.
- There is no payment/billing in this build, that was explicitly out of scope.
- The 4 lab simulations are fixed (seeded via `0003_lab_templates_seed.sql`) and not
  teacher-editable; everything else (classes, assignments, grading mode, attempt limits) is.
