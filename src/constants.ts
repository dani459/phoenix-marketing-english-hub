import { GoogleGenAI } from "@google/genai";

export interface Simulation {
  id: number;
  title: string;
  scenario: string;
  vocabulary: string[];
  objective: string;
}

export const SIMULATIONS: Simulation[] = [
  {
    id: 1,
    title: "Career Background",
    scenario: "You meet the student at a marketing networking event and ask about their professional background.",
    vocabulary: ["career path", "transition", "industry", "experience", "responsibilities", "background", "expertise", "opportunity", "challenge", "professional growth"],
    objective: "Explain their career journey and how they returned to marketing."
  },
  {
    id: 2,
    title: "Explaining Your Job",
    scenario: "You are a new coworker who wants to understand what the student does at work.",
    vocabulary: ["campaign", "strategy", "target audience", "engagement", "content", "metrics", "performance", "platform", "promotion", "brand"],
    objective: "Explain job responsibilities and marketing tasks clearly."
  },
  {
    id: 3,
    title: "Professional Networking",
    scenario: "You meet the student at a marketing networking event and start a conversation about professional interests.",
    vocabulary: ["networking", "collaboration", "partnership", "connection", "insight", "perspective", "recommendation", "professional goals", "expertise", "introduction"],
    objective: "Maintain a natural professional conversation."
  },
  {
    id: 4,
    title: "Explaining a Marketing Process",
    scenario: "You ask the student to explain how marketing campaigns are created.",
    vocabulary: ["process", "planning", "research", "analysis", "implementation", "execution", "monitoring", "adjustment", "improvement", "results"],
    objective: "Explain the campaign creation process step by step."
  },
  {
    id: 5,
    title: "Marketing Trends Discussion",
    scenario: "You are discussing current marketing trends with the student.",
    vocabulary: ["trend", "innovation", "digital marketing", "consumer behavior", "competition", "influence", "branding", "positioning", "market", "automation"],
    objective: "Share opinions about marketing trends."
  },
  {
    id: 6,
    title: "Professional Interview",
    scenario: "You are a recruiter interviewing the student about their professional abilities.",
    vocabulary: ["strengths", "skills", "leadership", "teamwork", "communication", "adaptability", "creativity", "problem solving", "initiative", "experience"],
    objective: "Explain strengths and professional abilities."
  },
  {
    id: 7,
    title: "Marketing Team Meeting",
    scenario: "You are the marketing manager asking for a project update during a team meeting.",
    vocabulary: ["agenda", "update", "progress", "deadline", "objective", "proposal", "discussion", "feedback", "priority", "decision"],
    objective: "Provide a project update and discuss priorities."
  },
  {
    id: 8,
    title: "Campaign Idea Presentation",
    scenario: "You are a manager listening to a marketing campaign proposal.",
    vocabulary: ["presentation", "concept", "objective", "strategy", "results", "audience", "impact", "value", "message", "conclusion"],
    objective: "Present a marketing idea clearly."
  },
  {
    id: 9,
    title: "Problem Solving",
    scenario: "A marketing campaign is not performing well and you ask the student for solutions.",
    vocabulary: ["issue", "challenge", "solution", "strategy", "improvement", "alternative", "adjustment", "outcome", "efficiency", "risk"],
    objective: "Identify the problem and propose solutions."
  },
  {
    id: 10,
    title: "International Team Meeting",
    scenario: "You are a colleague from the US office meeting the student for the first time.",
    vocabulary: ["global market", "international clients", "communication", "cultural differences", "collaboration", "remote teams", "coordination", "expansion", "partnership", "negotiation"],
    objective: "Introduce themselves and explain their role."
  },
  {
    id: 11,
    title: "Business Travel",
    scenario: "The student is visiting the US office and discussing current projects with colleagues.",
    vocabulary: ["headquarters", "branch", "meeting", "conference", "presentation", "schedule", "project", "report", "discussion", "networking"],
    objective: "Discuss projects and collaboration opportunities."
  },
  {
    id: 12,
    title: "Final Professional Simulation",
    scenario: "You are part of an international marketing strategy meeting.",
    vocabulary: ["leadership", "influence", "strategy", "growth", "innovation", "performance", "development", "opportunity", "expansion", "success"],
    objective: "Participate in a strategy discussion and answer questions."
  }
];
