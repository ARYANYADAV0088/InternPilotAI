import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../lib/api";
import {
  BotMessageSquare,
  Sparkles,
  ArrowRight,
  AlertCircle,
  RotateCcw,
  Trophy,
  FileText,
  Clock,
  Send,
  Lightbulb,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";

export default function MockInterview() {
  // Navigation & Data States
  const [resumes, setResumes] = useState([]);
  const [internships, setInternships] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Setup Form States
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [selectedInternshipId, setSelectedInternshipId] = useState("");
  const [interviewType, setInterviewType] = useState("mixed");
  const [difficulty, setDifficulty] = useState("junior");
  const [starting, setStarting] = useState(false);

  // Active Session States
  const [session, setSession] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [studentAnswer, setStudentAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [finalSummary, setFinalSummary] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Load Resumes, Internships, Past Sessions
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resRes, intRes, sessRes] = await Promise.all([
          api.get("/api/resumes"),
          api.get("/api/internships"),
          api.get("/api/interviews"),
        ]);
        const rList = resRes.data?.resumes || [];
        setResumes(rList);
        if (rList.length > 0) setSelectedResumeId(rList[0]._id);

        const iList = intRes.data?.internships || [];
        setInternships(iList);
        if (iList.length > 0) setSelectedInternshipId(iList[0]._id);

        setPastSessions(sessRes.data?.sessions || []);
      } catch (err) {
        console.error("Failed to load interview setup data:", err);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchData();
  }, []);

  const handleStartInterview = async (e) => {
    e.preventDefault();
    if (!selectedResumeId) {
      setErrorMsg("Please select a resume to start the interview.");
      return;
    }
    setErrorMsg("");
    setStarting(true);
    try {
      const res = await api.post("/api/interviews/start", {
        resumeId: selectedResumeId,
        internshipId: selectedInternshipId || undefined,
        type: interviewType,
        difficulty,
      });
      setSession(res.data.session);
      setCurrentQIndex(0);
      setStudentAnswer("");
      setCurrentEvaluation(null);
      setFinalSummary(null);
    } catch (err) {
      console.error("Start interview error:", err);
      setErrorMsg(
        err.response?.data?.message ||
          "Failed to start interview. Please try again."
      );
    } finally {
      setStarting(false);
    }
  };

  const currentQuestion = session?.questions?.[currentQIndex];

  const handleSubmitAnswer = async () => {
    if (!studentAnswer.trim()) {
      setErrorMsg("Please type your response before submitting.");
      return;
    }
    setErrorMsg("");
    setEvaluating(true);
    try {
      const res = await api.post(`/api/interviews/${session._id}/submit`, {
        questionId: currentQuestion.id,
        answer: studentAnswer,
      });
      setCurrentEvaluation(res.data.evaluation);

      // Update question in session state
      setSession((prev) => {
        const updatedQs = [...prev.questions];
        updatedQs[currentQIndex] = {
          ...updatedQs[currentQIndex],
          studentAnswer,
          score: res.data.evaluation.score,
          feedback: res.data.evaluation.feedback,
          goodPoints: res.data.evaluation.goodPoints,
          missingPoints: res.data.evaluation.missingPoints,
          improvePoints: res.data.evaluation.improvePoints,
          suggestedAnswer: res.data.evaluation.suggestedAnswer,
        };
        return { ...prev, questions: updatedQs };
      });
    } catch (err) {
      console.error("Submit answer error:", err);
      setErrorMsg(
        err.response?.data?.message ||
          "Failed to evaluate answer. You can retry."
      );
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQIndex < (session?.questions?.length || 0) - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setStudentAnswer("");
      setCurrentEvaluation(null);
      setErrorMsg("");
    } else {
      handleFinishInterview();
    }
  };

  const handleFinishInterview = async () => {
    setFinishing(true);
    try {
      const res = await api.post(`/api/interviews/${session._id}/finish`);
      setFinalSummary(res.data);
      // Refresh past sessions
      const pastRes = await api.get("/api/interviews");
      setPastSessions(pastRes.data?.sessions || []);
    } catch (err) {
      console.error("Finish interview error:", err);
      setErrorMsg("Failed to generate final report. Session is preserved.");
    } finally {
      setFinishing(false);
    }
  };

  const handleReset = () => {
    setSession(null);
    setCurrentQIndex(0);
    setStudentAnswer("");
    setCurrentEvaluation(null);
    setFinalSummary(null);
    setErrorMsg("");
  };

  return (
    <Layout>
      <div className="page-container mock-interview-page">
        {/* HEADER */}
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <BotMessageSquare size={28} className="title-icon text-indigo" />
              AI Mock Interview Simulator
            </h1>
            <p className="page-subtitle">
              Practice real-time technical & behavioral questions tailored to
              your resume and target roles with instant AI feedback.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="alert-banner alert-error">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* LOADING INITIAL STATE */}
        {loadingInitial ? (
          <div className="loading-card">
            <Sparkles size={32} className="spin-slow" />
            <p>Loading your interview preparation center...</p>
          </div>
        ) : !session ? (
          /* STEP 1: SETUP SCREEN */
          <div className="interview-setup-grid">
            <div className="setup-card card-shadow">
              <div className="card-header">
                <h3>Configure Your Session</h3>
                <p>Customize the interview context to match your dream opportunity.</p>
              </div>

              {resumes.length === 0 ? (
                <div className="empty-callout">
                  <FileText size={32} />
                  <h4>No Resume Found</h4>
                  <p>You need at least one resume profile to generate tailored questions.</p>
                  <Link to="/resume" className="btn-primary">
                    Create Resume First
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleStartInterview} className="setup-form">
                  <div className="form-group">
                    <label>Select Target Resume</label>
                    <select
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      required
                    >
                      {resumes.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.title} ({r.skills?.slice(0, 3).join(", ") || "General"}...)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Target Internship Role (Optional)</label>
                    <select
                      value={selectedInternshipId}
                      onChange={(e) => setSelectedInternshipId(e.target.value)}
                    >
                      <option value="">General Software Engineering Practice</option>
                      {internships.map((i) => (
                        <option key={i._id} value={i._id}>
                          {i.title} at {i.company}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Interview Focus</label>
                      <select
                        value={interviewType}
                        onChange={(e) => setInterviewType(e.target.value)}
                      >
                        <option value="mixed">Mixed (Technical + Behavioral)</option>
                        <option value="technical">Purely Technical Deep-Dive</option>
                        <option value="behavioral">Behavioral (STAR Method)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Difficulty Tier</label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                      >
                        <option value="junior">Intern / Junior Level</option>
                        <option value="mid">Mid-Level Associate</option>
                        <option value="senior">Challenging / Lead</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary start-btn"
                    disabled={starting}
                  >
                    {starting ? (
                      <>
                        <Sparkles size={18} className="spin-slow" />
                        Generating Tailored Questions...
                      </>
                    ) : (
                      <>
                        <BotMessageSquare size={18} />
                        Launch AI Interview Room
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* PAST SESSIONS SIDEBAR */}
            <div className="past-sessions-panel card-shadow">
              <h3>Recent Sessions</h3>
              {pastSessions.length === 0 ? (
                <div className="no-past-sessions">
                  <Clock size={28} />
                  <p>Your completed interview scores and feedback will appear here.</p>
                </div>
              ) : (
                <div className="past-sessions-list">
                  {pastSessions.slice(0, 4).map((s) => (
                    <div key={s._id} className="past-session-item">
                      <div className="past-session-left">
                        <p className="past-role">{s.roleTitle}</p>
                        <span className="past-company">{s.company}</span>
                        <span className="past-date">
                          {new Date(s.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="past-session-right">
                        <span
                          className={`score-badge ${
                            s.overallScore >= 75
                              ? "score-high"
                              : s.overallScore >= 50
                              ? "score-mid"
                              : "score-low"
                          }`}
                        >
                          {s.overallScore || 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : finalSummary ? (
          /* STEP 3: FINAL SUMMARY SCREEN */
          <div className="interview-summary-container card-shadow">
            <div className="summary-header-card">
              <Trophy size={48} className="trophy-icon" />
              <h2>Interview Completed!</h2>
              <p>Here is your comprehensive performance evaluation and AI coaching review.</p>

              <div className="overall-score-pill">
                <span className="score-number">{finalSummary.overallScore || 0}%</span>
                <span className="score-label">Overall Readiness Score</span>
              </div>
            </div>

            <div className="summary-questions-review">
              <h3>Question Breakdown & Coaching Notes</h3>
              {session.questions.map((q, idx) => (
                <div key={q.id || idx} className="question-review-card">
                  <div className="review-q-header">
                    <span className="q-badge">Question {idx + 1}</span>
                    <span className="q-score">Score: {q.score || 0}/100</span>
                  </div>
                  <h4 className="review-question-text">{q.question}</h4>

                  <div className="student-answer-box">
                    <strong>Your Response:</strong>
                    <p>{q.studentAnswer || "No answer submitted."}</p>
                  </div>

                  {q.feedback && (
                    <div className="ai-feedback-box">
                      <strong>AI Coaching Feedback:</strong>
                      <p>{q.feedback}</p>
                    </div>
                  )}

                  {q.suggestedAnswer && (
                    <div className="suggested-answer-box">
                      <strong>Model Ideal Answer:</strong>
                      <p>{q.suggestedAnswer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="summary-actions">
              <button onClick={handleReset} className="btn-primary">
                <RotateCcw size={18} />
                Practice Another Interview
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: ACTIVE INTERVIEW ROOM */
          <div className="active-interview-room">
            {/* PROGRESS BAR */}
            <div className="interview-progress-bar card-shadow">
              <div className="progress-info">
                <span>
                  Question {currentQIndex + 1} of {session.questions.length}
                </span>
                <span className="interview-role-pill">
                  {session.roleTitle} • {session.difficulty}
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${((currentQIndex + 1) / session.questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* QUESTION DISPLAY CARD */}
            <div className="question-card card-shadow">
              <div className="question-card-top">
                <span className="category-pill">{currentQuestion?.type || "General"}</span>
              </div>
              <h2 className="main-question-text">{currentQuestion?.question}</h2>

              {currentQuestion?.whyItMatters && (
                <div className="why-matters-tip">
                  <Lightbulb size={18} className="tip-icon" />
                  <span>
                    <strong>Why Recruiters Ask This:</strong>{" "}
                    {currentQuestion.whyItMatters}
                  </span>
                </div>
              )}

              {/* ANSWER INPUT AREA */}
              {!currentEvaluation ? (
                <div className="answer-section">
                  <label>Your Response:</label>
                  <textarea
                    rows={6}
                    placeholder="Structure your response clearly (e.g. context, approach, technologies used, resolution, results)..."
                    value={studentAnswer}
                    onChange={(e) => setStudentAnswer(e.target.value)}
                    disabled={evaluating}
                  />
                  <div className="answer-footer">
                    <span className="word-count">
                      {studentAnswer.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                    <button
                      className="btn-primary submit-ans-btn"
                      onClick={handleSubmitAnswer}
                      disabled={evaluating || !studentAnswer.trim()}
                    >
                      {evaluating ? (
                        <>
                          <Sparkles size={18} className="spin-slow" />
                          Evaluating Answer...
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          Submit Response
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* INSTANT FEEDBACK CARD */
                <div className="evaluation-result-card">
                  <div className="eval-score-header">
                    <div className="score-dial">
                      <span className="dial-value">{currentEvaluation.score}</span>
                      <span className="dial-max">/100</span>
                    </div>
                    <div className="eval-summary-text">
                      <h4>AI Performance Evaluation</h4>
                      <p>{currentEvaluation.feedback}</p>
                    </div>
                  </div>

                  <div className="eval-points-grid">
                    {currentEvaluation.goodPoints?.length > 0 && (
                      <div className="eval-point-box points-good">
                        <h5>
                          <ThumbsUp size={16} /> Strong Aspects
                        </h5>
                        <ul>
                          {currentEvaluation.goodPoints.map((pt, i) => (
                            <li key={i}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {currentEvaluation.improvePoints?.length > 0 && (
                      <div className="eval-point-box points-improve">
                        <h5>
                          <TrendingUp size={16} /> Suggestions to Elevate
                        </h5>
                        <ul>
                          {currentEvaluation.improvePoints.map((pt, i) => (
                            <li key={i}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {currentEvaluation.suggestedAnswer && (
                    <div className="model-answer-accordion">
                      <strong>Recommended Model Approach:</strong>
                      <p>{currentEvaluation.suggestedAnswer}</p>
                    </div>
                  )}

                  <div className="eval-next-actions">
                    <button
                      className="btn-primary next-q-btn"
                      onClick={handleNextQuestion}
                      disabled={finishing}
                    >
                      {finishing ? (
                        <>
                          <Sparkles size={18} className="spin-slow" />
                          Finalizing Session...
                        </>
                      ) : currentQIndex < session.questions.length - 1 ? (
                        <>
                          Next Question ({currentQIndex + 2}/{session.questions.length})
                          <ArrowRight size={18} />
                        </>
                      ) : (
                        <>
                          <Trophy size={18} />
                          Finish & View Session Summary
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
