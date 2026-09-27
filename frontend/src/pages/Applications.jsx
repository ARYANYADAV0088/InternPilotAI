import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../lib/api";
import {
  ClipboardCheck,
  Calendar,
  Clock,
  Building2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileText,
} from "lucide-react";

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [bannerMsg, setBannerMsg] = useState({ text: "", type: "" });

  const showBanner = (text, type = "success") => {
    setBannerMsg({ text, type });
    setTimeout(() => setBannerMsg({ text: "", type: "" }), 4000);
  };

  const fetchApplications = async () => {
    try {
      const response = await api.get("/api/applications");
      setApplications(response.data.applications || []);
    } catch (error) {
      console.error("Failed to fetch applications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleWithdraw = async (applicationId) => {
    if (!window.confirm("Are you sure you want to withdraw this application?")) {
      return;
    }
    setWithdrawingId(applicationId);
    try {
      await api.delete(`/api/applications/${applicationId}`);
      setApplications((prev) => prev.filter((a) => a._id !== applicationId));
      showBanner("Application withdrawn successfully.");
    } catch (error) {
      console.error("Withdraw error:", error);
      showBanner(
        error.response?.data?.message || "Failed to withdraw application.",
        "error"
      );
    } finally {
      setWithdrawingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "under_review":
        return <span className="status-pill status-review">Under Review</span>;
      case "shortlisted":
        return <span className="status-pill status-shortlist">Shortlisted</span>;
      case "interview":
        return <span className="status-pill status-interview">Interview Scheduled</span>;
      case "selected":
        return <span className="status-pill status-selected">Offer Extended</span>;
      case "rejected":
        return <span className="status-pill status-rejected">Not Selected</span>;
      default:
        return <span className="status-pill status-applied">Applied</span>;
    }
  };

  return (
    <Layout>
      <div className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">APPLICATION TRACKER</p>
            <h1>My Applications</h1>
            <p>
              Track your real-time application statuses, scheduled interviews, and
              recruiter decisions.
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

        {loading ? (
          <div className="empty-card">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="empty-card">
            <ClipboardCheck size={40} />
            <h3>No applications submitted yet</h3>
            <p>Explore verified opportunities and submit your profile.</p>
            <Link to="/internships" className="primary-btn" style={{ marginTop: "16px" }}>
              Explore Internships
            </Link>
          </div>
        ) : (
          <div className="application-list">
            {applications.map((application) => (
              <div className="application-card" key={application._id}>
                <div className="application-icon">
                  <ClipboardCheck size={24} />
                </div>

                <div className="application-info">
                  <h3>{application.internshipId?.title || "Internship Role"}</h3>
                  <p className="company-text">
                    <Building2 size={15} />
                    {application.internshipId?.company || "Company"} •{" "}
                    {application.internshipId?.location || "Remote"}
                  </p>

                  <div className="application-meta-row">
                    <span className="applied-date">
                      <Clock size={14} /> Applied on{" "}
                      {new Date(
                        application.appliedAt || application.createdAt
                      ).toLocaleDateString()}
                    </span>

                    {application.resumeId && (
                      <span className="applied-resume-pill">
                        <FileText size={14} /> {application.resumeId.title}
                      </span>
                    )}
                  </div>

                  {/* Scheduled Interview Banner */}
                  {application.status === "interview" && application.interviewDate && (
                    <div className="interview-notice-banner">
                      <Calendar size={18} className="notice-icon" />
                      <div>
                        <strong>Interview Scheduled:</strong>
                        <span>
                          {new Date(application.interviewDate).toLocaleString([], {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  )}

                  {application.notes && (
                    <p className="recruiter-notes-preview">
                      <strong>Recruiter Note:</strong> {application.notes}
                    </p>
                  )}
                </div>

                <div className="application-actions-col">
                  {/* Recruiter-Controlled Read-Only Status */}
                  <div className="readonly-status-box">
                    <span className="status-label">Official Decision:</span>
                    {getStatusBadge(application.status)}
                  </div>

                  {application.status !== "selected" && (
                    <button
                      className="btn-danger-outline-sm"
                      onClick={() => handleWithdraw(application._id)}
                      disabled={withdrawingId === application._id}
                      title="Withdraw application"
                    >
                      <Trash2 size={14} /> Withdraw
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}