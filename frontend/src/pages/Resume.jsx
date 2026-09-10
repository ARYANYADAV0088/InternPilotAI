import { useEffect, useState } from "react";
import axios from "axios";
import {
  FileText,
  Sparkles,
  Plus,
  X,
} from "lucide-react";

function Resume() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [analysis, setAnalysis] = useState(null);
  const [analyzingId, setAnalyzingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    summary: "",
    skills: "",
    education: "",
    experience: "",
    projects: "",
  });

  const token = localStorage.getItem("token");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // =========================
  // FETCH RESUMES
  // =========================

  const fetchResumes = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/resumes",
        { headers }
      );

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
  // FORM CHANGE
  // =========================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // CREATE RESUME
  // =========================

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await axios.post(
        "http://localhost:5000/api/resumes",
        {
          title: form.title,
          summary: form.summary,

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
        },
        { headers }
      );

      setForm({
        title: "",
        summary: "",
        skills: "",
        education: "",
        experience: "",
        projects: "",
      });

      setShowForm(false);

      await fetchResumes();
    } catch (error) {
      console.error(
        "Failed to create resume:",
        error.response?.data || error
      );

      alert(
        error.response?.data?.message ||
          "Failed to create resume."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // AI RESUME ANALYSIS
  // =========================

  const handleAnalyze = async (resumeId) => {
    try {
      setAnalyzingId(resumeId);
      setAnalysis(null);

      const response = await axios.post(
        `http://localhost:5000/api/ai/resume/${resumeId}`,
        {},
        { headers }
      );

      setAnalysis({
        resumeId,
        ...response.data.analysis,
      });
    } catch (error) {
      console.error(
        "AI analysis error:",
        error.response?.data || error
      );

      alert(
        error.response?.data?.message ||
          "AI analysis failed."
      );
    } finally {
      setAnalyzingId(null);
    }
  };

  // =========================
  // UI
  // =========================

  return (
    <div className="page">

      {/* =========================
          PAGE HEADER
      ========================= */}

      <div className="page-header">
        <div>
          <p className="eyebrow">
            CAREER PROFILE
          </p>

          <h1>My Resume</h1>

          <p>
            Manage your resumes and analyze them with AI.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={() => setShowForm(true)}
        >
          <Plus size={17} />
          Add Resume
        </button>
      </div>

      {/* =========================
          CREATE RESUME FORM
      ========================= */}

      {showForm && (
        <div className="resume-form-card">

          <div className="form-title">
            <div>
              <p className="eyebrow">
                CREATE RESUME
              </p>

              <h2>
                Build your resume profile
              </h2>
            </div>

            <button
              className="close-btn"
              onClick={() =>
                setShowForm(false)
              }
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleCreate}>

            <label>
              Resume Title
            </label>

            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Software Developer Resume"
              required
            />

            <label>
              Professional Summary
            </label>

            <textarea
              name="summary"
              value={form.summary}
              onChange={handleChange}
              placeholder="Tell us briefly about yourself..."
              rows="4"
            />

            <label>
              Skills
            </label>

            <input
              name="skills"
              value={form.skills}
              onChange={handleChange}
              placeholder="React, JavaScript, Node.js, MongoDB"
            />

            <label>
              Education
            </label>

            <input
              name="education"
              value={form.education}
              onChange={handleChange}
              placeholder="B.Tech CSE, VIT Vellore"
            />

            <label>
              Experience
            </label>

            <input
              name="experience"
              value={form.experience}
              onChange={handleChange}
              placeholder="Frontend Intern, XYZ Company"
            />

            <label>
              Projects
            </label>

            <input
              name="projects"
              value={form.projects}
              onChange={handleChange}
              placeholder="InternPilot AI, Weather Dashboard"
            />

            <button
              className="primary-btn"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save Resume"}
            </button>

          </form>
        </div>
      )}

      {/* =========================
          LOADING
      ========================= */}

      {loading ? (

        <div className="empty-card">
          Loading resumes...
        </div>

      ) : resumes.length === 0 ? (

        /* =========================
           NO RESUMES
        ========================= */

        <div className="empty-card">

          <FileText size={40} />

          <h3>
            No resumes yet
          </h3>

          <p>
            Create your first resume
            to get started.
          </p>

        </div>

      ) : (

        /* =========================
           RESUME LIST
        ========================= */

        <>
          <div className="resume-grid">

            {resumes.map((resume) => (

              <div
                className="resume-card"
                key={resume._id}
              >

                <div className="resume-icon">
                  <FileText size={24} />
                </div>

                <h3>
                  {resume.title}
                </h3>

                {resume.summary && (
                  <p>
                    {resume.summary}
                  </p>
                )}

                <p>
                  {resume.skills?.length || 0} skills
                  {" • "}
                  {resume.education?.length || 0} education
                  {" • "}
                  {resume.experience?.length || 0} experience
                  {" • "}
                  {resume.projects?.length || 0} projects
                </p>

                <button
                  className="secondary-btn"
                  onClick={() =>
                    handleAnalyze(
                      resume._id
                    )
                  }
                  disabled={
                    analyzingId ===
                    resume._id
                  }
                >

                  <Sparkles size={15} />

                  {analyzingId ===
                  resume._id
                    ? "Analyzing..."
                    : "Analyze with AI"}

                </button>

              </div>

            ))}

          </div>

          {/* =========================
              AI ANALYSIS RESULT
          ========================= */}

          {analysis && (

            <div
              className="panel"
              style={{
                marginTop: "24px",
              }}
            >

              <p className="eyebrow">
                AI RESUME ANALYSIS
              </p>

              <h2>
                Resume Score:{" "}
                {analysis.score}/100
              </h2>

              {/* =========================
                  SCORE BREAKDOWN
              ========================= */}

              {analysis.breakdown && (

                <div
                  style={{
                    marginTop: "20px",
                  }}
                >

                  <h3>
                    Score Breakdown
                  </h3>

                  <div className="score-breakdown">

                    <div className="score-row">
                      <span>
                        Technical Skills
                      </span>

                      <strong>
                        {
                          analysis.breakdown
                            .technicalSkills
                        }
                        /30
                      </strong>
                    </div>

                    <div className="score-row">
                      <span>
                        Projects
                      </span>

                      <strong>
                        {
                          analysis.breakdown
                            .projects
                        }
                        /25
                      </strong>
                    </div>

                    <div className="score-row">
                      <span>
                        Experience
                      </span>

                      <strong>
                        {
                          analysis.breakdown
                            .experience
                        }
                        /20
                      </strong>
                    </div>

                    <div className="score-row">
                      <span>
                        Education
                      </span>

                      <strong>
                        {
                          analysis.breakdown
                            .education
                        }
                        /10
                      </strong>
                    </div>

                    <div className="score-row">
                      <span>
                        Resume Completeness
                      </span>

                      <strong>
                        {
                          analysis.breakdown
                            .completeness
                        }
                        /10
                      </strong>
                    </div>

                    <div className="score-row">
                      <span>
                        Internship Relevance
                      </span>

                      <strong>
                        {
                          analysis.breakdown
                            .relevance
                        }
                        /5
                      </strong>
                    </div>

                  </div>

                </div>
              )}

              {/* =========================
                  MATCHED SKILLS
              ========================= */}

              <h3>
                Matched Skills
              </h3>

              <p>
                {analysis.matchedSkills
                  ?.length
                  ? analysis.matchedSkills.join(
                      ", "
                    )
                  : "No matched skills"}
              </p>

              {/* =========================
                  MISSING SKILLS
              ========================= */}

              <h3>
                Missing Skills
              </h3>

              <p>
                {analysis.missingSkills
                  ?.length
                  ? analysis.missingSkills.join(
                      ", "
                    )
                  : "No major missing skills"}
              </p>

              {/* =========================
                  STRENGTHS
              ========================= */}

              <h3>
                Strengths
              </h3>

              <ul>

                {analysis.strengths?.map(
                  (strength, index) => (

                    <li key={index}>
                      {strength}
                    </li>

                  )
                )}

              </ul>

              {/* =========================
                  WEAKNESSES
              ========================= */}

              <h3>
                Weaknesses
              </h3>

              <ul>

                {analysis.weaknesses?.map(
                  (weakness, index) => (

                    <li key={index}>
                      {weakness}
                    </li>

                  )
                )}

              </ul>

              {/* =========================
                  SUGGESTIONS
              ========================= */}

              <h3>
                Suggestions
              </h3>

              <ul>

                {analysis.suggestions?.map(
                  (suggestion, index) => (

                    <li key={index}>
                      {suggestion}
                    </li>

                  )
                )}

              </ul>

            </div>

          )}

        </>

      )}

    </div>
  );
}

export default Resume;