import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import API_URL from "../api";
import { Sparkles, GraduationCap, Building2 } from "lucide-react";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        name,
        email,
        password,
        role,
      });

      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Sparkles size={25} />
          <span>InternPilot AI</span>
        </div>

        <h1>Create your account</h1>

        <p className="auth-subtitle">
          Join InternPilot AI as a Student or Recruiter.
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleRegister}>
          {/* ROLE SELECTOR */}
          <div className="role-selection-group">
            <label className="group-label">I am joining as:</label>
            <div className="role-options">
              <button
                type="button"
                className={`role-option-btn ${role === "student" ? "active" : ""}`}
                onClick={() => setRole("student")}
              >
                <GraduationCap size={20} />
                <span>Student / Candidate</span>
              </button>
              <button
                type="button"
                className={`role-option-btn ${role === "recruiter" ? "active" : ""}`}
                onClick={() => setRole("recruiter")}
              >
                <Building2 size={20} />
                <span>Recruiter / Hiring Manager</span>
              </button>
            </div>
          </div>

          <label>Full Name</label>
          <input
            type="text"
            placeholder={role === "recruiter" ? "e.g. Sarah Miller" : "e.g. Alex Johnson"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label>Email Address</label>
          <input
            type="email"
            placeholder={role === "recruiter" ? "recruiter@company.com" : "student@university.edu"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Creating Account..." : `Sign Up as ${role === "recruiter" ? "Recruiter" : "Student"}`}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;