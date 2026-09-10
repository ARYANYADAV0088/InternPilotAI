import { useEffect, useState } from "react";
import axios from "axios";
import { User, Save } from "lucide-react";

function Profile() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/users/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setProfile({
          name: response.data.user.name || "",
          email: response.data.user.email || "",
        });
      } catch (error) {
        console.error("Profile error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

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
      await axios.put(
        "http://localhost:5000/api/users/profile",
        {
          name: profile.name,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage("Profile updated successfully.");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="page">Loading profile...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">ACCOUNT</p>
          <h1>My Profile</h1>
          <p>Manage your InternPilot AI profile.</p>
        </div>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">
          <User size={32} />
        </div>

        <form onSubmit={handleSave} className="profile-form">
          <label>Name</label>

          <input
            type="text"
            name="name"
            value={profile.name}
            onChange={handleChange}
            required
          />

          <label>Email</label>

          <input
            type="email"
            value={profile.email}
            disabled
          />

          <button className="primary-btn" type="submit" disabled={saving}>
            <Save size={16} />
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {message && <p className="profile-message">{message}</p>}
        </form>
      </div>
    </div>
  );
}

export default Profile;