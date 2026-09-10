import { useEffect, useState } from "react";
import axios from "axios";
import {
  BriefcaseBusiness,
  MapPin,
  Bookmark,
  Send,
  Sparkles,
} from "lucide-react";

function Internships() {
  const [internships, setInternships] = useState([]);
  const [applied, setApplied] = useState([]);
  const [saved, setSaved] = useState([]);
  const [resumes, setResumes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [matchResult, setMatchResult] = useState(null);
  const [matchingId, setMatchingId] = useState(null);

  const token = localStorage.getItem("token");

  const headers = {
    Authorization: "Bearer " + token,
  };

  const fetchData = async () => {
    try {
      const [
        internshipResponse,
        applicationResponse,
        savedResponse,
        resumeResponse,
      ] = await Promise.all([
        axios.get(
          "http://localhost:5000/api/internships",
          { headers }
        ),

        axios.get(
          "http://localhost:5000/api/applications",
          { headers }
        ),

        axios.get(
          "http://localhost:5000/api/internships/saved/list",
          { headers }
        ),

        axios.get(
          "http://localhost:5000/api/resumes",
          { headers }
        ),
      ]);

      setInternships(
        internshipResponse.data.internships || []
      );

      setApplied(
        (applicationResponse.data.applications || []).map(
          (app) =>
            app.internshipId?._id ||
            app.internshipId
        )
      );

      setSaved(
        (savedResponse.data.saved || []).map(
          (item) =>
            item.internshipId?._id ||
            item.internshipId
        )
      );

      setResumes(
        resumeResponse.data.resumes || []
      );
    } catch (error) {
      console.error(
        "Failed to load internships:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async (internshipId) => {
    try {
      await axios.post(
        "http://localhost:5000/api/applications",
        {
          internshipId,
          status: "applied",
        },
        {
          headers,
        }
      );

      setApplied((prev) => [
        ...prev,
        internshipId,
      ]);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Unable to apply for this internship."
      );
    }
  };

  const handleSave = async (internshipId) => {
    if (saved.includes(internshipId)) {
      return;
    }

    try {
      await axios.post(
        `http://localhost:5000/api/internships/${internshipId}/save`,
        {},
        {
          headers,
        }
      );

      setSaved((prev) => [
        ...prev,
        internshipId,
      ]);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Unable to save internship."
      );
    }
  };

  const handleMatch = async (internshipId) => {
    if (resumes.length === 0) {
      alert("Please create a resume first.");
      return;
    }

    try {
      setMatchingId(internshipId);
      setMatchResult(null);

      const resumeId = resumes[0]._id;

      const response = await axios.post(
        "http://localhost:5000/api/matching",
        {
          resumeId,
          internshipId,
        },
        {
          headers,
        }
      );

      setMatchResult({
        internshipId,
        ...response.data.analysis,
      });
    } catch (error) {
      console.error(
        "Resume matching error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Unable to match resume."
      );
    } finally {
      setMatchingId(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            OPPORTUNITIES
          </p>

          <h1>Internships</h1>

          <p>
            Discover internships that match your
            skills.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="empty-card">
          Loading internships...
        </div>
      ) : internships.length === 0 ? (
        <div className="empty-card">
          <BriefcaseBusiness size={40} />

          <h3>No internships available</h3>

          <p>
            New opportunities will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="resume-grid">
            {internships.map((internship) => {
              const hasApplied =
                applied.includes(internship._id);

              const hasSaved =
                saved.includes(internship._id);

              const isMatching =
                matchingId === internship._id;

              return (
                <div
                  className="resume-card"
                  key={internship._id}
                >
                  <div className="resume-icon">
                    <BriefcaseBusiness size={24} />
                  </div>

                  <h3>{internship.title}</h3>

                  <p>{internship.company}</p>

                  {internship.location && (
                    <p className="location">
                      <MapPin size={13} />
                      {internship.location}
                    </p>
                  )}

                  {internship.requiredSkills?.length >
                    0 && (
                    <p>
                      <strong>Skills:</strong>{" "}
                      {internship.requiredSkills.join(
                        ", "
                      )}
                    </p>
                  )}

                  <div className="internship-actions">

                    <button
                      className="secondary-btn"
                      disabled={isMatching}
                      onClick={() =>
                        handleMatch(
                          internship._id
                        )
                      }
                    >
                      <Sparkles size={15} />

                      {isMatching
                        ? "Matching..."
                        : "Match Resume"}
                    </button>

                    <button
                      className="secondary-btn"
                      disabled={hasSaved}
                      onClick={() =>
                        handleSave(
                          internship._id
                        )
                      }
                    >
                      <Bookmark size={15} />

                      {hasSaved
                        ? "Saved"
                        : "Save"}
                    </button>

                    <button
                      className="primary-btn"
                      disabled={hasApplied}
                      onClick={() =>
                        handleApply(
                          internship._id
                        )
                      }
                    >
                      <Send size={15} />

                      {hasApplied
                        ? "Applied"
                        : "Apply"}
                    </button>

                  </div>
                </div>
              );
            })}
          </div>

          {matchResult && (
            <div
              className="panel"
              style={{
                marginTop: "24px",
              }}
            >
              <p className="eyebrow">
                AI INTERNSHIP MATCH
              </p>

              <h2>
                Match Score:{" "}
                {matchResult.score}/100
              </h2>

              <h3>Matched Skills</h3>

              <p>
                {matchResult.matchedSkills?.length
                  ? matchResult.matchedSkills.join(
                      ", "
                    )
                  : "No matched skills"}
              </p>

              <h3>Missing Skills</h3>

              <p>
                {matchResult.missingSkills?.length
                  ? matchResult.missingSkills.join(
                      ", "
                    )
                  : "No missing skills"}
              </p>

              <h3>Strengths</h3>

              <ul>
                {matchResult.strengths?.map(
                  (item, index) => (
                    <li key={index}>
                      {item}
                    </li>
                  )
                )}
              </ul>

              <h3>Weaknesses</h3>

              <ul>
                {matchResult.weaknesses?.map(
                  (item, index) => (
                    <li key={index}>
                      {item}
                    </li>
                  )
                )}
              </ul>

              <h3>Suggestions</h3>

              <ul>
                {matchResult.suggestions?.map(
                  (item, index) => (
                    <li key={index}>
                      {item}
                    </li>
                  )
                )}
              </ul>

              <h3>AI Explanation</h3>

{matchResult.insights?.length ? (
  <ul>
    {matchResult.insights.map((item, index) => (
      <li key={index}>{item}</li>
    ))}
  </ul>
) : (
  <p>
    {matchResult.explanation ||
      "AI analysis completed successfully."}
  </p>
)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Internships;