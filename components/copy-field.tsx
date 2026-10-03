"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</span>
      <div className="flex gap-2">
        <Input readOnly value={value} className="font-mono" onFocus={(e) => e.currentTarget.select()} />
        <Button type="button" variant="outline" size="icon" onClick={handleCopy} aria-label={`Copy ${label}`}>
          {copied ? <Check className="text-success" /> : <Copy />}
        </Button>
      </div>
    </div>
  );
}
