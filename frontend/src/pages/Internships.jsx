import { useEffect, useState, useMemo } from "react";
import Layout from "../components/Layout";
import api from "../lib/api";
import {
  BriefcaseBusiness,
  MapPin,
  Bookmark,
  BookmarkCheck,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Eye,
  X,
  Building2,
  Clock,
} from "lucide-react";

function Internships() {
  const [internships, setInternships] = useState([]);
  const [applied, setApplied] = useState([]);
  const [saved, setSaved] = useState([]);
  const [resumes, setResumes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [matchResult, setMatchResult] = useState(null);
  const [matchingId, setMatchingId] = useState(null);
  const [applyingId, setApplyingId] = useState(null);
  const [bannerMsg, setBannerMsg] = useState({ text: "", type: "" });

  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [selectedInternship, setSelectedInternship] = useState(null);

  const showBanner = (text, type = "success") => {
    setBannerMsg({ text, type });
    setTimeout(() => setBannerMsg({ text: "", type: "" }), 4000);
  };

  const fetchData = async () => {
    try {
      const [
        internshipResponse,
        applicationResponse,
        savedResponse,
        resumeResponse,
      ] = await Promise.all([
        api.get("/api/internships"),
        api.get("/api/applications"),
        api.get("/api/internships/saved/list"),
        api.get("/api/resumes"),
      ]);

      setInternships(internshipResponse.data?.internships || []);

      setApplied(
        (applicationResponse.data?.applications || []).map(
          (app) => app.internshipId?._id || app.internshipId
        )
      );

      setSaved(
        (savedResponse.data?.saved || []).map(
          (item) => item.internshipId?._id || item.internshipId
        )
      );

      setResumes(resumeResponse.data?.resumes || []);
    } catch (error) {
      console.error("Failed to load internships:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async (internshipId) => {
    try {
      setApplyingId(internshipId);
      const selectedResume = resumes[0]?._id;

      await api.post("/api/applications", {
        internshipId,
        resumeId: selectedResume || undefined,
        status: "applied",
      });

      setApplied((prev) => [...prev, internshipId]);
      showBanner("Application submitted successfully!");
    } catch (error) {
      console.error("Apply error:", error);
      showBanner(
        error.response?.data?.message || "Unable to apply for this internship.",
        "error"
      );
    } finally {
      setApplyingId(null);
    }
  };

  const handleToggleSave = async (internshipId) => {
    const isSaved = saved.includes(internshipId);
    try {
      if (isSaved) {
        await api.delete(`/api/internships/${internshipId}/save`);
        setSaved((prev) => prev.filter((id) => id !== internshipId));
        showBanner("Internship removed from saved.");
      } else {
        await api.post(`/api/internships/${internshipId}/save`);
        setSaved((prev) => [...prev, internshipId]);
        showBanner("Internship saved to your bookmarks!");
      }
    } catch (error) {
      console.error("Save error:", error);
      showBanner(
        error.response?.data?.message || "Unable to update saved status.",
        "error"
      );
    }
  };

  const handleMatch = async (internshipId) => {
    if (resumes.length === 0) {
      showBanner("Please create a resume first to run AI match.", "error");
      return;
    }

    try {
      setMatchingId(internshipId);
      setMatchResult(null);

      const response = await api.post("/api/matching/match", {
        resumeId: resumes[0]._id,
        internshipId,
      });

      setMatchResult(response.data.analysis);
      showBanner("AI Match Analysis generated!");
    } catch (error) {
      console.error("Match error:", error);
      showBanner(
        error.response?.data?.message || "AI matching analysis failed.",
        "error"
      );
    } finally {
      setMatchingId(null);
    }
  };

  const filteredInternships = useMemo(() => {
    return internships.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        item.title?.toLowerCase().includes(q) ||
        item.company?.toLowerCase().includes(q) ||
        (item.requiredSkills || []).some((s) => s.toLowerCase().includes(q));

      const matchesLocation =
        locationFilter === "all" ||
        (locationFilter === "remote" &&
          item.location?.toLowerCase().includes("remote")) ||
        (locationFilter === "onsite" &&
          !item.location?.toLowerCase().includes("remote"));

      return matchesQuery && matchesLocation;
    });
  }, [internships, searchQuery, locationFilter]);

  return (
    <Layout>
      <div className="page internships-page">
        <div className="page-header">
          <div>
            <p className="eyebrow">EXPLORE OPPORTUNITIES</p>
            <h1>Verified Internships</h1>
            <p>
              Discover active tech internships, evaluate your resume match with
              AI, and apply directly.
            </p>
          </div>
        </div>

        {bannerMsg.text && (
          <div
            className={`alert-banner ${
              bannerMsg.type === "error" ? "alert-error" : "alert-success"
            }`}
          >
            {bannerMsg.type === "error" ? (
              <AlertCircle size={18} />
            ) : (
              <CheckCircle2 size={18} />
            )}
            <span>{bannerMsg.text}</span>
          </div>
        )}

        {/* SEARCH & FILTERS TOOLBAR */}
        <div className="search-filter-toolbar">
          <div className="search-input-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by role title, company name, or technology skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="filter-select-box">
            <Filter size={16} className="filter-icon" />
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              <option value="all">All Locations & Formats</option>
              <option value="remote">Remote Only</option>
              <option value="onsite">On-Site Only</option>
            </select>
          </div>

          <div className="results-counter-chip">
            <span>{filteredInternships.length} opportunities</span>
          </div>
        </div>

        {loading ? (
          <div className="empty-card">
            <Sparkles size={32} className="spin-slow text-indigo" />
            <p>Loading curated opportunities...</p>
          </div>
        ) : filteredInternships.length === 0 ? (
          <div className="empty-card">
            <BriefcaseBusiness size={40} />
            <h3>No internships found</h3>
            <p>
              {searchQuery || locationFilter !== "all"
                ? "No opportunities match your current filters. Try a different search."
                : "Check back shortly as new roles are continuously verified."}
            </p>
            {(searchQuery || locationFilter !== "all") && (
              <button
                type="button"
                className="secondary-btn"
                style={{ marginTop: "12px" }}
                onClick={() => {
                  setSearchQuery("");
                  setLocationFilter("all");
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="internships-grid">
              {filteredInternships.map((internship) => {
                const isApplied = applied.includes(internship._id);
                const isSaved = saved.includes(internship._id);
                const isRemote = internship.location?.toLowerCase().includes("remote");

                return (
                  <div className="internship-item-card" key={internship._id}>
                    <div className="card-top-row">
                      <div className="company-badge-avatar">
                        {internship.company?.charAt(0).toUpperCase() || "I"}
                      </div>
                      <div className="card-heading-col">
                        <h3 className="card-role-title">{internship.title}</h3>
                        <p className="card-company-name">
                          <Building2 size={14} />
                          <span>{internship.company}</span>
                        </p>
                      </div>
                      <button
                        className={`card-action-btn ${isSaved ? "saved-active" : ""}`}
                        onClick={() => handleToggleSave(internship._id)}
                        title={isSaved ? "Remove bookmark" : "Save internship"}
                      >
                        {isSaved ? (
                          <BookmarkCheck size={18} className="text-indigo" />
                        ) : (
                          <Bookmark size={18} />
                        )}
                      </button>
                    </div>

                    <div className="meta-pills-row">
                      <span className={`meta-pill ${isRemote ? "pill-remote" : "pill-onsite"}`}>
                        <MapPin size={13} />
                        {internship.location || "Remote"}
                      </span>
                      {internship.stipend && (
                        <span className="meta-pill pill-stipend">
                          {internship.stipend}
                        </span>
                      )}
                      {internship.duration && (
                        <span className="meta-pill pill-duration">
                          <Clock size={13} />
                          {internship.duration}
                        </span>
                      )}
                    </div>

                    <p className="card-desc-snippet">
                      {internship.description?.slice(0, 140)}...
                    </p>

                    {internship.requiredSkills?.length > 0 && (
                      <div className="skills-tags-row">
                        {internship.requiredSkills.slice(0, 4).map((s, idx) => (
                          <span key={idx} className="skill-tag">
                            {s}
                          </span>
                        ))}
                        {internship.requiredSkills.length > 4 && (
                          <span className="skill-tag skill-tag-more">
                            +{internship.requiredSkills.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="card-actions-footer">
                      <button
                        type="button"
                        className="btn-text-sm"
                        onClick={() => setSelectedInternship(internship)}
                      >
                        <Eye size={15} />
                        View Details
                      </button>

                      <div className="primary-actions-group">
                        <button
                          type="button"
                          className="secondary-btn btn-sm"
                          onClick={() => handleMatch(internship._id)}
                          disabled={matchingId === internship._id}
                        >
                          <Sparkles size={14} />
                          {matchingId === internship._id ? "Matching..." : "AI Match"}
                        </button>

                        {isApplied ? (
                          <button
                            type="button"
                            className="applied-status-chip"
                            disabled
                          >
                            <CheckCircle2 size={14} />
                            Applied
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="primary-btn btn-sm"
                            onClick={() => handleApply(internship._id)}
                            disabled={applyingId === internship._id}
                          >
                            <Send size={14} />
                            {applyingId === internship._id ? "Applying..." : "Apply"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* JOB DETAILS MODAL */}
            {selectedInternship && (
              <div
                className="modal-backdrop"
                onClick={() => setSelectedInternship(null)}
              >
                <div
                  className="modal-content job-details-modal card-shadow"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="modal-header">
                    <div>
                      <h3>{selectedInternship.title}</h3>
                      <p className="text-muted">
                        {selectedInternship.company} • {selectedInternship.location}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="close-modal-btn"
                      onClick={() => setSelectedInternship(null)}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="modal-body job-details-body">
                    <div className="job-meta-banner">
                      <div className="meta-stat">
                        <label>Location</label>
                        <p>{selectedInternship.location || "Remote"}</p>
                      </div>
                      <div className="meta-stat">
                        <label>Compensation</label>
                        <p>{selectedInternship.stipend || "Competitive / Unpaid"}</p>
                      </div>
                      <div className="meta-stat">
                        <label>Duration</label>
                        <p>{selectedInternship.duration || "3 Months"}</p>
                      </div>
                      <div className="meta-stat">
                        <label>Status</label>
                        <p className="text-green font-semibold">Active Opportunity</p>
                      </div>
                    </div>

                    <div className="job-description-section">
                      <h4>Role Overview & Description</h4>
                      <p className="job-description-text">
                        {selectedInternship.description}
                      </p>
                    </div>

                    {selectedInternship.requiredSkills?.length > 0 && (
                      <div className="job-skills-section">
                        <h4>Target Technical Skills</h4>
                        <div className="skills-tags-row">
                          {selectedInternship.requiredSkills.map((s, idx) => (
                            <span key={idx} className="skill-tag">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => setSelectedInternship(null)}
                    >
                      Close
                    </button>

                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => {
                        handleMatch(selectedInternship._id);
                        setSelectedInternship(null);
                      }}
                    >
                      <Sparkles size={15} />
                      AI Match Fit
                    </button>

                    {!applied.includes(selectedInternship._id) ? (
                      <button
                        type="button"
                        className="primary-btn"
                        onClick={() => {
                          handleApply(selectedInternship._id);
                          setSelectedInternship(null);
                        }}
                      >
                        <Send size={15} />
                        Apply Now
                      </button>
                    ) : (
                      <button type="button" className="applied-status-chip" disabled>
                        <CheckCircle2 size={15} />
                        Already Applied
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* AI MATCH RESULT PANEL */}
            {matchResult && (
              <div className="panel" style={{ marginTop: "32px" }}>
                <p className="eyebrow">AI FIT EVALUATION</p>
                <h2>Match Compatibility Score: {matchResult.score}/100</h2>

                <div style={{ marginTop: "16px" }}>
                  <h3>Matched Skills</h3>
                  <div className="tag-list">
                    {matchResult.matchedSkills?.map((skill, index) => (
                      <span className="tag" key={index}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: "16px" }}>
                  <h3>Missing Requirements</h3>
                  <div className="tag-list">
                    {matchResult.missingSkills?.map((skill, index) => (
                      <span className="tag tag-missing" key={index}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: "16px" }}>
                  <h3>Recommended Preparation</h3>
                  <ul className="analysis-bullet-list">
                    {matchResult.suggestions?.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ marginTop: "16px" }}>
                  <h3>AI Recruiter Insights</h3>
                  {matchResult.insights?.length ? (
                    <ul className="analysis-bullet-list">
                      {matchResult.insights.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                      {matchResult.explanation || "AI analysis completed successfully."}
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

export default Internships;