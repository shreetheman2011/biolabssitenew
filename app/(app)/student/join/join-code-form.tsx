"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinClassByCode } from "@/lib/actions/classes";

export function JoinCodeForm() {
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await joinClassByCode(code.trim());
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="join-code">Join code</Label>
        <Input
          id="join-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABC123"
          maxLength={6}
          className="font-mono tracking-widest uppercase"
          autoFocus
        />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" disabled={isPending || code.trim().length < 6} className="self-start">
        {isPending && <Loader2 className="animate-spin" />}
        Join class
      </Button>
    </form>
  );
}
