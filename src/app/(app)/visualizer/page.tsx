import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ALGORITHM_CATEGORIES, ALGORITHMS } from "@/lib/visualizer/registry";

export const metadata = { title: "Visualizer" };

export default function VisualizerCatalogPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Algorithm Visualizer
        </h1>
        <p className="text-sm text-muted-foreground">
          Step through each algorithm one operation at a time.
        </p>
      </div>

      {ALGORITHM_CATEGORIES.map((category) => (
        <section key={category}>
          <h2 className="mb-3 text-lg font-medium">{category}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ALGORITHMS.filter((a) => a.category === category).map((a) => (
              <Link key={a.id} href={`/visualizer/${a.id}`}>
                <Card className="h-full transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-base">{a.name}</CardTitle>
                    <CardDescription>{a.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {a.complexity}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
