import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";
import Resume from "../models/resume";
import Internship from "../models/Internship";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const matchResumeWithInternship = async (
  resumeId: string,
  internshipId: string
) => {
  const resume = await Resume.findById(resumeId);
  const internship = await Internship.findById(internshipId);

  if (!resume) {
    throw new Error("Resume not found");
  }

  if (!internship) {
    throw new Error("Internship not found");
  }

  const prompt = `
You are a professional technical recruiter and ATS system.

Evaluate how well this student's resume matches the specific internship.

========================
INTERNSHIP
========================

Title:
${internship.title}

Company:
${internship.company}

Description:
${internship.description || "Not provided"}

Required Skills:
${
  internship.requiredSkills?.length
    ? internship.requiredSkills.join(", ")
    : "None provided"
}

========================
CANDIDATE RESUME
========================

Resume Title:
${resume.title}

Skills:
${resume.skills?.length
  ? resume.skills.join(", ")
  : "None"}

Education:
${resume.education?.length
  ? resume.education.join(" | ")
  : "None"}

Experience:
${resume.experience?.length
  ? resume.experience.join(" | ")
  : "None"}

Projects:
${resume.projects?.length
  ? resume.projects.join(" | ")
  : "None"}


========================
MATCHING RULES
========================

Calculate a match score from 0 to 100.

Consider:

1. Required technical skills — 40 points
2. Relevant projects — 20 points
3. Relevant experience — 20 points
4. Education/background — 10 points
5. Overall internship relevance — 10 points

Important:

- Only use information explicitly present in the resume.
- Never assume the candidate has a skill that is not listed or clearly demonstrated.
- A missing required skill should reduce the score.
- Relevant projects can compensate partially for lack of professional experience.
- Do not give a high score merely because the candidate has many unrelated skills.
- Compare the actual internship requirements with the actual candidate profile.
- Distinguish between exact skill matches and loosely related skills.
- The final score must equal the sum of the five breakdown categories.
- Keep the evaluation realistic for an internship applicant.


========================
RETURN FORMAT
========================

Return ONLY valid JSON.

Use exactly:

{
  "matchScore": 0,
  "recommendation": "",
  "breakdown": {
    "skills": 0,
    "projects": 0,
    "experience": 0,
    "education": 0,
    "relevance": 0
  },
  "matchedSkills": [],
  "missingSkills": [],
  "strengths": [],
  "weaknesses": [],
  "insights": []
}

Score limits:

skills: 0-40
projects: 0-20
experience: 0-20
education: 0-10
relevance: 0-10

The five breakdown values MUST add up exactly to matchScore.

recommendation must be one of:

"Excellent Match"
"Strong Match"
"Good Match"
"Partial Match"
"Low Match"

matchedSkills:
Only include skills from the internship requirements that the candidate actually possesses.

missingSkills:
Only include important internship-required skills that the candidate does not demonstrate.

strengths:
Give 2-5 specific reasons why the candidate fits the internship.

weaknesses:
Give 2-5 specific gaps affecting the candidate's match.

insights:
Give 3-6 useful recommendations for improving the candidate's chances for THIS internship.

Do not use markdown.
Do not include anything outside the JSON.
`;
let response;

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    break;
  } catch (error: any) {
    console.error(
      `Gemini recommendation attempt ${attempt} failed:`,
      error?.status || error?.message || error
    );

    if (attempt === 3) {
      throw error;
    }

    const delay = attempt * 2000;

    await new Promise((resolve) =>
      setTimeout(resolve, delay)
    );
  }
}

if (!response) {
  throw new Error("Gemini did not return a response.");
}

const text = response.text?.trim();
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let result;

  try {
    result = JSON.parse(cleaned);
  } catch (error) {
    console.error("Invalid Gemini JSON:", cleaned);
    throw new Error("AI returned an invalid analysis.");
  }

  // Make sure the score is always mathematically correct.
  if (result.breakdown) {
    const calculatedScore =
      Number(result.breakdown.skills || 0) +
      Number(result.breakdown.projects || 0) +
      Number(result.breakdown.experience || 0) +
      Number(result.breakdown.education || 0) +
      Number(result.breakdown.relevance || 0);

    result.matchScore = Math.min(
      100,
      Math.max(0, calculatedScore)
    );
  }

  return result;
};

export const getAIRecommendations = async (
  resumeId: string,
  internships: any[]
) => {
  const resume = await Resume.findById(resumeId);

  if (!resume) {
    throw new Error("Resume not found");
  }

  if (!internships.length) {
    return {
      skillGap: {
        currentSkills: resume.skills || [],
        missingSkills: [],
        suggestions: [],
      },
      recommendations: [],
    };
  }

  const internshipData = internships.map((internship) => ({
    id: internship._id.toString(),
    title: internship.title,
    company: internship.company,
    description: internship.description || "",
    requiredSkills: internship.requiredSkills || [],
  }));

  const prompt = `
You are an expert technical recruiter and career advisor.

Analyze this student's resume and recommend the most suitable internships from the provided list.

========================
CANDIDATE
========================

Resume Title:
${resume.title}

Skills:
${resume.skills?.length ? resume.skills.join(", ") : "None"}

Education:
${resume.education?.length ? resume.education.join(" | ") : "None"}

Experience:
${resume.experience?.length ? resume.experience.join(" | ") : "None"}

Projects:
${resume.projects?.length ? resume.projects.join(" | ") : "None"}


========================
AVAILABLE INTERNSHIPS
========================

${JSON.stringify(internshipData, null, 2)}


========================
TASK
========================

Perform TWO analyses.

1. SKILL GAP ANALYSIS

Identify:

- Current technical skills explicitly demonstrated by the candidate.
- Important technical skills the candidate is missing for the available internships.
- Practical skills the candidate should learn or improve.

Do not invent skills.

2. INTERNSHIP RECOMMENDATIONS

Evaluate every internship.

Calculate a recommendation score from 0-100 using:

- Skills match: 40 points
- Projects relevance: 20 points
- Experience relevance: 15 points
- Education/background: 10 points
- Overall role relevance: 15 points

Important rules:

- Only use information explicitly present in the resume.
- Do not assume the candidate knows a technology.
- Exact skill matches should receive more weight than loosely related skills.
- Missing required skills should reduce the score.
- Relevant projects can compensate partially for lack of professional experience.
- Consider the internship description, not only requiredSkills.
- Do NOT recommend internships simply because they exist.
- Every internship must be evaluated.
- Sort recommendations from highest score to lowest score.
- Return the internship ID exactly as provided.
- Scores must be realistic.


========================
RETURN ONLY VALID JSON
========================

{
  "skillGap": {
    "currentSkills": [],
    "missingSkills": [],
    "suggestions": []
  },
  "recommendations": [
    {
      "internshipId": "",
      "matchScore": 0,
      "recommendation": "",
      "matchedSkills": [],
      "missingSkills": [],
      "whyMatch": [],
      "concerns": []
    }
  ]
}

recommendation must be one of:

"Excellent Match"
"Strong Match"
"Good Match"
"Partial Match"
"Low Match"

Rules:

currentSkills:
Only skills explicitly present in the resume.

missingSkills:
Important technical skills required by the available internships that the candidate does not demonstrate.

suggestions:
Give 3-6 practical learning or resume improvement suggestions.

matchedSkills:
Only skills explicitly present in the resume AND relevant to that internship.

missingSkills:
Only important skills required/relevant to that specific internship.

whyMatch:
Give 2-4 specific reasons why the internship fits.

concerns:
Give 1-4 specific concerns or gaps.

Do not use markdown.
Do not include text outside JSON.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
  });

  const text = response.text?.trim();

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let result;

  try {
    result = JSON.parse(cleaned);
  } catch (error) {
    console.error("Invalid Gemini recommendation JSON:", cleaned);
    throw new Error("AI returned an invalid recommendation analysis.");
  }

  if (Array.isArray(result.recommendations)) {
    result.recommendations = result.recommendations
      .map((item: any) => ({
        ...item,
        matchScore: Math.min(
          100,
          Math.max(0, Number(item.matchScore || 0))
        ),
      }))
      .sort(
        (a: any, b: any) => b.matchScore - a.matchScore
      );
  }

  return result;
};