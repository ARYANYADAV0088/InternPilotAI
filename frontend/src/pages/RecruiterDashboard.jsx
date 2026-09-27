import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../lib/api";
import {
  Building2,
  Users,
  PlusCircle,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  UserCheck,
  Eye,
  Sparkles,
  AlertCircle,
  X,
  FileText,
  Filter,
} from "lucide-react";

export default function RecruiterDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(() =>
    location.pathname.includes("applications") ? "applications" : "internships"
  );

  useEffect(() => {
    if (location.pathname.includes("applications")) {
      setActiveTab("applications");
    } else {
      setActiveTab("internships");
    }
  }, [location.pathname]);
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters for Applications
  const [statusFilter, setStatusFilter] = useState("all");
  const [internshipFilter, setInternshipFilter] = useState("all");

  // Selected Application for Review Drawer/Modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [statusDraft, setStatusDraft] = useState("");
  const [interviewDateDraft, setInterviewDateDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  // New Internship Modal State
  const [showPostModal, setShowPostModal] = useState(false);
  const [postingInternship, setPostingInternship] = useState(false);
  const [internshipForm, setInternshipForm] = useState({
    title: "",
    company: "",
    location: "Remote",
    description: "",
    requiredSkills: "",
    duration: "3 Months",
    stipend: "$1,500/month",
    deadline: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [intRes, appRes] = await Promise.all([
        api.get("/api/recruiter/internships"),
        api.get("/api/recruiter/applications"),
      ]);
      setInternships(intRes.data?.internships || []);
      setApplications(appRes.data?.applications || []);
    } catch (err) {
      console.error("Recruiter dashboard fetch error:", err);
      setErrorMsg(
        err.response?.data?.message ||
          "Failed to load recruiter data. Ensure you have recruiter privileges."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Application Review selection
  const openAppReview = (app) => {
    setSelectedApp(app);
    setStatusDraft(app.status || "applied");
    setInterviewDateDraft(
      app.interviewDate
        ? new Date(app.interviewDate).toISOString().slice(0, 16)
        : ""
    );
    setNotesDraft(app.notes || "");
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    setSavingStatus(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api.put(
        `/api/recruiter/applications/${selectedApp._id}/status`,
        {
          status: statusDraft,
          interviewDate: interviewDateDraft || null,
          notes: notesDraft,
        }
      );

      // Update in applications list
      setApplications((prev) =>
        prev.map((a) =>
          a._id === selectedApp._id ? { ...a, ...res.data.application } : a
        )
      );

      setSelectedApp((prev) => ({
        ...prev,
        ...res.data.application,
      }));

      setSuccessMsg(
        `Application updated to "${statusDraft.replace("_", " ").toUpperCase()}" successfully!`
      );
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Update status error:", err);
      setErrorMsg(
        err.response?.data?.message || "Failed to update application status."
      );
    } finally {
      setSavingStatus(false);
    }
  };

  // Handle Post Internship
  const handlePostInternship = async (e) => {
    e.preventDefault();
    setPostingInternship(true);
    setErrorMsg("");
    try {
      const res = await api.post("/api/recruiter/internships", internshipForm);
      setInternships((prev) => [res.data.internship, ...prev]);
      setShowPostModal(false);
      setInternshipForm({
        title: "",
        company: "",
        location: "Remote",
        description: "",
        requiredSkills: "",
        duration: "3 Months",
        stipend: "$1,500/month",
        deadline: "",
      });
      setSuccessMsg("Internship opportunity posted successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Post internship error:", err);
      setErrorMsg(
        err.response?.data?.message || "Failed to post internship."
      );
    } finally {
      setPostingInternship(false);
    }
  };

  // Filtered Applications
  const filteredApps = applications.filter((app) => {
    const matchesStatus =
      statusFilter === "all" || app.status === statusFilter;
    const matchesInternship =
      internshipFilter === "all" ||
      String(app.internshipId?._id) === internshipFilter;
    return matchesStatus && matchesInternship;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "under_review":
        return <span className="status-pill status-review">Under Review</span>;
      case "shortlisted":
        return <span className="status-pill status-shortlist">Shortlisted</span>;
      case "interview":
        return <span className="status-pill status-interview">Interview</span>;
      case "selected":
        return <span className="status-pill status-selected">Selected</span>;
      case "rejected":
        return <span className="status-pill status-rejected">Rejected</span>;
      default:
        return <span className="status-pill status-applied">Applied</span>;
    }
  };

  return (
    <Layout>
      <div className="page-container recruiter-dashboard-page">
        {/* HEADER */}
        <div className="page-header recruiter-header">
          <div>
            <h1 className="page-title">
              <Building2 size={28} className="title-icon text-indigo" />
              Recruiter Talent Management
            </h1>
            <p className="page-subtitle">
              Manage your internship listings, review student applicant profiles,
              schedule interviews, and update application decisions.
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => setShowPostModal(true)}
          >
            <PlusCircle size={18} />
            Post New Internship
          </button>
        </div>

        {errorMsg && (
          <div className="alert-banner alert-error">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert-banner alert-success">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* METRICS ROW */}
        <div className="metrics-grid">
          <div className="metric-card card-shadow">
            <div className="metric-icon bg-indigo-light">
              <BriefcaseBusiness size={22} className="text-indigo" />
            </div>
            <div>
              <h3 className="metric-val">{internships.length}</h3>
              <p className="metric-lbl">Active Listings</p>
            </div>
          </div>

          <div className="metric-card card-shadow">
            <div className="metric-icon bg-blue-light">
              <Users size={22} className="text-blue" />
            </div>
            <div>
              <h3 className="metric-val">{applications.length}</h3>
              <p className="metric-lbl">Total Applicants</p>
            </div>
          </div>

          <div className="metric-card card-shadow">
            <div className="metric-icon bg-purple-light">
              <Calendar size={22} className="text-purple" />
            </div>
            <div>
              <h3 className="metric-val">
                {applications.filter((a) => a.status === "interview").length}
              </h3>
              <p className="metric-lbl">Interviews Scheduled</p>
            </div>
          </div>

          <div className="metric-card card-shadow">
            <div className="metric-icon bg-green-light">
              <UserCheck size={22} className="text-green" />
            </div>
            <div>
              <h3 className="metric-val">
                {applications.filter((a) => a.status === "selected").length}
              </h3>
              <p className="metric-lbl">Offers Sent</p>
            </div>
          </div>
        </div>

        {/* TABS CONTROLLER */}
        <div className="tabs-header">
          <button
            className={`tab-btn ${activeTab === "applications" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("applications");
              navigate("/recruiter/applications");
            }}
          >
            <Users size={18} />
            Candidate Applications ({applications.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "internships" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("internships");
              navigate("/recruiter");
            }}
          >
            <BriefcaseBusiness size={18} />
            My Posted Internships ({internships.length})
          </button>
        </div>

        {loading ? (
          <div className="loading-card">
            <Sparkles size={32} className="spin-slow" />
            <p>Loading recruiter portal...</p>
          </div>
        ) : activeTab === "applications" ? (
          /* TAB 1: APPLICATIONS LIST */
          <div className="applications-panel card-shadow">
            {/* FILTERS TOOLBAR */}
            <div className="filters-toolbar">
              <div className="filter-group">
                <Filter size={16} className="text-muted" />
                <label>Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="applied">Applied</option>
                  <option value="under_review">Under Review</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interview">Interview Scheduled</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Not Selected</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Filter by Role:</label>
                <select
                  value={internshipFilter}
                  onChange={(e) => setInternshipFilter(e.target.value)}
                >
                  <option value="all">All Posted Internships</option>
                  {internships.map((i) => (
                    <option key={i._id} value={i._id}>
                      {i.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredApps.length === 0 ? (
              <div className="empty-state">
                <Users size={40} className="empty-icon" />
                <h4>No candidate applications match this filter</h4>
                <p>When students apply to your postings, their profiles will appear here.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="recruiter-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Applied Role</th>
                      <th>Applied Date</th>
                      <th>ATS Score</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApps.map((app) => (
                      <tr key={app._id}>
                        <td>
                          <div className="candidate-info">
                            <span className="candidate-name">
                              {app.userId?.name || "Student Applicant"}
                            </span>
                            <span className="candidate-email">
                              {app.userId?.email || "No email"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="table-role-title">
                            {app.internshipId?.title || "Internship"}
                          </span>
                        </td>
                        <td>
                          <span className="text-muted">
                            {new Date(
                              app.appliedAt || app.createdAt
                            ).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          {app.resumeId?.aiScore !== undefined ? (
                            <span
                              className={`ats-score-badge ${
                                app.resumeId.aiScore >= 75
                                  ? "score-high"
                                  : app.resumeId.aiScore >= 50
                                  ? "score-mid"
                                  : "score-low"
                              }`}
                            >
                              {app.resumeId.aiScore}%
                            </span>
                          ) : (
                            <span className="text-muted text-sm">Pending</span>
                          )}
                        </td>
                        <td>{getStatusBadge(app.status)}</td>
                        <td>
                          <button
                            className="btn-secondary btn-sm"
                            onClick={() => openAppReview(app)}
                          >
                            <Eye size={15} />
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* TAB 2: INTERNSHIPS LIST */
          <div className="internships-list-panel">
            {internships.length === 0 ? (
              <div className="empty-state card-shadow">
                <BriefcaseBusiness size={44} className="empty-icon" />
                <h4>You haven't posted any internships yet</h4>
                <p>Create your first opportunity to begin attracting top student talent.</p>
                <button
                  className="btn-primary"
                  onClick={() => setShowPostModal(true)}
                >
                  <PlusCircle size={18} />
                  Post First Internship
                </button>
              </div>
            ) : (
              <div className="internships-cards-grid">
                {internships.map((int) => (
                  <div key={int._id} className="internship-recruiter-card card-shadow">
                    <div className="card-top">
                      <div>
                        <h3>{int.title}</h3>
                        <p className="card-company">
                          {int.company} • {int.location}
                        </p>
                      </div>
                      <span
                        className={`status-pill ${
                          int.status === "active" ? "status-selected" : "status-rejected"
                        }`}
                      >
                        {int.status || "active"}
                      </span>
                    </div>

                    <p className="card-desc">
                      {int.description?.slice(0, 140)}...
                    </p>

                    <div className="skills-tags-row">
                      {int.requiredSkills?.slice(0, 4).map((s, idx) => (
                        <span key={idx} className="skill-tag">
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="card-bottom">
                      <div className="stat-pill">
                        <Users size={16} />
                        <span>{int.applicationCount || 0} applicants</span>
                      </div>
                      <span className="text-muted text-sm">
                        {int.stipend || "Unspecified Stipend"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CANDIDATE REVIEW MODAL / DRAWER */}
        {selectedApp && (
          <div className="modal-backdrop" onClick={() => setSelectedApp(null)}>
            <div
              className="modal-content review-drawer card-shadow"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h3>Candidate Review</h3>
                  <p className="text-muted">
                    {selectedApp.userId?.name} — {selectedApp.internshipId?.title}
                  </p>
                </div>
                <button
                  className="close-modal-btn"
                  onClick={() => setSelectedApp(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="review-drawer-body">
                {/* CANDIDATE RESUME SUMMARY */}
                <div className="section-card">
                  <h4>
                    <FileText size={18} className="text-indigo" />
                    Applicant Profile & Credentials
                  </h4>
                  <div className="candidate-details-grid">
                    <div>
                      <label>Email Address</label>
                      <p>{selectedApp.userId?.email || "N/A"}</p>
                    </div>
                    <div>
                      <label>ATS Match Score</label>
                      <p>
                        {selectedApp.resumeId?.aiScore !== undefined ? (
                          <strong className="text-indigo">
                            {selectedApp.resumeId.aiScore}%
                          </strong>
                        ) : (
                          "Not evaluated"
                        )}
                      </p>
                    </div>
                  </div>

                  {selectedApp.resumeId && (
                    <div className="resume-preview-box">
                      <p>
                        <strong>Resume Title:</strong> {selectedApp.resumeId.title}
                      </p>
                      {selectedApp.resumeId.skills?.length > 0 && (
                        <div className="resume-skills-list">
                          <strong>Skills:</strong>
                          <div className="skills-tags-row">
                            {selectedApp.resumeId.skills.map((s, idx) => (
                              <span key={idx} className="skill-tag">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedApp.resumeId.education?.length > 0 && (
                        <p>
                          <strong>Education:</strong>{" "}
                          {selectedApp.resumeId.education.join(" | ")}
                        </p>
                      )}
                      {selectedApp.resumeId.experience?.length > 0 && (
                        <p>
                          <strong>Experience:</strong>{" "}
                          {selectedApp.resumeId.experience.join(" | ")}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* RECRUITER DECISION FORM */}
                <form onSubmit={handleUpdateStatus} className="section-card decision-card">
                  <h4>Recruiter Decision & Scheduling</h4>

                  <div className="form-group">
                    <label>Application Status</label>
                    <select
                      value={statusDraft}
                      onChange={(e) => setStatusDraft(e.target.value)}
                      required
                    >
                      <option value="applied">Applied (Initial Intake)</option>
                      <option value="under_review">Under Review</option>
                      <option value="shortlisted">Shortlisted for Team Review</option>
                      <option value="interview">Interview Scheduled</option>
                      <option value="selected">Offer Extended / Selected</option>
                      <option value="rejected">Not Selected</option>
                    </select>
                  </div>

                  {statusDraft === "interview" && (
                    <div className="form-group">
                      <label>Schedule Interview Date & Time</label>
                      <input
                        type="datetime-local"
                        value={interviewDateDraft}
                        onChange={(e) => setInterviewDateDraft(e.target.value)}
                        required={statusDraft === "interview"}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Recruiter Notes (Feedback / Meeting Links)</label>
                    <textarea
                      rows={3}
                      placeholder="Add internal notes or instructions for the student..."
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                    />
                  </div>

                  <div className="drawer-footer">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setSelectedApp(null)}
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={savingStatus}
                    >
                      {savingStatus ? (
                        <>
                          <Sparkles size={16} className="spin-slow" />
                          Saving Decision...
                        </>
                      ) : (
                        "Save Decision & Notify Candidate"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* POST INTERNSHIP MODAL */}
        {showPostModal && (
          <div className="modal-backdrop" onClick={() => setShowPostModal(false)}>
            <div
              className="modal-content post-modal card-shadow"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h3>Post an Internship</h3>
                  <p className="text-muted">
                    Publish an opportunity for student pilots on InternPilot AI.
                  </p>
                </div>
                <button
                  className="close-modal-btn"
                  onClick={() => setShowPostModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handlePostInternship} className="post-form">
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Job Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Frontend Engineering Intern"
                      value={internshipForm.title}
                      onChange={(e) =>
                        setInternshipForm({ ...internshipForm, title: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Company Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Stripe, OpenAI, TechCorp"
                      value={internshipForm.company}
                      onChange={(e) =>
                        setInternshipForm({
                          ...internshipForm,
                          company: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Remote, San Francisco, CA"
                      value={internshipForm.location}
                      onChange={(e) =>
                        setInternshipForm({
                          ...internshipForm,
                          location: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 3 Months, Summer 2025"
                      value={internshipForm.duration}
                      onChange={(e) =>
                        setInternshipForm({
                          ...internshipForm,
                          duration: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Stipend</label>
                    <input
                      type="text"
                      placeholder="e.g. $2,000/mo or Competitive"
                      value={internshipForm.stipend}
                      onChange={(e) =>
                        setInternshipForm({
                          ...internshipForm,
                          stipend: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Application Deadline</label>
                    <input
                      type="date"
                      value={internshipForm.deadline}
                      onChange={(e) =>
                        setInternshipForm({
                          ...internshipForm,
                          deadline: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Required Skills (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. React, Node.js, TypeScript, REST APIs"
                    value={internshipForm.requiredSkills}
                    onChange={(e) =>
                      setInternshipForm({
                        ...internshipForm,
                        requiredSkills: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Role Description & Responsibilities</label>
                  <textarea
                    rows={4}
                    placeholder="Describe what the intern will learn and deliver..."
                    value={internshipForm.description}
                    onChange={(e) =>
                      setInternshipForm({
                        ...internshipForm,
                        description: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowPostModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={postingInternship}
                  >
                    {postingInternship ? (
                      <>
                        <Sparkles size={16} className="spin-slow" />
                        Posting...
                      </>
                    ) : (
                      "Publish Internship"
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
