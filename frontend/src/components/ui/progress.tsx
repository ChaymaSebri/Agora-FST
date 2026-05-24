import * as React from "react";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: number }
>(({ className, value = 0, ...props }, ref) => {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div
      ref={ref}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary", className)}
      {...props}
    >
      <div
        className="h-full bg-primary transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
});
Progress.displayName = "Progress";

export { Progress };
