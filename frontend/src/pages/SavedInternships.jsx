import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../lib/api";
import { Bookmark, MapPin, Send, BookmarkCheck, Trash2, ArrowRight } from "lucide-react";

function SavedInternships() {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unsavingId, setUnsavingId] = useState(null);

  const navigate = useNavigate();

  const fetchSaved = async () => {
    try {
      const response = await api.get("/api/internships/saved/list");
      setSaved(response.data.saved || []);
    } catch (error) {
      console.error("Failed to load saved internships:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const handleUnsave = async (internshipId) => {
    setUnsavingId(internshipId);
    try {
      await api.delete(`/api/internships/${internshipId}/save`);
      setSaved((prev) => prev.filter((item) => item.internshipId?._id !== internshipId));
    } catch (error) {
      console.error("Failed to unsave internship:", error);
    } finally {
      setUnsavingId(null);
    }
  };

  return (
    <Layout>
      <div className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">BOOKMARKED</p>
            <h1>Saved Internships</h1>
            <p>Your saved internship opportunities ready for review and application.</p>
          </div>
        </div>

        {loading ? (
          <div className="empty-card">Loading saved internships...</div>
        ) : saved.length === 0 ? (
          <div className="empty-card">
            <Bookmark size={40} />
            <h3>No saved internships</h3>
            <p>Save interesting opportunities to quickly compare and apply.</p>
            <button
              className="primary-btn"
              onClick={() => navigate("/internships")}
              style={{ marginTop: "16px" }}
            >
              Browse Internships <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="resume-grid">
            {saved.map((item) => {
              const internship = item.internshipId;
              if (!internship) return null;

              return (
                <div className="resume-card" key={item._id}>
                  <div className="resume-card-header">
                    <div className="resume-icon">
                      <BookmarkCheck size={24} className="text-indigo" />
                    </div>
                    <button
                      className="card-action-btn delete-btn"
                      onClick={() => handleUnsave(internship._id)}
                      disabled={unsavingId === internship._id}
                      title="Remove from saved"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <h3>{internship.title}</h3>
                  <p className="company-text">{internship.company}</p>

                  {internship.location && (
                    <p className="location">
                      <MapPin size={13} />
                      {internship.location}
                    </p>
                  )}

                  {internship.requiredSkills?.length > 0 && (
                    <div className="skills-tags-row" style={{ margin: "12px 0" }}>
                      {internship.requiredSkills.slice(0, 3).map((s, idx) => (
                        <span key={idx} className="skill-tag">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                    <button
                      className="primary-btn"
                      onClick={() => navigate("/internships")}
                    >
                      <Send size={15} />
                      View Internship
                    </button>
                    <button
                      className="secondary-btn"
                      onClick={() => handleUnsave(internship._id)}
                      disabled={unsavingId === internship._id}
                    >
                      Unsave
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default SavedInternships;