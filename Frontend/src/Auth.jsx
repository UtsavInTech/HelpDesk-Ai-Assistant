import "./Auth.css";
import { useContext, useState } from "react";
import { MyContext } from "./MyContext.jsx";
import logo from "./assets/blacklogo.png";

//same rules the backend enforces, checked here so the user gets instant feedback
const passwordRules = [
    {label: "At least 8 characters", test: (p) => p.length >= 8},
    {label: "One lowercase letter", test: (p) => /[a-z]/.test(p)},
    {label: "One uppercase letter", test: (p) => /[A-Z]/.test(p)},
    {label: "One number", test: (p) => /[0-9]/.test(p)},
    {label: "One special character", test: (p) => /[^A-Za-z0-9]/.test(p)}
];

function Auth() {
    const { login, signup } = useContext(MyContext);

    const [mode, setMode] = useState("login"); // "login" | "signup"
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const isSignup = mode === "signup";
    const passwordOk = passwordRules.every(rule => rule.test(password));

    const switchMode = () => {
        setMode(isSignup ? "login" : "signup");
        setError("");
        setPassword("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if(!email.trim() || !password) {
            setError("Please enter your email and password");
            return;
        }

        if(isSignup && !passwordOk) {
            setError("Please choose a stronger password");
            return;
        }

        setLoading(true);
        try {
            if(isSignup) {
                await signup(name, email, password);
            } else {
                await login(email, password);
            }
        } catch(err) {
            setError(err.message);
        }
        setLoading(false);
    };

    return (
        <div className="authPage">
            <form className="authCard" onSubmit={handleSubmit}>

                <img src={logo} alt="SigmaGPT logo" className="authLogo" />

                <h1 className="authTitle">
                    {isSignup ? "Create your account" : "Welcome back"}
                </h1>
                <p className="authSubtitle">
                    {isSignup
                        ? "Sign up to keep your chats private and in sync."
                        : "Log in to continue with SigmaGPT."}
                </p>

                {isSignup &&
                    <label className="authField">
                        <span>Name <em>(optional)</em></span>
                        <input
                            type="text"
                            placeholder="Atul"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoComplete="name"
                        />
                    </label>
                }

                <label className="authField">
                    <span>Email</span>
                    <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                    />
                </label>

                <label className="authField">
                    <span>Password</span>
                    <div className="passwordWrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder={isSignup ? "Create a strong password" : "Your password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete={isSignup ? "new-password" : "current-password"}
                            required
                        />
                        <button
                            type="button"
                            className="togglePassword"
                            onClick={() => setShowPassword(!showPassword)}
                            title={showPassword ? "Hide password" : "Show password"}
                        >
                            <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                        </button>
                    </div>
                </label>

                {isSignup &&
                    <ul className="passwordRules">
                        {passwordRules.map(rule => {
                            const ok = rule.test(password);
                            return (
                                <li key={rule.label} className={ok ? "ok" : ""}>
                                    <i className={ok ? "fa-solid fa-circle-check" : "fa-regular fa-circle"}></i>
                                    {rule.label}
                                </li>
                            );
                        })}
                    </ul>
                }

                {error && <p className="authError"><i className="fa-solid fa-triangle-exclamation"></i> {error}</p>}

                <button type="submit" className="authSubmit" disabled={loading}>
                    {loading
                        ? (isSignup ? "Creating account..." : "Logging in...")
                        : (isSignup ? "Create account" : "Log in")}
                </button>

                <p className="authSwitch">
                    {isSignup ? "Already have an account?" : "New to SigmaGPT?"}
                    <button type="button" onClick={switchMode}>
                        {isSignup ? "Log in" : "Create one"}
                    </button>
                </p>

            </form>
        </div>
    );
}

export default Auth;
