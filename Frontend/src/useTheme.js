import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "sigmagpt_theme";
export const THEMES = ["system", "light", "dark"];

const readStoredTheme = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(stored) ? stored : "system";
};

const systemPrefersDark = () =>
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;

/**
 * "system" follows the OS and keeps following it while the app is open;
 * "light" / "dark" pin the choice. The resolved value is written to
 * <html data-theme> so the CSS variables in index.css do the rest.
 */
export const useTheme = () => {
    const [theme, setThemeState] = useState(readStoredTheme);

    const apply = useCallback((choice) => {
        const resolved = choice === "system" ? (systemPrefersDark() ? "dark" : "light") : choice;
        document.documentElement.setAttribute("data-theme", resolved);
        document.documentElement.style.colorScheme = resolved;
    }, []);

    useEffect(() => {
        apply(theme);

        if(theme !== "system") return;

        //keep tracking the OS while "system" is selected
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const onChange = () => apply("system");

        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
    }, [theme, apply]);

    const setTheme = useCallback((choice) => {
        if(!THEMES.includes(choice)) return;
        localStorage.setItem(STORAGE_KEY, choice);
        setThemeState(choice);
    }, []);

    return {theme, setTheme};
};

export default useTheme;
