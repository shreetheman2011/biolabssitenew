"use client";

import { useState, useTransition } from "react";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { joinClassByCode } from "@/lib/actions/classes";

export function JoinButton({ code }: { code: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleJoin() {
    setError(null);
    startTransition(async () => {
      const result = await joinClassByCode(code);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={handleJoin} disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" /> : <LogIn />}
        Join class
      </Button>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
