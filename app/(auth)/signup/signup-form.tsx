"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GraduationCap, Loader2, School } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { signupSchema, type SignupInput } from "@/lib/validation/auth";
import { signUp } from "@/lib/actions/auth";

const ROLE_OPTIONS = [
  {
    value: "teacher" as const,
    label: "I'm a teacher",
    description: "Create classes, assign labs, and grade.",
    icon: School,
  },
  {
    value: "student" as const,
    label: "I'm a student",
    description: "Join a class with a code and complete labs.",
    icon: GraduationCap,
  },
];

export function SignupForm({
  next,
  defaultRole,
}: {
  next?: string;
  defaultRole?: "teacher" | "student";
}) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: defaultRole ?? "student",
    },
  });

  function onSubmit(values: SignupInput) {
    setFormError(null);
    startTransition(async () => {
      const result = await signUp(values, next);
      if (result?.error) setFormError(result.error);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>I am a...</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid grid-cols-2 gap-3"
                >
                  {ROLE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      htmlFor={`role-${option.value}`}
                      className={cn(
                        "flex cursor-pointer flex-col gap-2 rounded-md border border-input p-3 transition-colors hover:bg-muted",
                        field.value === option.value && "border-primary bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <option.icon className="text-primary size-5" />
                        <RadioGroupItem value={option.value} id={`role-${option.value}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{option.label}</p>
                        <p className="text-muted-foreground text-xs">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input autoComplete="name" placeholder="Jamie Rivera" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="you@school.edu" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" placeholder="At least 8 characters" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {formError && <p className="text-destructive text-sm">{formError}</p>}
        <Button type="submit" disabled={isPending} className="mt-2">
          {isPending && <Loader2 className="animate-spin" />}
          Create account
        </Button>
      </form>
    </Form>
  );
}
