import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";

const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

const sanitizeJson = (text?: string) => {
  if (!text) throw new Error("Empty AI response received.");
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned);
};

const askAI = async (prompt: string, maxAttempts = 4): Promise<any> => {
  const ai = getAIClient();
  const primaryModel = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const modelChain = [
    primaryModel,
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3-flash-preview",
  ];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const model = modelChain[attempt - 1] || modelChain[1];
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      return sanitizeJson(response.text?.trim());
    } catch (err: any) {
      const isQuotaOrDemand =
        err?.status === 429 ||
        err?.status === 503 ||
        err?.message?.includes("429") ||
        err?.message?.includes("503") ||
        err?.message?.includes("Quota exceeded") ||
        err?.message?.includes("RESOURCE_EXHAUSTED") ||
        err?.message?.includes("demand");

      if (isQuotaOrDemand && attempt < maxAttempts) {
        const nextModel = modelChain[attempt] || modelChain[1];
        console.warn(
          `Gemini API issue on ${model} (status: ${err?.status}). Retrying with ${nextModel} in 2s...`
        );
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      throw err;
    }
  }
};

export const analyzeResume = async (resume: {
  title: string;
  skills: string[];
  education: string[];
  experience: string[];
  projects: string[];
}) => {
  const prompt = `
You are a professional ATS resume evaluator and technical internship recruiter.
Evaluate this student resume for software internship readiness. Return ONLY valid JSON:
{
  "score": 0,
  "breakdown": {
    "technicalSkills": 0,
    "projects": 0,
    "experience": 0,
    "education": 0,
    "completeness": 0,
    "relevance": 0
  },
  "matchedSkills": [],
  "missingSkills": [],
  "strengths": [],
  "weaknesses": [],
  "suggestions": []
}
Limits: technicalSkills: 0-30, projects: 0-25, experience: 0-20, education: 0-10, completeness: 0-10, relevance: 0-5.
Sum must equal score. Do not use markdown outside JSON.
Resume: ${JSON.stringify(resume)}`;

  const result = await askAI(prompt);

  const breakdown = result.breakdown;
  if (breakdown) {
    result.score =
      (breakdown.technicalSkills || 0) +
      (breakdown.projects || 0) +
      (breakdown.experience || 0) +
      (breakdown.education || 0) +
      (breakdown.completeness || 0) +
      (breakdown.relevance || 0);
  }

  return result;
};

export const generateSkillGap = async (resume: any, internship: any) => {
  const prompt = `
Compare candidate resume with internship. Return compact JSON:
{
  "matchPercentage": number,
  "existingSkills": string[],
  "missingSkills": [
    { "skill": string, "priority": "High" | "Medium" | "Low", "reason": string, "relevance": string }
  ],
  "roadmap": [
    { "week": number, "focus": string, "actions": [{ "id": string, "text": string }] }
  ]
}
Max 4 weeks, 2 actions per week. High/Medium/Low priority. Match percentage 0-100.
Candidate: ${JSON.stringify(resume)}
Internship: ${JSON.stringify(internship)}`;

  try {
    const result = await askAI(prompt);

    if (typeof result.matchPercentage !== "number") {
      result.matchPercentage = 65;
    } else {
      result.matchPercentage = Math.max(0, Math.min(100, Math.round(result.matchPercentage)));
    }

    result.existingSkills = Array.isArray(result.existingSkills) ? result.existingSkills : [];
    result.missingSkills = Array.isArray(result.missingSkills) ? result.missingSkills : [];

    if (Array.isArray(result.roadmap)) {
      result.roadmap = result.roadmap.map((weekItem: any, wIdx: number) => {
        const weekNum = weekItem.week || wIdx + 1;
        const rawActions = Array.isArray(weekItem.actions) ? weekItem.actions : [];
        const actions = rawActions.map((act: any, aIdx: number) => ({
          id: act.id || `w${weekNum}-act${aIdx + 1}`,
          text: typeof act === "string" ? act : act.text || "Complete action item",
        }));
        return {
          week: weekNum,
          focus: weekItem.focus || `Week ${weekNum} Focus`,
          actions,
        };
      });
    } else {
      result.roadmap = [];
    }

    return result;
  } catch (err) {
    console.warn("AI Skill Gap fallback triggered:", err);
    // Graceful fallback if Gemini quota is completely exhausted
    const required = internship.requiredSkills || ["JavaScript", "React", "Node.js", "Git"];
    const candidateSkills = resume.skills || [];
    const matched = candidateSkills.filter((s: string) =>
      required.some((r: string) => r.toLowerCase().includes(s.toLowerCase()))
    );
    const missing = required.filter((r: string) =>
      !candidateSkills.some((s: string) => s.toLowerCase().includes(r.toLowerCase()))
    );

    const matchPct = Math.round(
      Math.max(40, (matched.length / Math.max(required.length, 1)) * 100)
    );

    return {
      matchPercentage: matchPct,
      existingSkills: matched.length ? matched : candidateSkills.slice(0, 4),
      missingSkills: missing.map((skill: string, idx: number) => ({
        skill,
        priority: idx === 0 ? "High" : idx === 1 ? "Medium" : "Low",
        reason: `Essential for ${internship.title || "this role"} technical expectations.`,
        relevance: `Directly mentioned in job requirements.`,
      })),
      roadmap: [
        {
          week: 1,
          focus: "Core Foundations & Tooling",
          actions: [
            { id: "w1-act1", text: `Review and build a small test project with ${missing[0] || "core tools"}.` },
            { id: "w1-act2", text: "Read documentation and best practices for project architecture." },
          ],
        },
        {
          week: 2,
          focus: "Hands-on Implementation",
          actions: [
            { id: "w2-act1", text: "Integrate full CRUD and state management into a portfolio repository." },
            { id: "w2-act2", text: "Write clean unit tests and commit via Git with semantic messages." },
          ],
        },
        {
          week: 3,
          focus: "Advanced Patterns & Optimization",
          actions: [
            { id: "w3-act1", text: "Implement error handling, caching, and performance optimizations." },
            { id: "w3-act2", text: "Deploy working application to Vercel/Render with live demo link." },
          ],
        },
        {
          week: 4,
          focus: "Interview Preparation & Polishing",
          actions: [
            { id: "w4-act1", text: `Practice explaining architectural decisions for ${internship.title}.` },
            { id: "w4-act2", text: "Update resume bullet points highlighting your hands-on deliverables." },
          ],
        },
      ],
    };
  }
};

export const generateInterviewQuestions = async (
  resume: any,
  internship: any,
  type: string,
  difficulty: string
) => {
  const prompt = `
Generate 5 interview questions for a student applying to:
Role: ${internship?.title || "Software Engineering Intern"} at ${internship?.company || "Tech Company"}
Interview Type: ${type} (technical, behavioral, or mixed)
Difficulty: ${difficulty}
Candidate Resume Summary: ${JSON.stringify(resume)}

Return ONLY valid JSON array:
[
  {
    "id": "q1",
    "question": "string",
    "type": "${type}",
    "whyItMatters": "string",
    "expectedPoints": ["point1", "point2"],
    "suggestedAnswer": "string"
  }
]
Do not wrap in markdown. Only JSON.`;

  try {
    const questions = await askAI(prompt);
    if (Array.isArray(questions) && questions.length > 0) {
      return questions.map((q: any, idx: number) => ({
        id: q.id || `q${idx + 1}`,
        question: q.question,
        type: q.type || type,
        whyItMatters: q.whyItMatters || "Evaluates candidate technical readiness and problem solving.",
        expectedPoints: Array.isArray(q.expectedPoints) ? q.expectedPoints : ["Clear explanation", "Practical examples"],
        suggestedAnswer: q.suggestedAnswer || "A well-structured answer explaining the concept with a real-world example.",
      }));
    }
    throw new Error("Invalid questions structure");
  } catch (err) {
    console.warn("AI Question Generation fallback triggered:", err);
    // Resilient fallback questions based on role
    return [
      {
        id: "q1",
        question: `Can you walk us through a recent project you built using ${resume.skills?.[0] || "modern web technologies"}, explaining the architecture and key technical challenges?`,
        type: "technical",
        whyItMatters: "Assesses hands-on engineering ability and architectural decision making.",
        expectedPoints: ["Project purpose & architecture", "Key libraries used", "Challenge faced and resolved"],
        suggestedAnswer: "Discuss the project goal, your role, the technologies chosen, how components communicate, and how you solved a specific bug or bottleneck.",
      },
      {
        id: "q2",
        question: `How do you handle asynchronous operations and error states in your applications? Give a concrete example.`,
        type: "technical",
        whyItMatters: "Tests core async understanding, error handling, and reliability.",
        expectedPoints: ["Promises / async-await", "try-catch blocks", "User-friendly feedback"],
        suggestedAnswer: "Explain async/await syntax, graceful error catching, UI loading/error states, and retry strategies.",
      },
      {
        id: "q3",
        question: `Tell me about a time when you had to learn a completely new library or framework quickly under a tight deadline. How did you approach it?`,
        type: "behavioral",
        whyItMatters: "Measures adaptability, self-directed learning, and resourcefulness.",
        expectedPoints: ["Initial approach (docs, tutorials)", "Building a minimal prototype", "Outcome and learnings"],
        suggestedAnswer: "Use the STAR method (Situation, Task, Action, Result) to describe how you reviewed official docs, built a proof-of-concept, and delivered.",
      },
      {
        id: "q4",
        question: `What steps do you take when reviewing your own code before submitting a pull request to ensure high quality and security?`,
        type: "technical",
        whyItMatters: "Demonstrates software craftsmanship, attention to detail, and team collaboration.",
        expectedPoints: ["Linting and formatting", "Sanitizing inputs", "Self-testing happy and edge paths"],
        suggestedAnswer: "Highlight running tests, checking for clean commit history, avoiding hardcoded secrets, and reviewing diffs before asking for review.",
      },
      {
        id: "q5",
        question: `Why are you interested in this ${internship?.title || "Internship"} role, and what unique perspective or strengths do you bring?`,
        type: "behavioral",
        whyItMatters: "Evaluates cultural alignment, motivation, and self-awareness.",
        expectedPoints: ["Genuine enthusiasm for company/domain", "Connection to career goals", "Key strength backed by proof"],
        suggestedAnswer: "Connect your specific technical interests to the company's domain, mentioning what you hope to learn and how your background contributes.",
      },
    ];
  }
};

export const evaluateAnswer = async (
  question: string,
  studentAnswer: string,
  context?: any
) => {
  const prompt = `
Evaluate this student's interview answer:
Question: "${question}"
Student Answer: "${studentAnswer}"
Context: ${JSON.stringify(context || {})}

Return ONLY valid JSON:
{
  "score": number (0-100),
  "feedback": "string (constructive feedback)",
  "goodPoints": ["string"],
  "missingPoints": ["string"],
  "improvePoints": ["string"],
  "suggestedAnswer": "string (ideal answer)"
}
Score fairly: 0-40 for vague/incomplete, 40-70 for average, 70-100 for strong structured answers.
Do not use markdown outside JSON.`;

  try {
    const evalResult = await askAI(prompt);
    return {
      score: typeof evalResult.score === "number" ? Math.max(0, Math.min(100, Math.round(evalResult.score))) : 70,
      feedback: evalResult.feedback || "Good effort. Consider structuring your answer using the STAR method.",
      goodPoints: Array.isArray(evalResult.goodPoints) ? evalResult.goodPoints : ["Addressed the core question"],
      missingPoints: Array.isArray(evalResult.missingPoints) ? evalResult.missingPoints : ["Could include more specific metrics"],
      improvePoints: Array.isArray(evalResult.improvePoints) ? evalResult.improvePoints : ["Provide deeper technical justification"],
      suggestedAnswer: evalResult.suggestedAnswer || "A structured answer demonstrating problem statement, chosen solution, and quantitative outcome.",
    };
  } catch (err) {
    console.warn("AI Answer Evaluation fallback triggered:", err);
    // Intelligent heuristic evaluation if Gemini is rate limited
    const wordCount = (studentAnswer || "").trim().split(/\s+/).length;
    let score = 55;
    if (wordCount > 60) score = 82;
    else if (wordCount > 30) score = 72;
    else if (wordCount > 15) score = 60;
    else score = 40;

    return {
      score,
      feedback: wordCount > 30
        ? "Solid response with good detail. To elevate it further, quantify your impact and explicitly mention technical tradeoffs."
        : "Brief answer. Aim to elaborate more on your specific actions and the outcomes achieved.",
      goodPoints: [
        "Directly addressed the question prompt",
        wordCount > 30 ? "Included specific context from your experience" : "Maintained concise communication",
      ],
      missingPoints: [
        "Specific metrics or measurable project impact",
        "Discussion of alternative approaches considered",
      ],
      improvePoints: [
        "Use the STAR framework (Situation, Task, Action, Result) for clear narrative flow",
        "Mention unit testing or deployment considerations where applicable",
      ],
      suggestedAnswer:
        "Begin with the context, state the exact challenge, describe the step-by-step technical solution you implemented, and finish with the quantifiable result.",
    };
  }
};