import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createHabitRule,
  deleteHabitRule,
  getHabitRules,
  toggleHabitRule,
} from "@/server/schedule";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function HabitManager() {
  const rules = await getHabitRules();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recurring habits</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {rules.length > 0 && (
          <ul className="space-y-2">
            {rules.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <span className={r.active ? "" : "line-through opacity-50"}>
                    {r.title}
                  </span>
                  <span className="ml-2 text-muted-foreground">
                    {r.startTime} · {r.durationMin}m ·{" "}
                    {r.daysOfWeek
                      .slice()
                      .sort()
                      .map((d) => WEEKDAYS[d])
                      .join(" ")}
                  </span>
                </div>
                <form
                  action={async () => {
                    "use server";
                    await toggleHabitRule(r.id, !r.active);
                  }}
                >
                  <Button type="submit" variant="outline" size="sm">
                    {r.active ? "Pause" : "Resume"}
                  </Button>
                </form>
                <form
                  action={async () => {
                    "use server";
                    await deleteHabitRule(r.id);
                  }}
                >
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    aria-label={`Delete ${r.title}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form action={createHabitRule} className="space-y-3 border-t pt-4">
          <p className="text-sm font-medium">New habit</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1 sm:col-span-3">
              <Label htmlFor="habit-title">Title</Label>
              <Input
                id="habit-title"
                name="title"
                required
                placeholder="e.g. Morning DSA session"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="habit-start">Start</Label>
              <Input
                id="habit-start"
                name="startTime"
                type="time"
                required
                defaultValue="07:00"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="habit-duration">Minutes</Label>
              <Input
                id="habit-duration"
                name="durationMin"
                type="number"
                min={5}
                max={600}
                required
                defaultValue={60}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {WEEKDAYS.map((label, i) => (
              <label
                key={label}
                className="flex items-center gap-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  name="daysOfWeek"
                  value={i}
                  defaultChecked={i >= 1 && i <= 5}
                  className="size-4 accent-primary"
                />
                {label}
              </label>
            ))}
          </div>
          <Button type="submit" size="sm">
            Add habit
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
