import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const analyzeResume = async (resume: {
  title: string;
  skills: string[];
  education: string[];
  experience: string[];
  projects: string[];
}) => {
  const prompt = `
You are a professional ATS resume evaluator and technical internship recruiter.

Your task is to evaluate a student's resume for a software/technology internship.

CANDIDATE RESUME

Title:
${resume.title}

Skills:
${resume.skills.length ? resume.skills.join(", ") : "None"}

Education:
${resume.education.length ? resume.education.join(" | ") : "None"}

Experience:
${resume.experience.length ? resume.experience.join(" | ") : "None"}

Projects:
${resume.projects.length ? resume.projects.join(" | ") : "None"}


SCORING SYSTEM

Calculate the final score using these exact categories:

1. Technical Skills: 30 points
2. Projects: 25 points
3. Experience: 20 points
4. Education: 10 points
5. Resume Completeness: 10 points
6. Internship Relevance: 5 points

Total = 100 points.

IMPORTANT SCORING RULES:

- Give points based ONLY on information provided.
- Do not assume skills, experience, projects or education that are not provided.
- Do not give a high score simply because the candidate is a student.
- A student without experience can still score well if their skills and projects are strong.
- Projects should receive higher scores when they demonstrate real technical implementation.
- Technical skills should receive higher scores when they are relevant to software internships.
- Education should receive points only when meaningful education information is provided.
- Resume completeness should reflect how many important resume sections contain useful information.
- Internship relevance should reflect how well the candidate's profile fits a typical software/technology internship.
- Keep scoring consistent and realistic.
- The final score must equal the sum of all category scores.

RETURN ONLY VALID JSON.

Use exactly this structure:

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

BREAKDOWN LIMITS:

technicalSkills: 0-30
projects: 0-25
experience: 0-20
education: 0-10
completeness: 0-10
relevance: 0-5

The six breakdown values MUST add up exactly to score.

matchedSkills:
Only include skills explicitly present in the candidate information.

missingSkills:
List important technical skills that could strengthen the candidate for software internships.

strengths:
Give 2-5 specific strengths based on the provided information.

weaknesses:
Give 2-5 specific weaknesses based on the provided information.

suggestions:
Give 3-6 practical improvements that would increase the candidate's internship readiness.

Do not use markdown.
Do not include text outside the JSON.
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

  const result = JSON.parse(cleaned);

  // Safety check: ensure score is actually consistent
  const breakdown = result.breakdown;

  if (breakdown) {
    const calculatedScore =
      breakdown.technicalSkills +
      breakdown.projects +
      breakdown.experience +
      breakdown.education +
      breakdown.completeness +
      breakdown.relevance;

    result.score = calculatedScore;
  }

  return result;
};