import { HIPAA_AREA_LABELS, type HipaaArea } from "@/types/domain";

/**
 * What each HIPAA area should focus on. Injected into the per-area prompt so
 * Claude evaluates the right controls (design §4).
 */
export const AREA_GUIDANCE: Record<HipaaArea, string> = {
  ACCESS_CONTROL:
    "Password requirements, multi-factor authentication, role-based access, unique user IDs, automatic logoff, and access revocation procedures.",
  DATA_ENCRYPTION:
    "Encryption of ePHI at rest and in transit, key management, use of TLS, and encryption of backups and portable devices.",
  INCIDENT_RESPONSE:
    "Breach notification procedures, incident detection and reporting, response playbooks, and documented timelines.",
  WORKFORCE_TRAINING:
    "Security awareness training cadence, sanction policy, onboarding/offboarding, and documentation of completed training.",
  PHYSICAL_SECURITY:
    "Facility access controls, workstation security, device and media controls, and disposal procedures.",
  BUSINESS_ASSOCIATE_AGREEMENTS:
    "Presence and completeness of Business Associate Agreements with vendors handling ePHI.",
  PATIENT_CONSENT:
    "Notice of Privacy Practices, patient authorization forms, and documentation of consent for disclosures.",
};

export const SYSTEM_PROMPT = `You are a HIPAA compliance auditor. You analyze a healthcare practice's documentation and assess compliance with the HIPAA Security and Privacy Rules.

You must respond with ONLY valid JSON matching this exact shape (no markdown, no prose):
{
  "score": <integer 0-100>,
  "findings": [
    {
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      "title": "<short title>",
      "detail": "<1-3 sentence explanation>",
      "evidence": [{ "documentName": "<name>", "excerpt": "<short quote or 'not found'>" }]
    }
  ],
  "recommendations": ["<actionable recommendation>", ...]
}

Scoring guidance: 90-100 strong, 70-89 minor gaps, 40-69 significant gaps, 0-39 critical deficiencies. If no documentation addresses the area, score low and flag a CRITICAL or HIGH finding. Never invent evidence; if a control is absent, say so in the excerpt.`;

/** Build the user message for a single HIPAA area. */
export function buildAreaPrompt(area: HipaaArea, documentText: string): string {
  return `HIPAA area under review: ${HIPAA_AREA_LABELS[area]}
Focus on: ${AREA_GUIDANCE[area]}

Practice documentation (may be truncated):
"""
${documentText}
"""

Evaluate ONLY the area above and respond with the required JSON.`;
}
