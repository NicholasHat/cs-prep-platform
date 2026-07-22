import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata = { title: "Visualizer" };

export default function VisualizerPage() {
  return (
    <ComingSoon
      title="Algorithm Visualizer"
      phase="Phase 4"
      description="Step-through visualizations: sorting, searching, graphs, trees, DP grids, and more."
    />
  );
}
