import { SidebarNav } from "@/components/shell/sidebar-nav";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r bg-background px-3 py-4">
        <div className="mb-6 px-3">
          <span className="text-lg font-semibold tracking-tight">CS Prep</span>
        </div>
        <SidebarNav />
        <div className="mt-auto px-3 pt-3 text-xs text-muted-foreground">
          local · single user
        </div>
      </aside>
      <main className="min-w-0 flex-1 bg-muted/20 p-6 lg:p-8">{children}</main>
    </div>
  );
}
