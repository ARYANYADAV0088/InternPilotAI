import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../lib/api";
import {
  Target,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  BriefcaseBusiness,
  Trash2,
  MapPin,
  ChevronRight,
  Check,
} from "lucide-react";

function CareerIntelligence() {
  const navigate = useNavigate();

  // Core collections
  const [resumes, setResumes] = useState([]);
  const [internships, setInternships] = useState([]);
  const [savedRoadmaps, setSavedRoadmaps] = useState([]);

  // Selection states
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [selectedInternshipId, setSelectedInternshipId] = useState("");

  // Active Roadmap state
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [completedActionIds, setCompletedActionIds] = useState(new Set());

  // Loading & Error states
  const [initialLoading, setInitialLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [progressUpdating, setProgressUpdating] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Deletion confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setInitialLoading(true);
      setPageError(null);

      const [resumesRes, internshipsRes, roadmapsRes] = await Promise.all([
        api.get("/api/resumes"),
        api.get("/api/internships"),
        api.get("/api/skill-gaps"),
      ]);

      const loadedResumes = resumesRes.data.resumes || [];
      const loadedInternships = internshipsRes.data.internships || [];
      const loadedRoadmaps = roadmapsRes.data.skillGaps || [];

      setResumes(loadedResumes);
      setInternships(loadedInternships);
      setSavedRoadmaps(loadedRoadmaps);

      // Default selections
      if (loadedResumes.length > 0) {
        setSelectedResumeId((prev) => prev || loadedResumes[0]._id);
      }
      if (loadedInternships.length > 0) {
        setSelectedInternshipId((prev) => prev || loadedInternships[0]._id);
      }

      // If roadmaps exist, default active roadmap to the most recently updated one
      if (loadedRoadmaps.length > 0) {
        const latest = loadedRoadmaps[0];
        setActiveRoadmap(latest);
        setCompletedActionIds(new Set(latest.completedActions || []));
        if (latest.resumeId?._id) setSelectedResumeId(latest.resumeId._id);
        if (latest.internshipId?._id) setSelectedInternshipId(latest.internshipId._id);
      }
    } catch (error) {
      console.error("Failed to load Career Intelligence data:", error);
      setPageError("Failed to load career data. Please verify connection and retry.");
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Generate Career Roadmap
  const handleGenerate = async () => {
    if (!selectedResumeId || !selectedInternshipId || generating) return;

    try {
      setGenerating(true);
      setGenerateError(null);
      setActionError(null);

      const response = await api.post("/api/skill-gaps/generate", {
        resumeId: selectedResumeId,
        internshipId: selectedInternshipId,
      });

      const newRecord = response.data.skillGap;
      setActiveRoadmap(newRecord);
      setCompletedActionIds(new Set(newRecord.completedActions || []));

      // Refresh saved roadmaps list
      const roadmapsRes = await api.get("/api/skill-gaps");
      setSavedRoadmaps(roadmapsRes.data.skillGaps || []);
    } catch (error) {
      console.error("Generate roadmap error:", error);
      setGenerateError(
        error.response?.data?.message ||
          "Gemini Career Intelligence analysis is temporarily unavailable. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  // Toggle Roadmap Action Checkbox
  const handleToggleAction = async (actionId) => {
    if (!activeRoadmap || progressUpdating) return;

    const previousSet = new Set(completedActionIds);
    const updatedSet = new Set(completedActionIds);

    if (updatedSet.has(actionId)) {
      updatedSet.delete(actionId);
    } else {
      updatedSet.add(actionId);
    }

    // Optimistic UI update
    setCompletedActionIds(updatedSet);
    setActionError(null);

    // Calculate optimistic progress
    const allActionIds = [];
    (activeRoadmap.roadmap || []).forEach((w) => {
      (w.actions || []).forEach((a) => {
        if (a.id) allActionIds.push(a.id);
      });
    });
    const optimisticPercentage =
      allActionIds.length > 0
        ? Math.round((updatedSet.size / allActionIds.length) * 100)
        : 0;

    setActiveRoadmap((prev) => ({
      ...prev,
      completedActions: Array.from(updatedSet),
      progressPercentage: optimisticPercentage,
    }));

    try {
      setProgressUpdating(true);
      const res = await api.put("/api/skill-gaps/" + activeRoadmap._id + "/progress", {
        completedActions: Array.from(updatedSet),
      });

      // Synchronize with server response
      const serverUpdated = res.data.skillGap || {
        ...activeRoadmap,
        completedActions: res.data.completedActions || Array.from(updatedSet),
        progressPercentage:
          res.data.progressPercentage !== undefined
            ? res.data.progressPercentage
            : optimisticPercentage,
      };
      setActiveRoadmap((prev) => ({
        ...prev,
        ...serverUpdated,
        completedActions: serverUpdated.completedActions || [],
        progressPercentage: serverUpdated.progressPercentage || 0,
      }));
      setCompletedActionIds(new Set(serverUpdated.completedActions || []));

      // Update in saved list
      setSavedRoadmaps((prevList) =>
        prevList.map((item) =>
          String(item._id) === String(activeRoadmap._id) ? serverUpdated : item
        )
      );
    } catch (error) {
      console.error("Update progress error:", error);
      // Revert optimistic state
      setCompletedActionIds(previousSet);
      setActiveRoadmap((prev) => ({
        ...prev,
        completedActions: Array.from(previousSet),
        progressPercentage:
          allActionIds.length > 0
            ? Math.round((previousSet.size / allActionIds.length) * 100)
            : 0,
      }));
      setActionError("Failed to save progress update. Reverted.");
    } finally {
      setProgressUpdating(false);
    }
  };

  // Select a previously generated roadmap
  const handleSelectSavedRoadmap = async (roadmapId) => {
    try {
      const res = await api.get("/api/skill-gaps/" + roadmapId);
      const record = res.data.skillGap;
      setActiveRoadmap(record);
      setCompletedActionIds(new Set(record.completedActions || []));

      if (record.resumeId?._id) setSelectedResumeId(record.resumeId._id);
      if (record.internshipId?._id) setSelectedInternshipId(record.internshipId._id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Load roadmap error:", error);
      setActionError("Unable to load the selected roadmap.");
    }
  };

  // Delete Roadmap
  const handleDeleteRoadmap = async (roadmapId, e) => {
    e.stopPropagation();
    try {
      await api.delete("/api/skill-gaps/" + roadmapId);
      setSavedRoadmaps((prev) => prev.filter((item) => item._id !== roadmapId));
      if (activeRoadmap?._id === roadmapId) {
        setActiveRoadmap(null);
        setCompletedActionIds(new Set());
      }
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Delete roadmap error:", error);
      setActionError("Failed to delete roadmap.");
    }
  };

  const getPriorityClass = (priority) => {
    switch (String(priority).toLowerCase()) {
      case "high":
        return "badge-danger";
      case "medium":
        return "badge-warning";
      case "low":
      default:
        return "badge-secondary";
    }
  };

  // 1. Initial Loading State
  if (initialLoading) {
    return (
      <Layout>
        <div className="page">
          <div className="empty-card">
            <div className="loading-spinner" />
            <p style={{ marginTop: "12px" }}>Loading Career Intelligence...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // 2. Page Error State
  if (pageError) {
    return (
      <Layout>
        <div className="page">
          <div className="empty-card">
            <AlertCircle size={40} style={{ color: "var(--danger)" }} />
            <h3>Error Loading Career Intelligence</h3>
            <p>{pageError}</p>
            <button className="primary-btn" onClick={fetchData} style={{ marginTop: "14px" }}>
              <RotateCcw size={15} /> Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // 3. No Resume State
  if (resumes.length === 0) {
    return (
      <Layout>
        <div className="page">
          <div className="page-header">
            <div>
              <p className="eyebrow">CAREER INTELLIGENCE</p>
              <h1>Skill Gap & Learning Roadmap</h1>
              <p>Compare your profile with target roles and level up your skills.</p>
            </div>
          </div>

          <div className="empty-card" style={{ maxWidth: "540px", margin: "40px auto" }}>
            <div className="resume-icon" style={{ width: "54px", height: "54px" }}>
              <BookOpen size={28} />
            </div>
            <h3>Create a resume first to unlock Career Intelligence</h3>
            <p style={{ margin: "10px 0 20px" }}>
              Our Gemini AI needs your skills, projects, and coursework to generate personalized skill gap analyses and weekly roadmaps.
            </p>
            <button className="primary-btn" onClick={() => navigate("/resume")}>
              <Sparkles size={16} /> Create Resume <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // 4. No Active Internships State
  if (internships.length === 0) {
    return (
      <Layout>
        <div className="page">
          <div className="page-header">
            <div>
              <p className="eyebrow">CAREER INTELLIGENCE</p>
              <h1>Skill Gap & Learning Roadmap</h1>
            </div>
          </div>
          <div className="empty-card">
            <BriefcaseBusiness size={40} />
            <h3>No active internships available</h3>
            <p>Internships will appear here as soon as recruiters publish them.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const selectedInternship = internships.find((i) => i._id === selectedInternshipId);
  const totalRoadmapActions = [];
  if (activeRoadmap?.roadmap) {
    activeRoadmap.roadmap.forEach((w) => {
      (w.actions || []).forEach((a) => {
        if (a.id) totalRoadmapActions.push(a);
      });
    });
  }
  const completedCount = completedActionIds.size;
  const isAllCompleted = totalRoadmapActions.length > 0 && completedCount >= totalRoadmapActions.length;

  return (
    <Layout>
      <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">CAREER COPILOT</p>
          <h1>Career Intelligence</h1>
          <p>Select a target internship, identify skill gaps, and complete your personalized roadmap.</p>
        </div>
      </div>

      {actionError && (
        <div className="alert alert-error" style={{ marginBottom: "20px" }}>
          <AlertCircle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {/* TARGET SELECTION PANEL */}
      <div className="panel career-selector-panel" style={{ marginBottom: "28px" }}>
        <p className="eyebrow" style={{ margin: "0 0 14px" }}>TARGET SELECTION</p>
        <div className="career-selectors-grid">
          {/* Resume Selector */}
          <div className="filter-group">
            <label>Select Your Resume</label>
            <select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
            >
              {resumes.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.title} ({r.skills?.length || 0} skills)
                </option>
              ))}
            </select>
          </div>

          {/* Internship Selector */}
          <div className="filter-group">
            <label>Select Target Internship</label>
            <select
              value={selectedInternshipId}
              onChange={(e) => setSelectedInternshipId(e.target.value)}
            >
              {internships.map((i) => (
                <option key={i._id} value={i._id}>
                  {i.title} — {i.company} ({i.location || "Remote"})
                </option>
              ))}
            </select>
          </div>

          {/* Analyze Action */}
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              className="primary-btn"
              style={{ width: "100%", height: "42px" }}
              disabled={generating || !selectedResumeId || !selectedInternshipId}
              onClick={handleGenerate}
            >
              <Sparkles size={16} />
              {generating ? "Analyzing with Gemini..." : "Analyze Career Fit"}
            </button>
          </div>
        </div>

        {/* Selected Target Preview Pill */}
        {selectedInternship && (
          <div className="target-preview-bar" style={{ marginTop: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <strong style={{ color: "var(--text)" }}>Target:</strong>
              <span>{selectedInternship.title}</span>
              <span className="target-dot">•</span>
              <span style={{ color: "var(--primary)", fontWeight: 600 }}>{selectedInternship.company}</span>
              {selectedInternship.location && (
                <>
                  <span className="target-dot">•</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                    <MapPin size={13} style={{ display: "inline", verticalAlign: "middle" }} /> {selectedInternship.location}
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI GENERATING STATE */}
      {generating && (
        <div className="empty-card" style={{ marginBottom: "28px" }}>
          <div className="loading-spinner" />
          <h3 style={{ marginTop: "14px" }}>Generating Career Roadmap</h3>
          <p style={{ maxWidth: "480px" }}>
            Gemini 3.6 Flash is comparing your resume against this opportunity, identifying missing skills, and building a structured week-by-week learning plan...
          </p>
        </div>
      )}

      {/* GENERATE ERROR */}
      {generateError && (
        <div className="alert alert-error" style={{ marginBottom: "28px" }}>
          <AlertCircle size={18} />
          <div>
            <p style={{ margin: 0 }}>{generateError}</p>
            <button
              className="secondary-btn"
              onClick={handleGenerate}
              style={{ marginTop: "8px", padding: "4px 10px", fontSize: "12px" }}
            >
              Retry Analysis
            </button>
          </div>
        </div>
      )}

      {/* MAIN ACTIVE ROADMAP VIEW */}
      {activeRoadmap && !generating && (
        <div className="career-active-section">
          {/* Target Summary Banner */}
          <div className="panel career-summary-card" style={{ marginBottom: "24px" }}>
            <div className="career-summary-left">
              <div className="resume-icon" style={{ width: "52px", height: "52px" }}>
                <Target size={26} />
              </div>
              <div>
                <span className="eyebrow" style={{ margin: 0 }}>ACTIVE TARGET ROLE</span>
                <h2 style={{ margin: "4px 0", fontSize: "22px" }}>
                  {activeRoadmap.internshipId?.title || "Target Opportunity"}
                </h2>
                <p style={{ margin: 0, color: "var(--primary)", fontWeight: 600 }}>
                  {activeRoadmap.internshipId?.company || "Company"}
                </p>
              </div>
            </div>

            {/* Match & Progress Dials */}
            <div className="career-summary-right">
              {/* Match Alignment Score */}
              <div className="stat-pill">
                <span className="stat-pill-label">Readiness Alignment</span>
                <div className="stat-pill-value">
                  {activeRoadmap.matchPercentage || 0}%
                </div>
                <span className="stat-pill-hint">Based on verified skills</span>
              </div>

              {/* Progress Tracker */}
              <div className="stat-pill">
                <span className="stat-pill-label">Roadmap Progress</span>
                <div className="stat-pill-value" style={{ color: isAllCompleted ? "var(--success)" : "var(--primary)" }}>
                  {activeRoadmap.progressPercentage || 0}%
                </div>
                <span className="stat-pill-hint">
                  {completedCount} of {totalRoadmapActions.length} actions complete
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="roadmap-progress-container" style={{ marginBottom: "28px" }}>
            <div className="roadmap-progress-header">
              <span style={{ fontSize: "13px", fontWeight: 600 }}>
                {isAllCompleted ? "🎉 All Actions Complete! You are ready to apply!" : "Overall Roadmap Completion"}
              </span>
              <span style={{ fontSize: "13px", fontWeight: 700 }}>
                {activeRoadmap.progressPercentage || 0}%
              </span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{
                  width: (activeRoadmap.progressPercentage || 0) + "%",
                  background: isAllCompleted ? "var(--success)" : "linear-gradient(90deg, var(--primary), #8b5cf6)",
                }}
              />
            </div>
          </div>

          {/* Two-Column Comparison: Skills You Have vs Skill Gaps */}
          <div className="career-skills-grid" style={{ marginBottom: "28px" }}>
            {/* Skills You Have */}
            <div className="panel">
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <CheckCircle2 size={18} style={{ color: "var(--success)" }} />
                <h3 style={{ margin: 0, fontSize: "17px" }}>Skills You Have</h3>
              </div>
              <div className="skills-badge-list">
                {activeRoadmap.existingSkills?.length ? (
                  activeRoadmap.existingSkills.map((skill, idx) => (
                    <span key={idx} className="skill-pill matched">
                      ✓ {skill}
                    </span>
                  ))
                ) : (
                  <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    No exact required skills identified on this resume yet.
                  </p>
                )}
              </div>
            </div>

            {/* Missing Skill Gaps */}
            <div className="panel">
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <AlertCircle size={18} style={{ color: "var(--warning)" }} />
                <h3 style={{ margin: 0, fontSize: "17px" }}>Identified Skill Gaps</h3>
              </div>

              {activeRoadmap.missingSkills?.length ? (
                <div className="missing-skills-list">
                  {activeRoadmap.missingSkills.map((gap, idx) => (
                    <div key={idx} className="missing-skill-row">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "14px" }}>{gap.skill}</strong>
                        <span className={"badge " + getPriorityClass(gap.priority)}>
                          {gap.priority} PRIORITY
                        </span>
                      </div>
                      {gap.reason && (
                        <p style={{ margin: "5px 0 0", fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.5" }}>
                          <strong>Why it matters:</strong> {gap.reason}
                        </p>
                      )}
                      {gap.relevance && (
                        <p style={{ margin: "3px 0 0", fontSize: "12px", color: "var(--text-light)" }}>
                          <strong>Role Relevance:</strong> {gap.relevance}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "13px", color: "var(--success)" }}>
                  Zero skill gaps! You match all listed requirements.
                </p>
              )}
            </div>
          </div>

          {/* PERSONALIZED LEARNING ROADMAP */}
          <div className="panel" style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
              <div>
                <p className="eyebrow" style={{ margin: 0 }}>ACTIONABLE LEARNING PLAN</p>
                <h2 style={{ margin: "4px 0 0", fontSize: "20px" }}>Personalized Learning Roadmap</h2>
              </div>
              {progressUpdating && (
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Saving progress...</span>
              )}
            </div>

            <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "20px" }}>
              Check off each action item as you practice concepts, build projects, and prepare for this role. Progress updates automatically.
            </p>

            <div className="roadmap-weeks-list">
              {activeRoadmap.roadmap?.length ? (
                activeRoadmap.roadmap.map((weekItem, wIdx) => {
                  const weekActions = weekItem.actions || [];
                  const weekCompleted = weekActions.filter((a) => completedActionIds.has(a.id)).length;
                  const weekIsComplete = weekActions.length > 0 && weekCompleted === weekActions.length;

                  return (
                    <div key={wIdx} className={"roadmap-week-card" + (weekIsComplete ? " week-complete" : "")}>
                      <div className="roadmap-week-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span className="week-number-badge">Week {weekItem.week}</span>
                          <h3 style={{ margin: 0, fontSize: "16px" }}>{weekItem.focus}</h3>
                        </div>
                        <span className="week-completion-count">
                          {weekCompleted} / {weekActions.length} completed
                        </span>
                      </div>

                      <div className="roadmap-actions-checklist">
                        {weekActions.map((action, aIdx) => {
                          const isDone = completedActionIds.has(action.id);
                          return (
                            <label
                              key={action.id || aIdx}
                              className={"action-checkbox-item" + (isDone ? " action-done" : "")}
                            >
                              <input
                                type="checkbox"
                                checked={isDone}
                                onChange={() => handleToggleAction(action.id)}
                              />
                              <span className="custom-checkbox">
                                {isDone && <Check size={13} />}
                              </span>
                              <span className="action-text">{action.text}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                  No structured roadmap items available for this opportunity.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PREVIOUSLY SAVED ROADMAPS DRAWER / GRID */}
      {savedRoadmaps.length > 0 && (
        <div className="panel" style={{ marginTop: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div>
              <p className="eyebrow" style={{ margin: 0 }}>SAVED PLANS</p>
              <h3 style={{ margin: "4px 0 0", fontSize: "18px" }}>Your Target Career Roadmaps</h3>
            </div>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              {savedRoadmaps.length} plan{savedRoadmaps.length === 1 ? "" : "s"} saved
            </span>
          </div>

          <div className="saved-roadmaps-grid">
            {savedRoadmaps.map((item) => {
              const internshipTitle = item.internshipId?.title || "Target Internship";
              const companyName = item.internshipId?.company || "Company";
              const isActive = activeRoadmap?._id === item._id;

              return (
                <div
                  key={item._id}
                  className={"saved-roadmap-card" + (isActive ? " active-plan" : "")}
                  onClick={() => handleSelectSavedRoadmap(item._id)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h4 style={{ margin: "0 0 4px", fontSize: "15px" }}>{internshipTitle}</h4>
                    {deleteConfirmId === item._id ? (
                      <div style={{ display: "flex", gap: "4px" }} onClick={(e) => e.stopPropagation()}>
                        <button
                          className="secondary-btn"
                          style={{ padding: "2px 8px", fontSize: "11px", color: "var(--danger)" }}
                          onClick={(e) => handleDeleteRoadmap(item._id, e)}
                        >
                          Confirm
                        </button>
                        <button
                          className="secondary-btn"
                          style={{ padding: "2px 6px", fontSize: "11px" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(null);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        className="icon-delete-btn"
                        title="Delete roadmap"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(item._id);
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <p style={{ margin: "0 0 10px", fontSize: "13px", color: "var(--primary)", fontWeight: 500 }}>
                    {companyName}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)" }}>
                    <span>Match: {item.matchPercentage || 0}%</span>
                    <span>Progress: {item.progressPercentage || 0}%</span>
                  </div>

                  <div className="progress-bar-track" style={{ height: "4px", margin: "8px 0" }}>
                    <div
                      className="progress-bar-fill"
                      style={{ width: (item.progressPercentage || 0) + "%" }}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                    <small style={{ color: "var(--text-light)", fontSize: "11px" }}>
                      Updated {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                    </small>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary)", display: "flex", alignItems: "center" }}>
                      {isActive ? "Viewing" : "Open Plan"} <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
}

export default CareerIntelligence;
