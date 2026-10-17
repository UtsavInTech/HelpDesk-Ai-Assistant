import "./Settings.css";
import { useContext, useEffect, useState } from "react";
import { MyContext } from "./MyContext.jsx";
import { apiFetch, setToken } from "./api.js";
import { THEMES } from "./useTheme.js";

//same rules the backend enforces, mirrored for instant feedback
const passwordRules = [
    {label: "At least 8 characters", test: (p) => p.length >= 8},
    {label: "One lowercase letter", test: (p) => /[a-z]/.test(p)},
    {label: "One uppercase letter", test: (p) => /[A-Z]/.test(p)},
    {label: "One number", test: (p) => /[0-9]/.test(p)},
    {label: "One special character", test: (p) => /[^A-Za-z0-9]/.test(p)}
];

const themeOptions = [
    {id: "system", label: "System", icon: "fa-solid fa-desktop"},
    {id: "light", label: "Light", icon: "fa-solid fa-sun"},
    {id: "dark", label: "Dark", icon: "fa-solid fa-moon"}
];

const TABS = [
    {id: "general", label: "General", icon: "fa-solid fa-sliders"},
    {id: "account", label: "Account", icon: "fa-solid fa-user"},
    {id: "security", label: "Security", icon: "fa-solid fa-lock"}
];

function Settings({ onClose }) {
    const { user, setUser, theme, setTheme } = useContext(MyContext);

    const [tab, setTab] = useState("general");

    const [name, setName] = useState(user?.name || "");
    const [nameSaving, setNameSaving] = useState(false);
    const [nameMessage, setNameMessage] = useState(null);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPasswords, setShowPasswords] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState(null);

    //close on Escape, like every other dialog
    useEffect(() => {
        const onKeyDown = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    const passwordOk = passwordRules.every(rule => rule.test(newPassword));
    const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

    const saveName = async (e) => {
        e.preventDefault();
        setNameMessage(null);
        setNameSaving(true);

        try {
            const data = await apiFetch("/api/auth/me", {method: "PATCH", body: {name}});
            setUser(data.user);
            setNameMessage({type: "ok", text: "Name updated"});
        } catch (err) {
            setNameMessage({type: "error", text: err.message});
        }

        setNameSaving(false);
    };

    const savePassword = async (e) => {
        e.preventDefault();
        setPasswordMessage(null);

        if(!passwordOk) {
            setPasswordMessage({type: "error", text: "Please choose a stronger password"});
            return;
        }

        if(!passwordsMatch) {
            setPasswordMessage({type: "error", text: "The two new passwords do not match"});
            return;
        }

        setPasswordSaving(true);

        try {
            const data = await apiFetch("/api/auth/me/password", {
                method: "PATCH",
                body: {currentPassword, newPassword}
            });

            //the server issues a fresh token so the session survives the change
            setToken(data.token);
            setUser(data.user);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordMessage({type: "ok", text: "Password changed"});
        } catch (err) {
            setPasswordMessage({type: "error", text: err.message});
        }

        setPasswordSaving(false);
    };

    return (
        <div className="settingsOverlay" onMouseDown={onClose}>
            <div
                className="settingsModal"
                role="dialog"
                aria-modal="true"
                aria-label="Settings"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <header className="settingsHeader">
                    <h2>Settings</h2>
                    <button className="icon-btn" onClick={onClose} aria-label="Close settings">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </header>

                <div className="settingsBody">
                    <nav className="settingsTabs">
                        {
                            TABS.map(t => (
                                <button
                                    key={t.id}
                                    className={`settingsTab ${tab === t.id ? "active" : ""}`}
                                    onClick={() => setTab(t.id)}
                                >
                                    <i className={t.icon}></i>
                                    <span>{t.label}</span>
                                </button>
                            ))
                        }
                    </nav>

                    <div className="settingsPanel">

                        {tab === "general" &&
                            <section className="settingsSection">
                                <div className="settingsRow">
                                    <div className="settingsRowLabel">
                                        <span>Theme</span>
                                        <small>System follows your device appearance.</small>
                                    </div>

                                    <div className="themeChoice">
                                        {
                                            themeOptions.filter(o => THEMES.includes(o.id)).map(option => (
                                                <button
                                                    key={option.id}
                                                    className={`themeOption ${theme === option.id ? "active" : ""}`}
                                                    onClick={() => setTheme(option.id)}
                                                    aria-pressed={theme === option.id}
                                                >
                                                    <i className={option.icon}></i>
                                                    <span>{option.label}</span>
                                                </button>
                                            ))
                                        }
                                    </div>
                                </div>

                                <div className="settingsRow">
                                    <div className="settingsRowLabel">
                                        <span>PDF attachments</span>
                                        <small>
                                            Attach a PDF from the paperclip in the message box.
                                            Up to 3 PDFs per chat, 10&nbsp;MB each.
                                        </small>
                                    </div>
                                </div>
                            </section>
                        }

                        {tab === "account" &&
                            <section className="settingsSection">
                                <div className="settingsRow">
                                    <div className="settingsRowLabel">
                                        <span>Email</span>
                                        <small>Your email cannot be changed.</small>
                                    </div>
                                    <span className="settingsStatic">{user?.email}</span>
                                </div>

                                <form className="settingsForm" onSubmit={saveName}>
                                    <label className="settingsField">
                                        <span>Display name</span>
                                        <input
                                            type="text"
                                            value={name}
                                            placeholder="Your name"
                                            maxLength={60}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </label>

                                    {nameMessage &&
                                        <p className={`settingsMessage ${nameMessage.type}`}>
                                            <i className={nameMessage.type === "ok"
                                                ? "fa-solid fa-circle-check"
                                                : "fa-solid fa-triangle-exclamation"}></i>
                                            {nameMessage.text}
                                        </p>
                                    }

                                    <button
                                        type="submit"
                                        className="settingsSubmit"
                                        disabled={nameSaving || name === (user?.name || "")}
                                    >
                                        {nameSaving ? "Saving..." : "Save name"}
                                    </button>
                                </form>
                            </section>
                        }

                        {tab === "security" &&
                            <section className="settingsSection">
                                <form className="settingsForm" onSubmit={savePassword}>
                                    <label className="settingsField">
                                        <span>Current password</span>
                                        <input
                                            type={showPasswords ? "text" : "password"}
                                            value={currentPassword}
                                            autoComplete="current-password"
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                        />
                                    </label>

                                    <label className="settingsField">
                                        <span>New password</span>
                                        <input
                                            type={showPasswords ? "text" : "password"}
                                            value={newPassword}
                                            autoComplete="new-password"
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                    </label>

                                    <label className="settingsField">
                                        <span>Confirm new password</span>
                                        <input
                                            type={showPasswords ? "text" : "password"}
                                            value={confirmPassword}
                                            autoComplete="new-password"
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </label>

                                    <label className="settingsCheckbox">
                                        <input
                                            type="checkbox"
                                            checked={showPasswords}
                                            onChange={(e) => setShowPasswords(e.target.checked)}
                                        />
                                        <span>Show passwords</span>
                                    </label>

                                    <ul className="passwordRules">
                                        {passwordRules.map(rule => {
                                            const ok = rule.test(newPassword);
                                            return (
                                                <li key={rule.label} className={ok ? "ok" : ""}>
                                                    <i className={ok ? "fa-solid fa-circle-check" : "fa-regular fa-circle"}></i>
                                                    {rule.label}
                                                </li>
                                            );
                                        })}
                                        <li className={passwordsMatch ? "ok" : ""}>
                                            <i className={passwordsMatch ? "fa-solid fa-circle-check" : "fa-regular fa-circle"}></i>
                                            Both new passwords match
                                        </li>
                                    </ul>

                                    {passwordMessage &&
                                        <p className={`settingsMessage ${passwordMessage.type}`}>
                                            <i className={passwordMessage.type === "ok"
                                                ? "fa-solid fa-circle-check"
                                                : "fa-solid fa-triangle-exclamation"}></i>
                                            {passwordMessage.text}
                                        </p>
                                    }

                                    <button
                                        type="submit"
                                        className="settingsSubmit"
                                        disabled={passwordSaving || !currentPassword || !passwordOk || !passwordsMatch}
                                    >
                                        {passwordSaving ? "Changing..." : "Change password"}
                                    </button>
                                </form>
                            </section>
                        }

                    </div>
                </div>
            </div>
        </div>
    );
}

export default Settings;
