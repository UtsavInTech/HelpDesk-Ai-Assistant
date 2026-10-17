import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "sigmagpt_sidebar_width";
export const MIN_WIDTH = 200;
export const MAX_WIDTH = 480;
export const DEFAULT_WIDTH = 270;

const clamp = (value) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value));

const readStoredWidth = () => {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(stored) && stored > 0 ? clamp(stored) : DEFAULT_WIDTH;
};

/**
 * Drag-to-resize for the sidebar.
 * Returns the current width plus the handlers for the divider between
 * the sidebar and the chat. The chosen width is remembered per browser.
 */
export const useSidebarWidth = () => {
    const [width, setWidth] = useState(readStoredWidth);
    const [dragging, setDragging] = useState(false);
    const frame = useRef(null);

    const startDrag = useCallback((e) => {
        e.preventDefault();
        setDragging(true);
    }, []);

    useEffect(() => {
        if(!dragging) return;

        const onMove = (e) => {
            //coalesce to one update per frame so the drag stays smooth
            if(frame.current) cancelAnimationFrame(frame.current);
            frame.current = requestAnimationFrame(() => setWidth(clamp(e.clientX)));
        };

        const onUp = () => setDragging(false);

        //keep the resize cursor while dragging, even over the chat area
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);

        return () => {
            if(frame.current) cancelAnimationFrame(frame.current);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
        };
    }, [dragging]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, String(width));
    }, [width]);

    //arrow keys nudge it, so the divider works without a mouse
    const onKeyDown = useCallback((e) => {
        if(e.key === "ArrowLeft") setWidth(w => clamp(w - 16));
        else if(e.key === "ArrowRight") setWidth(w => clamp(w + 16));
        else if(e.key === "Home") setWidth(DEFAULT_WIDTH);
        else return;
        e.preventDefault();
    }, []);

    const resetWidth = useCallback(() => setWidth(DEFAULT_WIDTH), []);

    return {width, dragging, startDrag, onKeyDown, resetWidth};
};

export default useSidebarWidth;
