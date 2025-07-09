import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Monitor, Minimize2 } from "lucide-react";

export function CompactViewToggle() {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem('compact-view');
    if (saved === 'true') {
      setIsCompact(true);
      document.body.classList.add('compact-view');
    }
  }, []);

  const toggleCompactView = () => {
    const newCompactState = !isCompact;
    setIsCompact(newCompactState);
    
    if (newCompactState) {
      document.body.classList.add('compact-view');
      localStorage.setItem('compact-view', 'true');
    } else {
      document.body.classList.remove('compact-view');
      localStorage.setItem('compact-view', 'false');
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleCompactView}
      className="flex items-center gap-2"
      title={isCompact ? "Switch to Normal View" : "Switch to Compact View"}
    >
      {isCompact ? (
        <>
          <Monitor className="h-4 w-4" />
          <span className="hidden sm:inline">Normal View</span>
        </>
      ) : (
        <>
          <Minimize2 className="h-4 w-4" />
          <span className="hidden sm:inline">Compact View</span>
        </>
      )}
    </Button>
  );
}