import { useEffect } from "react";

/**
 * Basic front-end deterrents: no right-click menu and no inspector shortcuts.
 * These raise the effort bar for casual copying; real protection lives on the server.
 */
export function useSourceProtection() {
  useEffect(() => {
    const onContextMenu = (event: MouseEvent) => event.preventDefault();

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const blocked =
        event.key === "F12" ||
        (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key)) ||
        (event.metaKey && event.altKey && ["i", "j", "c"].includes(key)) ||
        (event.ctrlKey && key === "u") ||
        (event.ctrlKey && key === "s");
      if (blocked) event.preventDefault();
    };

    const onDragStart = (event: DragEvent) => {
      if ((event.target as HTMLElement)?.tagName === "IMG") event.preventDefault();
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("dragstart", onDragStart);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("dragstart", onDragStart);
    };
  }, []);
}