import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../lib/api";
import { User, Save, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

function Profile() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "student",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/api/users/profile");
        const u = response.data.user;
        setProfile({
          name: u.name || "",
          email: u.email || "",
          role: u.role || "student",
        });
      } catch (error) {
        console.error("Profile error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await api.put("/api/users/profile", {
        name: profile.name,
      });

      setMessage("Profile updated successfully!");
      // Update local storage
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      user.name = profile.name;
      localStorage.setItem("user", JSON.stringify(user));
      setTimeout(() => setMessage(""), 3500);
    } catch (error) {
      console.error("Save error:", error);
      setMessage("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">SETTINGS & ACCOUNT</p>
            <h1>User Profile</h1>
            <p>Manage your account settings and credentials.</p>
          </div>
        </div>

        {loading ? (
          <div className="empty-card">Loading profile...</div>
        ) : (
          <div className="profile-container" style={{ maxWidth: "560px" }}>
            <div className="panel profile-card">
              <div className="profile-avatar-row">
                <div className="profile-avatar">
                  <User size={36} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px" }}>{profile.name}</h3>
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                    <span
                      className={`status-pill ${
                        profile.role === "recruiter"
                          ? "status-selected"
                          : "status-review"
                      }`}
                    >
                      <ShieldCheck size={13} />
                      {profile.role === "recruiter"
                        ? "Recruiter Account"
                        : "Student Pilot"}
                    </span>
                  </div>
                </div>
              </div>

              {message && (
                <div className="alert-banner alert-success" style={{ marginTop: "16px" }}>
                  <CheckCircle2 size={16} />
                  <span>{message}</span>
                </div>
              )}

              <form onSubmit={handleSave} style={{ marginTop: "20px" }}>
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  required
                />

                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  disabled
                  style={{ opacity: 0.7, cursor: "not-allowed" }}
                />
                <small style={{ color: "var(--text-muted)", fontSize: "12px", display: "block", marginTop: "4px" }}>
                  Email address cannot be changed.
                </small>

                <div style={{ marginTop: "24px" }}>
                  <button className="primary-btn" type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Sparkles size={16} className="spin-slow" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Profile;