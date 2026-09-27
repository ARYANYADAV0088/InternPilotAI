import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../lib/api";
import {
  FileText,
  Sparkles,
  Plus,
  X,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

function Resume() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingResumeId, setEditingResumeId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [analysis, setAnalysis] = useState(null);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [bannerMsg, setBannerMsg] = useState({ text: "", type: "" });

  const [form, setForm] = useState({
    title: "",
    summary: "",
    skills: "",
    education: "",
    experience: "",
    projects: "",
  });

  const showBanner = (text, type = "success") => {
    setBannerMsg({ text, type });
    setTimeout(() => setBannerMsg({ text: "", type: "" }), 4000);
  };

  // =========================
  // FETCH RESUMES
  // =========================
  const fetchResumes = async () => {
    try {
      const response = await api.get("/api/resumes");
      setResumes(response.data.resumes || []);
    } catch (error) {
      console.error(
        "Failed to fetch resumes:",
        error.response?.data || error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  // =========================
  // OPEN EDIT FORM
  // =========================
  const handleEditResume = (resume) => {
    setEditingResumeId(resume._id);
    setForm({
      title: resume.title || "",
      summary: resume.summary || "",
      skills: (resume.skills || []).join(", "),
      education: (resume.education || []).join(", "),
      experience: (resume.experience || []).join(", "),
      projects: (resume.projects || []).join(", "),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingResumeId(null);
    setForm({
      title: "",
      summary: "",
      skills: "",
      education: "",
      experience: "",
      projects: "",
    });
  };

  // =========================
  // CREATE OR UPDATE RESUME
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      showBanner("Resume title is required.", "error");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: form.title.trim(),
        summary: form.summary.trim(),
        skills: form.skills
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        education: form.education
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        experience: form.experience
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        projects: form.projects
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      if (editingResumeId) {
        await api.put(`/api/resumes/${editingResumeId}`, payload);
        showBanner("Resume updated successfully!");
      } else {
        await api.post("/api/resumes", payload);
        showBanner("Resume created successfully!");
      }

      handleCancelForm();
      await fetchResumes();
    } catch (error) {
      console.error("Save resume error:", error);
      showBanner(
        error.response?.data?.message || "Failed to save resume.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DELETE RESUME
  // =========================
  const handleDeleteResume = async (resumeId) => {
    try {
      await api.delete(`/api/resumes/${resumeId}`);
      if (analysis?.resumeId === resumeId) {
        setAnalysis(null);
      }
      setDeleteConfirmId(null);
      showBanner("Resume deleted successfully.");
      await fetchResumes();
    } catch (error) {
      console.error("Delete resume error:", error);
      showBanner(
        error.response?.data?.message || "Failed to delete resume.",
        "error"
      );
    }
  };

  // =========================
  // AI RESUME ANALYSIS
  // =========================
  const handleAnalyze = async (resumeId) => {
    try {
      setAnalyzingId(resumeId);
      setAnalysis(null);

      const response = await api.post(`/api/ai/resume/${resumeId}`);

      setAnalysis({
        resumeId,
        ...response.data.analysis,
      });

      await fetchResumes();
      showBanner("AI Resume Analysis completed!");
    } catch (error) {
      console.error("AI analysis error:", error.response?.data || error);
      showBanner(
        error.response?.data?.message || "AI analysis failed.",
        "error"
      );
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <Layout>
      <div className="resume-page">
        {/* HEADER */}
        <div className="page-header">
          <div>
            <p className="eyebrow">RESUME MANAGEMENT</p>
            <h1>Your Resume Profiles</h1>
            <p>
              Manage your technical profiles, edit details, and analyze readiness
              with Google Gemini AI.
            </p>
          </div>

          <button
            className="primary-btn"
            onClick={() => {
              if (showForm) {
                handleCancelForm();
              } else {
                setEditingResumeId(null);
                setForm({
                  title: "",
                  summary: "",
                  skills: "",
                  education: "",
                  experience: "",
                  projects: "",
                });
                setShowForm(true);
              }
            }}
          >
            {showForm ? (
              <>
                <X size={18} /> Close Form
              </>
            ) : (
              <>
                <Plus size={18} /> Create Resume
              </>
            )}
          </button>
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

        {/* =========================
            CREATE / EDIT FORM
        ========================= */}
        {showForm && (
          <div className="panel" style={{ marginBottom: "28px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3>{editingResumeId ? "Edit Resume Profile" : "Create New Resume"}</h3>
              <button
                type="button"
                className="icon-btn"
                onClick={handleCancelForm}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="resume-form">
              <label>Resume Title *</label>
              <input
                type="text"
                placeholder="e.g. Full Stack Developer, Data Analyst"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />

              <label>Professional Summary</label>
              <textarea
                placeholder="Brief summary of your background, career objectives, and key strengths..."
                rows={3}
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
              />

              <label>Technical Skills (comma separated)</label>
              <input
                type="text"
                placeholder="React, Node.js, Python, TypeScript, SQL, Git"
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
              />

              <label>Education (comma separated)</label>
              <input
                type="text"
                placeholder="B.S. Computer Science 2025, University of Technology"
                value={form.education}
                onChange={(e) => setForm({ ...form, education: e.target.value })}
              />

              <label>Experience (comma separated)</label>
              <textarea
                placeholder="Software Engineering Intern at TechCorp (3 mos), Frontend Developer Freelance"
                rows={2}
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
              />

              <label>Projects (comma separated)</label>
              <textarea
                placeholder="E-Commerce MERN App with Stripe, Real-Time Chat using WebSockets"
                rows={2}
                value={form.projects}
                onChange={(e) => setForm({ ...form, projects: e.target.value })}
              />

              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button className="primary-btn" type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Sparkles size={16} className="spin-slow" /> Saving...
                    </>
                  ) : editingResumeId ? (
                    "Update Resume"
                  ) : (
                    "Save Resume"
                  )}
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleCancelForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =========================
            RESUMES LIST
        ========================= */}
        {loading ? (
          <div className="empty-card">Loading resumes...</div>
        ) : resumes.length === 0 ? (
          <div className="empty-card">
            <FileText size={40} />
            <h3>No resumes yet</h3>
            <p>Create your first resume profile to get started with AI analysis.</p>
          </div>
        ) : (
          <>
            <div className="resume-grid">
              {resumes.map((resume) => (
                <div className="resume-card" key={resume._id}>
                  <div className="resume-card-header">
                    <div className="resume-icon">
                      <FileText size={24} />
                    </div>
                    <div className="resume-card-actions">
                      <button
                        className="card-action-btn edit-btn"
                        onClick={() => handleEditResume(resume)}
                        title="Edit Resume"
                      >
                        <Edit2 size={16} />
                      </button>

                      {deleteConfirmId === resume._id ? (
                        <div className="delete-confirm-box">
                          <span>Delete?</span>
                          <button
                            className="btn-danger-sm"
                            onClick={() => handleDeleteResume(resume._id)}
                          >
                            Yes
                          </button>
                          <button
                            className="btn-cancel-sm"
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          className="card-action-btn delete-btn"
                          onClick={() => setDeleteConfirmId(resume._id)}
                          title="Delete Resume"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3>{resume.title}</h3>

                  {resume.summary && <p className="resume-summary">{resume.summary}</p>}

                  <p className="resume-meta">
                    {resume.skills?.length || 0} skills •{" "}
                    {resume.education?.length || 0} education •{" "}
                    {resume.experience?.length || 0} experience •{" "}
                    {resume.projects?.length || 0} projects
                  </p>

                  {resume.aiScore !== undefined && (
                    <div className="ats-preview-pill">
                      <span>ATS Readiness:</span>
                      <strong>{resume.aiScore}/100</strong>
                    </div>
                  )}

                  <div className="resume-card-bottom">
                    <button
                      className="secondary-btn analyze-btn"
                      onClick={() => handleAnalyze(resume._id)}
                      disabled={analyzingId === resume._id}
                    >
                      <Sparkles size={15} />
                      {analyzingId === resume._id ? "Analyzing..." : "Analyze with AI"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* =========================
                AI ANALYSIS RESULT
            ========================= */}
            {analysis && (
              <div className="panel" style={{ marginTop: "28px" }}>
                <p className="eyebrow">AI RESUME ANALYSIS</p>
                <h2>Resume Score: {analysis.score}/100</h2>

                {/* SCORE BREAKDOWN */}
                {analysis.breakdown && (
                  <div style={{ marginTop: "20px" }}>
                    <h3>Score Breakdown</h3>
                    <div className="breakdown-grid">
                      <div className="breakdown-card">
                        <span className="label">Technical Skills</span>
                        <span className="value">
                          {analysis.breakdown.technicalSkills}/30
                        </span>
                      </div>
                      <div className="breakdown-card">
                        <span className="label">Projects</span>
                        <span className="value">
                          {analysis.breakdown.projects}/25
                        </span>
                      </div>
                      <div className="breakdown-card">
                        <span className="label">Experience</span>
                        <span className="value">
                          {analysis.breakdown.experience}/20
                        </span>
                      </div>
                      <div className="breakdown-card">
                        <span className="label">Education</span>
                        <span className="value">
                          {analysis.breakdown.education}/10
                        </span>
                      </div>
                      <div className="breakdown-card">
                        <span className="label">Completeness</span>
                        <span className="value">
                          {analysis.breakdown.completeness}/10
                        </span>
                      </div>
                      <div className="breakdown-card">
                        <span className="label">Relevance</span>
                        <span className="value">
                          {analysis.breakdown.relevance}/5
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* MATCHED SKILLS */}
                {analysis.matchedSkills?.length > 0 && (
                  <div style={{ marginTop: "20px" }}>
                    <h3>Matched Skills</h3>
                    <div className="tag-list">
                      {analysis.matchedSkills.map((skill, index) => (
                        <span className="tag" key={index}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* MISSING SKILLS */}
                {analysis.missingSkills?.length > 0 && (
                  <div style={{ marginTop: "20px" }}>
                    <h3>Recommended Missing Skills</h3>
                    <div className="tag-list">
                      {analysis.missingSkills.map((skill, index) => (
                        <span className="tag tag-missing" key={index}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* STRENGTHS */}
                {analysis.strengths?.length > 0 && (
                  <div style={{ marginTop: "20px" }}>
                    <h3>Strengths</h3>
                    <ul className="analysis-bullet-list">
                      {analysis.strengths.map((s, index) => (
                        <li key={index}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* WEAKNESSES */}
                {analysis.weaknesses?.length > 0 && (
                  <div style={{ marginTop: "20px" }}>
                    <h3>Weaknesses</h3>
                    <ul className="analysis-bullet-list">
                      {analysis.weaknesses.map((w, index) => (
                        <li key={index}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* SUGGESTIONS */}
                {analysis.suggestions?.length > 0 && (
                  <div style={{ marginTop: "20px" }}>
                    <h3>Actionable Suggestions</h3>
                    <ul className="analysis-bullet-list">
                      {analysis.suggestions.map((s, index) => (
                        <li key={index}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

export default Resume;