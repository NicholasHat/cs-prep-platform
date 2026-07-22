import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Player } from "@/components/visualizer/player";
import { getAlgorithm } from "@/lib/visualizer/registry";

export default async function AlgorithmPage({
  params,
}: {
  params: Promise<{ algo: string }>;
}) {
  const { algo } = await params;
  const def = getAlgorithm(algo);
  if (!def) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/visualizer"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All algorithms
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{def.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{def.description}</p>
        <p className="mt-1 text-xs text-muted-foreground">{def.complexity}</p>
        {def.relatedProblems && def.relatedProblems.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Practice:{" "}
            {def.relatedProblems.map((slug, i) => (
              <span key={slug}>
                {i > 0 && ", "}
                <Link
                  href={`/problems/${slug}`}
                  className="underline hover:text-foreground"
                >
                  {slug.replace(/-/g, " ")}
                </Link>
              </span>
            ))}
          </p>
        )}
      </div>

      <Player algorithmId={def.id} />
    </div>
  );
}
