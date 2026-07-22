import { LogOut } from "lucide-react";
import { auth, signOut } from "@/auth";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { Button } from "@/components/ui/button";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r bg-background px-3 py-4">
        <div className="mb-6 px-3">
          <span className="text-lg font-semibold tracking-tight">CS Prep</span>
        </div>
        <SidebarNav />
        <div className="mt-auto border-t pt-3">
          <div className="truncate px-3 pb-2 text-xs text-muted-foreground">
            {session?.user?.email}
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 px-3 text-muted-foreground"
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 bg-muted/20 p-6 lg:p-8">{children}</main>
    </div>
  );
}
