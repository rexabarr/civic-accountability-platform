import { Anthropic } from '@anthropic-ai/sdk';
import { env } from '../utils/env.js';
import { SCREENING_POLICY_PROMPT, REJECTION_GUIDANCE } from './screeningPolicy.js';

const anthropic = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;

export interface EnhancedDescription {
  original: string;
  improved: string;
  summary: string;
}

export async function enhanceDescription(description: string): Promise<EnhancedDescription> {
  if (anthropic) {
    return enhanceWithClaude(description);
  }
  // No Anthropic key — use LanguageTool (free, no key needed) as fallback
  return enhanceWithLanguageTool(description);
}

// ---------------------------------------------------------------------------
// Claude (Anthropic) enhancement
// ---------------------------------------------------------------------------
async function enhanceWithClaude(description: string): Promise<EnhancedDescription> {
  if (description.length < 10) {
    return { original: description, improved: description, summary: 'No changes needed (too short).' };
  }

  try {
    const message = await anthropic!.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Please enhance the following complaint description by:
1. Fixing any spelling or grammar errors
2. Improving clarity and readability
3. Ensuring a professional, neutral tone
4. Keeping the original meaning intact

Original description:
"""
${description}
"""

Respond with ONLY valid JSON (no markdown, no extra text) in this exact format:
{
  "improved": "the enhanced description here",
  "summary": "a brief summary of changes made (e.g., 'Fixed 2 typos, improved sentence structure')"
}`,
        },
      ],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';
    // Strip markdown code fences if Claude wraps its JSON response in them
    const responseText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    const parsed = JSON.parse(responseText);
    return {
      original: description,
      improved: parsed.improved || description,
      summary: parsed.summary || 'Minor improvements made.',
    };
  } catch {
    // Claude call or JSON parse failed — fall back to LanguageTool
    return enhanceWithLanguageTool(description);
  }
}

// ---------------------------------------------------------------------------
// LanguageTool (free, no API key) enhancement fallback
// ---------------------------------------------------------------------------
interface LTMatch {
  message: string;
  replacements: Array<{ value: string }>;
  offset: number;
  length: number;
  rule: { issueType: string; id: string };
}

async function enhanceWithLanguageTool(description: string): Promise<EnhancedDescription> {
  if (description.length < 10) {
    return { original: description, improved: description, summary: 'No changes needed (too short).' };
  }

  try {
    const params = new URLSearchParams({ text: description, language: 'en-US' });
    const response = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      return basicEnhance(description);
    }

    const data = (await response.json()) as { matches: LTMatch[] };
    const matches: LTMatch[] = data.matches ?? [];

    // Apply corrections from right to left to preserve offsets
    let improved = description;
    const appliedFixes: string[] = [];

    const sorted = [...matches]
      .filter((m) => m.replacements.length > 0)
      .sort((a, b) => b.offset - a.offset);

    for (const match of sorted) {
      const replacement = match.replacements[0].value;
      improved =
        improved.slice(0, match.offset) +
        replacement +
        improved.slice(match.offset + match.length);
      appliedFixes.push(match.message);
    }

    // Apply basic formatting improvements on top
    improved = applyBasicFormatting(improved);

    const totalFixes = sorted.length + (improved !== description ? 1 : 0);

    if (improved === description) {
      return { original: description, improved: description, summary: 'No issues found — description looks good!' };
    }

    const summary =
      appliedFixes.length > 0
        ? `Fixed ${appliedFixes.length} issue${appliedFixes.length > 1 ? 's' : ''}: ${appliedFixes.slice(0, 2).join('; ')}${appliedFixes.length > 2 ? ` (+${appliedFixes.length - 2} more)` : ''}`
        : `Improved formatting and capitalization.`;

    return { original: description, improved, summary };
  } catch {
    // Network failure or parse error — apply basic formatting only
    return basicEnhance(description);
  }
}

function applyBasicFormatting(text: string): string {
  // Capitalize the first character
  let result = text.charAt(0).toUpperCase() + text.slice(1);
  // Add period at end if the text doesn't end with punctuation
  if (result.length > 0 && !/[.!?]$/.test(result.trim())) {
    result = result.trimEnd() + '.';
  }
  return result;
}

function basicEnhance(description: string): EnhancedDescription {
  const improved = applyBasicFormatting(description);
  if (improved === description) {
    return { original: description, improved: description, summary: 'No issues found.' };
  }
  return { original: description, improved, summary: 'Improved capitalization and punctuation.' };
}

// ---------------------------------------------------------------------------
// Urgency scoring — assigns a 0–100 score at complaint submission
// ---------------------------------------------------------------------------
export interface UrgencyResult {
  score: number;
  reasoning: string;
}

export async function scoreUrgency(
  title: string,
  description: string,
  complaintTypeName: string,
): Promise<UrgencyResult> {
  if (anthropic) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const message = await anthropic.messages.create(
        {
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 128,
          messages: [
            {
              role: 'user',
              content: `Score the urgency of this civic complaint from 0 (trivial) to 100 (life-threatening emergency).
Consider: safety risk, number of people affected, how long it may have been ignored, and type of issue.

Complaint type: ${complaintTypeName}
Title: ${title}
Description: ${description}

Respond ONLY with valid JSON (no markdown):
{"score": <integer 0-100>, "reasoning": "<one sentence>"}`,
            },
          ],
        },
        { signal: controller.signal },
      );
      clearTimeout(timeout);

      const raw = message.content[0].type === 'text' ? message.content[0].text : '';
      const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
      const parsed = JSON.parse(text);
      return {
        score: Math.max(0, Math.min(100, Number(parsed.score) || 50)),
        reasoning: parsed.reasoning ?? '',
      };
    } catch {
      // Fall through to heuristic
    }
  }
  return heuristicUrgencyScore(title, description, complaintTypeName);
}

function heuristicUrgencyScore(title: string, description: string, typeName: string): UrgencyResult {
  const text = `${title} ${description} ${typeName}`.toLowerCase();
  let score = 30; // default baseline

  // High-urgency keywords
  if (/\b(fire|flood|collapse|structural|explosion|gas leak|exposed wire|electr|sinkhole|sewage overflow)\b/.test(text)) score += 50;
  else if (/\b(dangerous|hazard|unsafe|broken|blocked|fallen|leak|overflow)\b/.test(text)) score += 25;
  else if (/\b(pothole|graffiti|noise|dumping|abandoned|vehicle)\b/.test(text)) score += 10;

  // Scale modifiers
  if (/\b(children|school|playground|hospital|elderly)\b/.test(text)) score += 15;
  if (/\b(weeks|months|years|long time|repeatedly)\b/.test(text)) score += 10;
  if (/\b(many|multiple|entire block|neighborhood|everyone)\b/.test(text)) score += 10;

  return { score: Math.min(100, score), reasoning: 'Heuristic scoring based on keywords' };
}

// ---------------------------------------------------------------------------
// Complaint screening — gates submissions against the platform policy
// ---------------------------------------------------------------------------
export interface ScreeningResult {
  allowed: boolean;
  category: string;
  reason?: string;
  guidance?: string;
  confidence: number;
  reasoning?: string;
}

// Obvious keyword blocklist — runs before Claude to catch clear violations fast
const KEYWORD_BLOCKS: Array<{ pattern: RegExp; category: string; reason: string }> = [
  {
    pattern: /\b(my (lawyer|attorney)|filed a (lawsuit|claim|suit)|legal action|sue the city|pending litigation|court case|my case number is)\b/i,
    category: 'active_legal',
    reason: 'This appears to reference an active legal matter, which is outside the scope of this platform.',
  },
  {
    pattern: /\b(police (brutality|misconduct|excessive force)|officer (assaulted|choked|beat|harassed) me|false arrest|wrongful (arrest|detention)|internal affairs)\b/i,
    category: 'police_misconduct',
    reason: 'Police misconduct complaints are handled by the Philadelphia Civilian Review Board, not this platform.',
  },
  {
    pattern: /\b(call 911|active (fire|emergency)|someone is (dying|bleeding|unconscious)|medical emergency|right now emergency)\b/i,
    category: 'emergency',
    reason: 'This appears to describe an active emergency. Please call 911 immediately.',
  },
];

export async function screenComplaint(
  title: string,
  description: string,
  complaintTypeName: string,
): Promise<ScreeningResult> {
  const combined = `${title} ${description}`.trim();

  // Spam check: too short to be a real complaint
  if (combined.length < 15) {
    return {
      allowed: false,
      category: 'spam_gibberish',
      reason: 'Your submission appears to be incomplete. Please provide a meaningful title and description.',
      guidance: 'Describe the issue in at least a sentence so city officials can understand and act on it.',
      confidence: 0.95,
    };
  }

  // Fast keyword checks — no AI needed
  for (const { pattern, category, reason } of KEYWORD_BLOCKS) {
    if (pattern.test(combined)) {
      return {
        allowed: false,
        category,
        reason,
        guidance: REJECTION_GUIDANCE[category],
        confidence: 0.92,
      };
    }
  }

  // If no Claude key, pass everything through (admins can review edge cases manually)
  if (!anthropic) {
    return { allowed: true, category: 'in_scope', confidence: 0.5 };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s max — never delay submission

    const message = await anthropic.messages.create(
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system: SCREENING_POLICY_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Complaint type: ${complaintTypeName}\nTitle: ${title}\nDescription: ${description}`,
          },
        ],
      },
      { signal: controller.signal },
    );
    clearTimeout(timeout);

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    const parsed = JSON.parse(text) as {
      allowed: boolean;
      category: string;
      reason?: string;
      guidance?: string;
      confidence: number;
    };

    // Lenience rule: low confidence blocks are overridden to allow
    if (!parsed.allowed && parsed.confidence < 0.7) {
      return { allowed: true, category: 'in_scope', confidence: parsed.confidence, reasoning: 'Low confidence block overridden' };
    }

    return {
      allowed: parsed.allowed,
      category: parsed.category ?? 'in_scope',
      reason: parsed.reason,
      guidance: parsed.guidance ?? REJECTION_GUIDANCE[parsed.category],
      confidence: parsed.confidence ?? 0.8,
    };
  } catch {
    // Timeout, parse failure, network error → always allow (never block by failing)
    return { allowed: true, category: 'in_scope', confidence: 0.5, reasoning: 'AI screening unavailable' };
  }
}
