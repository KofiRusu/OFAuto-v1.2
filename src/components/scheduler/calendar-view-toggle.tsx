import { Calendar, Grid } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface CalendarViewToggleProps {
  view: "calendar" | "grid";
  setView: (view: "calendar" | "grid") => void;
}

export function CalendarViewToggle({ view, setView }: CalendarViewToggleProps) {
  return (
    <ToggleGroup type="single" value={view} onValueChange={(value) => value && setView(value as "calendar" | "grid")}>
      <ToggleGroupItem value="calendar" aria-label="View as calendar">
        <Calendar className="h-4 w-4 mr-2" />
        Calendar
      </ToggleGroupItem>
      <ToggleGroupItem value="grid" aria-label="View as grid">
        <Grid className="h-4 w-4 mr-2" />
        Grid
      </ToggleGroupItem>
    </ToggleGroup>
  );
} 