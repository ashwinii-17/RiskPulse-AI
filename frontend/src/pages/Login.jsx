import { useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Invalid email or password."
        );
      }

      localStorage.setItem(
        "riskpulse_access_token",
        data.access_token
      );

      localStorage.setItem(
        "riskpulse_user",
        JSON.stringify(data.user)
      );

      onLogin(data.user);
    } catch (err) {
      setError(
        err.message ||
          "Unable to sign in. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* RiskPulse Branding */}
        <div className="login-brand">

          <div className="login-logo">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M24 4L40 10V21.5C40 31.7 33.5 40.3 24 44C14.5 40.3 8 31.7 8 21.5V10L24 4Z"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinejoin="round"
              />

              <path
                d="M16 24.5L21.5 30L33 18"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="login-brand-text">
            <div className="login-brand-name">
              Risk<span>Pulse</span>
            </div>

            <div className="login-brand-caption">
              AI RISK INTELLIGENCE
            </div>
          </div>

        </div>


        {/* Heading */}
        <div className="login-heading">

          <h1>
            Welcome back
          </h1>

          <p>
            Sign in to access the RiskPulse analyst dashboard.
          </p>

        </div>


        {/* Login Form */}
        <form onSubmit={handleSubmit}>

          <div className="login-field">

            <label htmlFor="login-email">
              Email
            </label>

            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Enter your email"
              autoComplete="email"
              disabled={isLoading}
            />

          </div>


          <div className="login-field">

            <label htmlFor="login-password">
              Password
            </label>

            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={isLoading}
            />

          </div>


          {error && (
            <div className="login-error">
              {error}
            </div>
          )}


          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading
              ? "Signing in..."
              : "Sign in"}
          </button>

        </form>


        {/* Footer */}
        <div className="login-footer">
          <span>
            Secure analyst access
          </span>

          <span>
            RiskPulse AI
          </span>
        </div>

      </div>
    </div>
  );
};

export default Login;