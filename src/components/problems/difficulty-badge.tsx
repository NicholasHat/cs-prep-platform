import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  hard: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  return (
    <Badge variant="secondary" className={cn("capitalize", styles[difficulty])}>
      {difficulty}
    </Badge>
  );
}
