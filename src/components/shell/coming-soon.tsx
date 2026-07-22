import { Card, CardContent } from "@/components/ui/card";

export function ComingSoon({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm font-medium">Coming in {phase}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
