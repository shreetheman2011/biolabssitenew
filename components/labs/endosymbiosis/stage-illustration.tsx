export function StageIllustration({ stageId }: { stageId: string }) {
  switch (stageId) {
    case "free_living":
      return (
        <svg viewBox="0 0 72 72" className="size-12" aria-hidden>
          <path
            d="M22 36c0-8.5 6.3-15 14-15s14 6.5 14 15-6.3 15-14 15-14-6.5-14-15Z"
            fill="var(--color-chart-5)"
            fillOpacity={0.22}
            stroke="var(--color-chart-5)"
            strokeWidth={2}
          />
          <circle cx="34" cy="34" r="3" fill="var(--color-chart-5)" />
          <circle cx="40" cy="39" r="1.6" fill="var(--color-chart-5)" />
          <path
            d="M22 34c-5 1-9 4-11 7M23 41c-5 2-8 5-9 9M50 34c5 1 9 4 11 7M49 41c5 2 8 5 9 9"
            stroke="var(--color-chart-5)"
            strokeWidth={1.4}
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );
    case "engulfment":
      return (
        <svg viewBox="0 0 72 72" className="size-12" aria-hidden>
          <circle
            cx="36"
            cy="38"
            r="25"
            fill="var(--color-chart-1)"
            fillOpacity={0.1}
            stroke="var(--color-chart-1)"
            strokeWidth={2}
            strokeDasharray="4 3"
          />
          <path
            d="M19 28c3-3 6-4 9-4"
            stroke="var(--color-chart-1)"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M20 28c0-7 5.5-12.5 12-12.5S44 21 44 28s-5.5 12.5-12 12.5S20 35 20 28Z"
            fill="var(--color-chart-5)"
            fillOpacity={0.3}
            stroke="var(--color-chart-5)"
            strokeWidth={2}
            transform="translate(0 10)"
          />
        </svg>
      );
    case "symbiosis":
      return (
        <svg viewBox="0 0 72 72" className="size-12" aria-hidden>
          <circle
            cx="36"
            cy="36"
            r="25"
            fill="var(--color-chart-1)"
            fillOpacity={0.1}
            stroke="var(--color-chart-1)"
            strokeWidth={2}
          />
          <ellipse
            cx="36"
            cy="36"
            rx="11"
            ry="8"
            fill="var(--color-chart-5)"
            fillOpacity={0.4}
            stroke="var(--color-chart-5)"
            strokeWidth={2}
          />
          <path d="M25 21c4 4 4 8 1 12" stroke="var(--accent)" strokeWidth={2} fill="none" strokeLinecap="round" />
          <path d="M47 51c-4-4-4-8-1-12" stroke="var(--color-chart-1)" strokeWidth={2} fill="none" strokeLinecap="round" />
        </svg>
      );
    case "organelle":
      return (
        <svg viewBox="0 0 72 72" className="size-12" aria-hidden>
          <circle cx="36" cy="36" r="25" fill="var(--muted)" stroke="var(--border)" strokeWidth={2} />
          <ellipse
            cx="36"
            cy="36"
            rx="15"
            ry="10.5"
            fill="var(--color-success)"
            fillOpacity={0.18}
            stroke="var(--color-success)"
            strokeWidth={2}
          />
          <path
            d="M24 32c2 2.4 3.5-2.4 5.5 0s3.5-2.4 5.5 0 3.5-2.4 5.5 0 3.5-2.4 5.5 0M24 40c2 2.4 3.5-2.4 5.5 0s3.5-2.4 5.5 0 3.5-2.4 5.5 0 3.5-2.4 5.5 0"
            stroke="var(--color-success)"
            strokeWidth={1.3}
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
}
