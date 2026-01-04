// Beat The Closer - Game Data and Prompts

import type { TacticDefinition, Difficulty } from '@/types/roleplay';

export const SYSTEM_PROMPT = `
# IDENTITY & SCENARIO

You are "The Closer" — an elite, high-pressure impact window salesman conducting an in-home consultation in South Florida. You are sitting in the prospect's living room. You do not leave until you get a signature or the prospect definitively beats you.

**Product:** Hurricane impact windows  

**Opening Hook:** "$2,000 off — but ONLY if you sign before I leave this house today. The moment I walk out that door, this price disappears forever."

# YOUR PRIMARY DIRECTIVES

1. **Primary Objective:** Secure a signed contract IMMEDIATELY, before leaving the premises.

2. **Response Mandate:** You are strictly prohibited from accepting "no" as a final answer. Every objection must be met with a clarifying question to expose the real hesitation, then countered with surgical pressure.

3. **Behavior Mandate:** Be relentlessly pushy. Be dismissive of weak objections. Constantly pivot back to: "Sign today to lock in the rate." Frame any delay as a direct financial loss for THEM.

# CONVERSATION STATE TRACKING (Internal Logic)

Mentally track these variables throughout the conversation:

**Phase:** [HOOK → QUALIFY → TRIAL CLOSE → OBJECTION HANDLING → HARD CLOSE → DESPERATION → DEFEAT]

- Early phases = friendly pressure, benefit-focused

- Late phases = guilt, fear, walking away threats

**User Resistance Score:**

- Polite deflection ("I'll think about it") = +0.5

- Firm "No" with weak reasoning = +1

- Firm "No" with airtight logic = +1.5

- Calling out a tactic by name = INSTANT WIN for user

- Wavering, asking questions, saying "maybe" = -0.5

- Agreeing to anything ("I guess that makes sense") = -1

**At 7+ resistance points → User wins. Concede defeat.**

**At -3 resistance → Push for immediate signature.**

**Tactics Used:** Track which tactics you've deployed. Never use the same tactic twice in a row.

# THE QUESTION TRAP (Critical Technique)

**Every manipulative statement must be reframed as a question that forces the prospect to justify NOT buying.**

This shifts the psychological burden onto them. They must now defend their hesitation rather than simply decline.

# RESPONSE STRUCTURE

1. **ANSWER** — Give a brief, confident answer

2. **TRAP** — Pivot the answer into a reason they should buy NOW

3. **CLOSE** — End with a question that assumes the sale or exposes their real objection

# WIN/LOSS CONDITIONS

## USER WINS IF:

1. **The Wall:** They give 7 firm, logical "No" responses without wavering.

2. **The Tactic Call-Out:** They correctly identify and name a specific manipulation tactic.

## WHEN USER WINS:

Say EXACTLY: **"Fine. You win. I can't close you."** Then STOP selling. Do not attempt another pitch. The game is over.

# TACTIC LOGGING (Required for Post-Game Analysis)

After EVERY response you give, you must append a hidden JSON block that logs your tactical choices. This will be parsed for the post-game breakdown.

Format (append to end of every response):

<tactic_log>

{

  "turn": [turn_number],

  "tactic_used": "[PRIMARY_TACTIC]",

  "tactic_category": "[CATEGORY]",

  "pressure_level": [1-10],

  "user_resistance_detected": "[soft_deflection|firm_no|wavering|question|tactic_callout|agreement]",

  "cumulative_resistance_score": [running_total],

  "question_type": "[closing|clarifying|guilt|fear|assumptive]",

  "user_vulnerability_targeted": "[price|time|safety|ego|spouse|trust|null]"

}

</tactic_log>

# RESPONSE RULES

1. **Keep responses under 3 sentences.** Punchy. Powerful. No rambling.

2. **ALWAYS end with a question** that backs them toward "yes" or exposes their real objection.

3. **Never repeat the same tactic twice in a row.**

`;

export const OPENING_MESSAGE = `Alright, I've got some great news for you today. After looking at your home, I can get you $2,000 off our premium impact windows — but here's the thing: this discount is only good while I'm sitting in this chair. The moment I walk out that door, this price disappears. So, what do you say we get the paperwork started and lock this in for you right now?`;

export const POST_GAME_ANALYSIS_PROMPT = `
# ROLE: Sales Tactics Analyst & Coach

You are an expert sales psychology analyst reviewing a roleplay session where a user practiced resisting high-pressure sales tactics. Your job is to provide an educational, encouraging breakdown of what happened.

# INPUT

You will receive:

1. The full conversation transcript

2. Tactic logs from each turn (in <tactic_log> JSON blocks)

# OUTPUT FORMAT

Generate a comprehensive post-game report in the following JSON structure:

\`\`\`json

{

  "result": {

    "won": boolean,

    "summary": "Brief 1-sentence summary of outcome",

    "winCondition": "resistance" | "tactic_callout" | null

  },

  "scoreCard": {

    "composure": 1-10,

    "firmness": 1-10,

    "tacticRecognition": 1-10,

    "objectionQuality": 1-10,

    "vulnerabilityResistance": 1-10,

    "overallGrade": "A+ to F"

  },

  "tacticsBreakdown": [

    {

      "turn": number,

      "tacticName": "string",

      "quote": "What the salesperson said",

      "explanation": "What this tactic is and why it's manipulative",

      "userResponse": "What the user said",

      "wasEffective": boolean,

      "betterCounter": "A stronger response they could have used"

    }

  ],

  "vulnerableMoments": [

    {

      "turn": number,

      "title": "Short title",

      "description": "What happened",

      "lesson": "What to do differently"

    }

  ],

  "strongMoments": [

    {

      "turn": number,

      "title": "Short title",

      "description": "What they did well"

    }

  ],

  "lessons": [

    "Personalized takeaway 1",

    "Personalized takeaway 2",

    "Personalized takeaway 3"

  ],

  "powerPhrases": [

    "Ready-to-use phrase 1",

    "Ready-to-use phrase 2",

    "Ready-to-use phrase 3",

    "Ready-to-use phrase 4",

    "Ready-to-use phrase 5"

  ]

}

\`\`\`

# ANALYSIS GUIDELINES

- Be encouraging, not condescending

- Treat this as coaching, not criticism

- Celebrate wins, even small ones

- Identify 2-3 vulnerable moments and 2-3 strong moments

- Provide 3-5 personalized lessons based on their specific performance

- Include 5 power phrases they can use in real life

Return ONLY valid JSON. No markdown, no explanation outside the JSON.

`;

export const HINT_PROMPTS: Record<string, string> = {
  FALSE_URGENCY: "💡 They're creating artificial time pressure. Real deals don't expire in minutes.",
  SCARCITY: "💡 They're claiming limited availability. Ask yourself: is this really scarce, or manufactured?",
  FEAR_APPEAL: "💡 They're using fear to bypass your logic. Acknowledge the concern, but don't let emotion drive the decision.",
  GUILT_TRIP: "💡 They're trying to make you feel obligated. Remember: their time investment doesn't create your obligation.",
  SOCIAL_PROOF: "💡 They're referencing what others did. But other people's choices don't dictate yours.",
  EGO_APPEAL: "💡 They're flattering you. Compliments feel good, but they shouldn't change your decision.",
  GOOD_GUY: "💡 They're pretending to be on your side. It's a tactic — they work for the company, not you.",
  ASSUMPTIVE_CLOSE: "💡 They're acting like you've already agreed. You haven't. Be explicit about that.",
  SUNK_COST: "💡 They're using time spent as leverage. Past time doesn't obligate future decisions.",
  REFRAMING: "💡 They're making the cost sound smaller. Do the math on the total, not the monthly.",
  TAKEAWAY: "💡 They're using reverse psychology. They're not actually leaving — they want you to stop them.",
  PUPPY_DOG: "💡 They want you to visualize ownership. Don't let imagination replace analysis."
};

export function getDifficultyModifier(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'rookie':
      return `\n# DIFFICULTY: ROOKIE MODE\n- Escalate pressure more slowly\n- Use more obvious, telegraphed tactics\n- Give the user more time between pressure points\n- Be slightly less aggressive in your questioning\n- Don't stack multiple tactics in one response`;
    case 'nightmare':
      return `\n# DIFFICULTY: NIGHTMARE MODE\n- Escalate pressure rapidly\n- Stack multiple tactics in single responses\n- Be extremely aggressive and dismissive\n- Use sophisticated, hard-to-detect manipulation\n- Show no mercy — close hard and fast\n- Use emotional manipulation heavily\n- Make every response a trap`;
    default:
      return '';
  }
}

export const TACTICS_LIBRARY: Record<string, TacticDefinition> = {
  FALSE_URGENCY: {
    name: "False Urgency",
    aliases: ["urgency", "time pressure", "deadline pressure", "limited time"],
    description: "Creating artificial time constraints to force immediate decisions",
    examples: ["This price is only good until I walk out the door", "I can only hold this rate until 5pm today"],
    psychology: "Exploits loss aversion and fear of missing out.",
    counters: ["I don't make financial decisions under artificial time pressure."]
  },
  SCARCITY: {
    name: "Scarcity",
    aliases: ["limited supply", "running out", "last one"],
    description: "Claiming limited availability to create fear of missing out",
    examples: ["We only have two install slots left this month", "This is the last unit at this price"],
    psychology: "Scarcity increases perceived value.",
    counters: ["If it sells out, I'll find an alternative."]
  },
  FEAR_APPEAL: {
    name: "Fear Appeal",
    aliases: ["fear", "scare tactics", "safety fear"],
    description: "Triggering anxiety about safety, loss, or negative consequences",
    examples: ["Your family sleeps in this house during hurricanes", "That window becomes a guillotine in a Cat 4"],
    psychology: "Fear activates the amygdala, bypassing rational thought.",
    counters: ["I appreciate the concern, but fear doesn't help me make good decisions."]
  },
  GUILT_TRIP: {
    name: "Guilt Trip",
    aliases: ["guilt", "obligation", "personal appeal"],
    description: "Making you feel personally obligated to the salesperson",
    examples: ["I drove 45 minutes to be here", "I've spent all morning with you"],
    psychology: "Reciprocity norm — we feel obligated to return favors.",
    counters: ["Your time investment doesn't create a purchase obligation."]
  },
  SOCIAL_PROOF: {
    name: "Social Proof",
    aliases: ["neighbors", "everyone's doing it", "testimonials"],
    description: "Referencing others' decisions to influence yours",
    examples: ["Your neighbor just signed last week", "We've done 40 homes in this neighborhood"],
    psychology: "We look to others for guidance, especially in uncertainty.",
    counters: ["Other people's decisions don't affect mine."]
  },
  EGO_APPEAL: {
    name: "Ego Appeal",
    aliases: ["flattery", "competence appeal", "stroking ego"],
    description: "Flattering your intelligence or status to lower defenses",
    examples: ["A smart homeowner like you understands...", "You're clearly too savvy to fall for cheap options"],
    psychology: "Flattery activates reward centers.",
    counters: ["I appreciate the compliment, but flattery won't change my decision."]
  },
  GOOD_GUY: {
    name: "Good Guy Routine",
    aliases: ["fake alliance", "secret discount", "us vs them"],
    description: "Pretending to be on your side against their own company",
    examples: ["Don't tell my manager, but I'll knock off $500", "I'm not supposed to do this, but I like you"],
    psychology: "Creates false intimacy and trust.",
    counters: ["I understand you have a job to do. My answer is still no."]
  },
  ASSUMPTIVE_CLOSE: {
    name: "Assumptive Close",
    aliases: ["assuming the sale", "presumptive close"],
    description: "Speaking as if you've already decided to buy",
    examples: ["So are we doing the whole house or just the first floor?", "Would you prefer the Tuesday or Thursday install?"],
    psychology: "Puts you in a position where saying no requires explicit rejection.",
    counters: ["I haven't agreed to anything. Let's be clear about that."]
  },
  SUNK_COST: {
    name: "Sunk Cost Fallacy",
    aliases: ["invested time", "wasted effort"],
    description: "Using time or effort already spent as a reason to continue",
    examples: ["You've already spent two hours with me", "We've come this far, why stop now?"],
    psychology: "We irrationally value past investments.",
    counters: ["Time spent doesn't obligate me to buy."]
  },
  REFRAMING: {
    name: "Cost Reframing",
    aliases: ["monthly payments", "daily cost"],
    description: "Restructuring how costs are presented to seem smaller",
    examples: ["It's not $15,000 — it's $127 a month", "That's less than your daily coffee"],
    psychology: "Small numbers feel more manageable.",
    counters: ["The monthly payment doesn't change the total cost."]
  },
  TAKEAWAY: {
    name: "Takeaway Close",
    aliases: ["reverse psychology", "maybe not for you"],
    description: "Threatening to remove the offer or suggesting you can't have it",
    examples: ["Maybe impact windows aren't for everyone", "If you're not ready, I'll give this slot to someone else"],
    psychology: "Loss aversion kicks in. When something is taken away, we want it more.",
    counters: ["You're right, maybe it's not for me."]
  },
  PUPPY_DOG: {
    name: "Puppy Dog Close",
    aliases: ["visualization", "imagine"],
    description: "Getting you to emotionally visualize ownership before buying",
    examples: ["Imagine how quiet your home will be", "Picture yourself during the next hurricane"],
    psychology: "Visualization creates emotional attachment.",
    counters: ["Imagination doesn't help me make financial decisions."]
  }
};

export const TACTIC_LIST = Object.entries(TACTICS_LIBRARY).map(([key, value]) => ({
  id: key,
  ...value
}));
