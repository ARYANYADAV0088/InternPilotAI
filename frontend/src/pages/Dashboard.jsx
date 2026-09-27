import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import API_URL from "../api";
import Layout from "../components/Layout";
import {
  FileText,
  BriefcaseBusiness,
  ClipboardCheck,
  Bookmark,
  Sparkles,
  ArrowRight,
  Target,
  Clock3,
  CheckCircle2,
  Zap,
} from "lucide-react";

function AnimatedNumber({ value, loading }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (loading) return;

    let start = 0;
    const end = Number(value) || 0;

    if (end === 0) {
      setDisplayValue(0);
      return;
    }

    const duration = 700;
    const increment = Math.max(1, Math.ceil(end / 25));

    const timer = setInterval(() => {
      start += increment;

      if (start >= end) {
        start = end;
        clearInterval(timer);
      }

      setDisplayValue(start);
    }, duration / 25);

    return () => clearInterval(timer);
  }, [value, loading]);

  return loading ? "..." : displayValue;
}

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [resumeCount, setResumeCount] = useState(0);
  const [internshipCount, setInternshipCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);

  const [resumes, setResumes] = useState([]);
  const [applications, setApplications] = useState([]);
  const [internships, setInternships] = useState([]);

  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [
          userResponse,
          resumeResponse,
          internshipResponse,
          applicationResponse,
          savedResponse,
        ] = await Promise.all([
          axios.get(
            `${API_URL}/api/users/profile`,
            { headers }
          ),

          axios.get(
            `${API_URL}/api/users/resumes`,
            { headers }
          ),

          axios.get(
           `${API_URL}/api/internships`,
            { headers }
          ),

          axios.get(
            `${API_URL}/api/applications`,
            { headers }
          ),

          axios.get(
            `${API_URL}/api/internships/saved/list`,
            { headers }
          ),
        ]);

        const applicationData =
          applicationResponse.data.applications || [];

        const internshipData =
          internshipResponse.data.internships || [];

        const userData = userResponse.data?.user;
        if (userData?.role === "recruiter") {
          navigate("/recruiter");
          return;
        }
        setUser(userData);

        const resumeData = resumeResponse.data.resumes || [];

        setResumes(resumeData);
        setResumeCount(resumeData.length);

        setInternshipCount(internshipData.length);

        setApplicationCount(applicationData.length);

        setSavedCount(
          savedResponse.data.saved?.length || 0
        );

        setApplications(applicationData);
        setInternships(internshipData);
      } catch (error) {
        console.error("Dashboard data error:", error);

        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
    } else {
      navigate("/login");
    }
  }, [token, navigate]);

  const firstName = user?.name
    ? user.name.split(" ")[0]
    : "there";

  const appliedCount = applications.filter(
    (app) => app.status === "applied"
  ).length;

  const interviewCount = applications.filter(
    (app) => app.status === "interview"
  ).length;

  const selectedCount = applications.filter(
    (app) => app.status === "selected"
  ).length;

  const rejectedCount = applications.filter(
    (app) => app.status === "rejected"
  ).length;
const nextAction =
    resumeCount === 0
      ? {
          title: "Build your AI resume profile",
          description:
            "Create your first resume so InternPilot AI can analyze your profile.",
          button: "Create Resume",
          link: "/resume",
        }
      : applicationCount === 0
      ? {
          title: "Start applying",
          description:
            "You have opportunities waiting. Find internships and begin applying.",
          button: "Explore Internships",
          link: "/internships",
        }
      : savedCount > 0
      ? {
          title: "Review your saved opportunities",
          description:
            "You already have internships bookmarked. Compare them and take action.",
          button: "View Saved",
          link: "/saved-internships",
        }
      : {
          title: "Improve your internship match",
          description:
            "Use AI matching to discover which opportunities fit your profile.",
          button: "Find Matches",
          link: "/internships",
        };

  const availableInternships = internships.slice(0, 3);

  return (
    <Layout>
      <div className="page dashboard-page">
        {/* DASHBOARD HEADER */}
        <div className="page-header dashboard-page-header">
          <div>
            <p className="eyebrow">COMMAND CENTER</p>
            <h1>Welcome back, {firstName}</h1>
            <p>
              Your end-to-end AI career copilot. Track applications, test interview readiness, and bridge your skill gaps.
            </p>
          </div>
        </div>

        {/* HERO */}

        <section className="hero dashboard-hero">
          <div className="hero-content">
            <p className="eyebrow">
              YOUR CAREER COPILOT
            </p>

            <h2>
              Land your next internship
              <br />
              <span>smarter.</span>
            </h2>

            <p>
              Analyze your resume, discover better
              opportunities, and turn applications into
              offers.
            </p>

            <div className="hero-actions">
              <Link to="/resume">
                <button className="primary-btn">
                  <Sparkles size={16} />
                  Analyze Resume
                  <ArrowRight size={16} />
                </button>
              </Link>

              <Link to="/internships">
                <button className="hero-secondary-btn">
                  Find Internships
                  <ArrowRight size={16} />
                </button>
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-orbit orbit-one"></div>
            <div className="hero-orbit orbit-two"></div>

            <div className="hero-ai-core">
              <Sparkles size={38} />
              <span>AI</span>
            </div>
          </div>
        </section>

        {/* STATS */}

        <section className="stats dashboard-stats">
          <div className="card dashboard-stat-card">
            <div className="stat-top">
              <span>Resumes</span>
              <FileText size={18} />
            </div>

            <strong>
              <AnimatedNumber
                value={resumeCount}
                loading={loading}
              />
            </strong>

            <small>Your career profiles</small>
          </div>

          <div className="card dashboard-stat-card">
            <div className="stat-top">
              <span>Opportunities</span>
              <BriefcaseBusiness size={18} />
            </div>

            <strong>
              <AnimatedNumber
                value={internshipCount}
                loading={loading}
              />
            </strong>

            <small>Internships available</small>
          </div>

          <div className="card dashboard-stat-card">
            <div className="stat-top">
              <span>Saved</span>
              <Bookmark size={18} />
            </div>

            <strong>
              <AnimatedNumber
                value={savedCount}
                loading={loading}
              />
            </strong>

            <small>Opportunities bookmarked</small>
          </div>

          <div className="card dashboard-stat-card">
            <div className="stat-top">
              <span>Applications</span>
              <ClipboardCheck size={18} />
            </div>

            <strong>
              <AnimatedNumber
                value={applicationCount}
                loading={loading}
              />
            </strong>

            <small>Applications tracked</small>
          </div>
        </section>

        {/* AI COMMAND CENTER */}

        <section className="dashboard-command-grid">
          <div className="panel career-health-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">AI CAREER READINESS</p>
                <h3>Your latest resume assessment</h3>
              </div>
              <Sparkles size={22} />
            </div>

            {(() => {
              const analyzedResumes = resumes
                .filter(
                  (resume) =>
                    typeof resume.aiScore === "number" &&
                    resume.analyzedAt
                )
                .sort(
                  (a, b) =>
                    new Date(b.analyzedAt) -
                    new Date(a.analyzedAt)
                );

              const latestAnalysis = analyzedResumes[0];

              if (!latestAnalysis) {
                return (
                  <div className="ai-empty-state">
                    <div className="ai-empty-icon">
                      <Sparkles size={24} />
                    </div>

                    <div>
                      <strong>
                        Your AI assessment is not available yet.
                      </strong>

                      <p>
                        Analyze a resume to unlock your real AI
                        career assessment.
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="real-ai-readiness">
                  <div className="readiness-score">
                    <strong>{latestAnalysis.aiScore}</strong>
                    <span>/100</span>
                  </div>

                  <div className="readiness-info">
                    <strong>AI Resume Score</strong>

                    <p>
                      Based on your latest Gemini resume analysis.
                    </p>

                    <small>
                      Analyzed{" "}
                      {new Date(
                        latestAnalysis.analyzedAt
                      ).toLocaleDateString()}
                    </small>
                  </div>
                </div>
              );
            })()}

            {resumes.some(
              (resume) =>
                typeof resume.aiScore === "number" &&
                resume.analyzedAt
            ) && (
              <Link to="/resume">
                <button className="secondary-btn">
                  View Full Analysis
                  <ArrowRight size={16} />
                </button>
              </Link>
            )}
          </div>

          {/* NEXT ACTION */}

          <div className="panel next-action-panel">
            <div className="next-action-glow"></div>

            <div className="panel-header">
              <div>
                <p className="eyebrow">
                  AI NEXT STEP
                </p>

                <h3>
                  {nextAction.title}
                </h3>
              </div>

              <Zap size={22} />
            </div>

            <p className="panel-text">
              {nextAction.description}
            </p>

            <Link to={nextAction.link}>
              <button className="primary-btn">
                {nextAction.button}
                <ArrowRight size={16} />
              </button>
            </Link>
          </div>
        </section>

        {/* APPLICATION PIPELINE */}

        <section className="panel pipeline-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">
                APPLICATION PIPELINE
              </p>

              <h3>
                Your journey at a glance
              </h3>
            </div>

            <Link
              to="/applications"
              className="panel-link"
            >
              View all
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="pipeline">
            <div className="pipeline-step">
              <div className="pipeline-icon">
                <SendIcon />
              </div>

              <strong>{appliedCount}</strong>
              <span>Applied</span>
            </div>

            <div className="pipeline-line"></div>

            <div className="pipeline-step">
              <div className="pipeline-icon">
                <Clock3 size={19} />
              </div>

              <strong>{interviewCount}</strong>
              <span>Interview</span>
            </div>

            <div className="pipeline-line"></div>

            <div className="pipeline-step">
              <div className="pipeline-icon">
                <CheckCircle2 size={19} />
              </div>

              <strong>{selectedCount}</strong>
              <span>Selected</span>
            </div>

            <div className="pipeline-line"></div>

            <div className="pipeline-step muted">
              <div className="pipeline-icon">
                <Target size={19} />
              </div>

              <strong>{rejectedCount}</strong>
              <span>Rejected</span>
            </div>
          </div>
        </section>

        {/* RECOMMENDATIONS */}

        <section className="panel recommendations-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">
                OPPORTUNITIES
              </p>

              <h3>
                Available internships
              </h3>
            </div>

            <Link
              to="/internships"
              className="panel-link"
            >
              Explore all
              <ArrowRight size={15} />
            </Link>
          </div>

          {availableInternships.length > 0 ? (
            <div className="recommendation-grid">
              {availableInternships.map(
                (internship, index) => (
                  <Link
                    to="/internships"
                    className="recommendation-card"
                    key={internship._id}
                  >
                    <div className="recommendation-number">
                      0{index + 1}
                    </div>

                    <div className="recommendation-content">
                      <span>
                        {internship.company ||
                          "Company"}
                      </span>

                      <h4>
                        {internship.title ||
                          "Internship"}
                      </h4>

                      {internship.location && (
                        <small>
                          {internship.location}
                        </small>
                      )}

                      {internship.requiredSkills
                        ?.length > 0 && (
                        <div className="skill-pills">
                          {internship.requiredSkills
                            .slice(0, 3)
                            .map((skill) => (
                              <span key={skill}>
                                {skill}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>

                    <ArrowRight
                      className="recommendation-arrow"
                      size={18}
                    />
                  </Link>
                )
              )}
            </div>
          ) : (
            <div className="dashboard-empty">
              <BriefcaseBusiness size={25} />

              <p>
                No opportunities available yet.
              </p>

              <Link to="/internships">
                Explore internships
              </Link>
            </div>
          )}
        </section>


      </div>
    </Layout>
  );
}

function SendIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

export default Dashboard;