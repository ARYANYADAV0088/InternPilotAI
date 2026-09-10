import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Bookmark, MapPin, Send } from "lucide-react";

function SavedInternships() {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/internships/saved/list",
          {
            headers: {
              Authorization: "Bearer " + token,
            },
          }
        );

        setSaved(response.data.saved || []);
      } catch (error) {
        console.error(
          "Failed to load saved internships:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSaved();
  }, [token]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">BOOKMARKED</p>
          <h1>Saved Internships</h1>
          <p>Your saved internship opportunities.</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-card">
          Loading saved internships...
        </div>
      ) : saved.length === 0 ? (
        <div className="empty-card">
          <Bookmark size={40} />
          <h3>No saved internships</h3>
          <p>
            Save an internship and it will appear here.
          </p>
        </div>
      ) : (
        <div className="resume-grid">
          {saved.map((item) => {
            const internship = item.internshipId;

            if (!internship) return null;

            return (
              <div
                className="resume-card"
                key={item._id}
              >
                <div className="resume-icon">
                  <Bookmark size={24} />
                </div>

                <h3>{internship.title}</h3>

                <p>{internship.company}</p>

                {internship.location && (
                  <p className="location">
                    <MapPin size={13} />
                    {internship.location}
                  </p>
                )}

                <button
                  className="primary-btn"
                  onClick={() =>
                    navigate("/internships")
                  }
                >
                  <Send size={15} />
                  View Internship
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SavedInternships;