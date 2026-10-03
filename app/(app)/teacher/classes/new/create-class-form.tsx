"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { createClassSchema, type CreateClassInput } from "@/lib/validation/classes";
import { createClass } from "@/lib/actions/classes";

export function CreateClassForm() {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<CreateClassInput>({
    resolver: zodResolver(createClassSchema),
    defaultValues: { name: "", description: "" },
  });

  function onSubmit(values: CreateClassInput) {
    setFormError(null);
    startTransition(async () => {
      const result = await createClass(values);
      if (result?.error) setFormError(result.error);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class name</FormLabel>
              <FormControl>
                <Input placeholder="AP Biology, Period 3" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="A short note for yourself about this section, optional."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>Only you will see this.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {formError && <p className="text-destructive text-sm">{formError}</p>}
        <Button type="submit" disabled={isPending} className="mt-2 self-start">
          {isPending && <Loader2 className="animate-spin" />}
          Create class
        </Button>
      </form>
    </Form>
  );
}
