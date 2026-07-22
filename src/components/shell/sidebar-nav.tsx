"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  CalendarDays,
  CalendarRange,
  LayoutDashboard,
  ListChecks,
  NotebookPen,
  Play,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/problems", label: "Problems", icon: ListChecks },
  { href: "/review", label: "Review", icon: RefreshCw },
  { href: "/visualizer", label: "Visualizer", icon: Play },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/calendar", label: "Calendar", icon: CalendarRange },
  { href: "/notes", label: "Notes", icon: NotebookPen },
  { href: "/certs", label: "Certificates", icon: Award },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
