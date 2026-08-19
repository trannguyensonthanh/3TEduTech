import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Icons } from "./Icons";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Icons.moon className="h-5 w-5" />
      ) : (
        <Icons.sun className="h-5 w-5" />
      )}
    </Button>
  );
}
