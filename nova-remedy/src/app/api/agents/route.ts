import { NextResponse } from "next/server";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  buildHerbContext,
  graphConnectionsFor,
  matchHerbs,
  type Tradition,
} from "@/data/herbGraph";

const traditions = [
  "African Diaspora",
  "Ayurvedic",
  "Traditional Chinese Medicine",
] as const satisfies Tradition[];

const requestSchema = z.object({
  userProfile: z.string().min(1),
  symptoms: z.string().min(1),
  goals: z.string().min(1),
  restrictions: z.string().optional(),
  traditions: z
    .array(z.enum(traditions))
    .default([])
    .transform((value) => (value.length ? value : Array.from(traditions))),
  brandVoice: z.string().min(1),
  campaignGoal: z.string().min(1),
  targetPlatforms: z
    .array(z.enum(["Instagram", "Facebook", "TikTok"]))
    .min(1),
  keyDates: z.string().optional(),
  communityTheme: z.string().min(1),
  communityAsk: z.string().min(1),
  highlightCount: z.coerce.number().int().min(1).max(6).default(3),
});

const toText = (output: unknown): string => {
  if (!output) return "";
  if (typeof output === "string") return output;

  if (
    typeof output === "object" &&
    "content" in output &&
    output.content != null
  ) {
    const content = (output as { content: unknown }).content;
    if (typeof content === "string") {
      return content;
    }
    if (Array.isArray(content)) {
      return content
        .map((part) => {
          if (typeof part === "string") return part;
          if (typeof part === "object" && part && "text" in part) {
            return (part as { text?: string }).text ?? "";
          }
          return "";
        })
        .join("\n");
    }
  }

  return JSON.stringify(output);
};

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY is not configured. Please add it to your environment.",
        },
        { status: 500 },
      );
    }

    const payload = await request.json();
    const parsed = requestSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const {
      userProfile,
      symptoms,
      goals,
      restrictions,
      traditions: selectedTraditions,
      brandVoice,
      campaignGoal,
      targetPlatforms,
      keyDates,
      communityTheme,
      communityAsk,
      highlightCount,
    } = parsed.data;

    const herbMatches = matchHerbs({
      symptoms,
      goals,
      restrictions,
      traditions: selectedTraditions as Tradition[],
    });

    const herbContext = buildHerbContext(herbMatches);
    const knowledgeEdges = graphConnectionsFor(herbMatches);

    const model = new ChatOpenAI({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.6,
    });

    const herbalistPrompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are the Herbalist Agent within the Nova Pure Herbal "Remedy Roots" collective.
You craft personalized wellness formulations rooted in African, Ayurvedic, and Traditional Chinese Medicine (TCM) lineages.
Strictly use the provided herb knowledge graph. Respect all safety considerations and contraindications.
Provide formulations in clear bullet form. Each formulation must include: intention, core herbs with energetic rationale, preparation (infusion/decoction/powder), dosage guidance, rituals, and safety checks.`,
      ],
      [
        "human",
        `Client profile:
{userProfile}

Symptom focus: {symptoms}
Wellness goals: {goals}
Contraindications & restrictions: {restrictions}

Knowledge graph context:
{herbContext}`,
      ],
    ]);

    const educatorPrompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are the Educator Agent for Nova Pure Herbal "Remedy Roots".
You weave cultural narratives honoring African, Ayurvedic, and TCM herbal traditions.
Deliver an inspirational micro-lesson that can be read in under two minutes.
Blend history, ancestor wisdom, and modern relevance. Cite traditions by name.`,
      ],
      [
        "human",
        `Client interests:
{userProfile}

Focus herbs to highlight:
{herbContext}

Desired outcomes: {goals}

Create:
1. Opening hook anchored in #MyRemedyRoots
2. Narrative arc connecting featured herbs to traditions
3. Takeaway practices or rituals for the audience`,
      ],
    ]);

    const marketerPrompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are the Marketer Agent for Nova Pure Herbal "Remedy Roots".
Produce a cross-platform social content kit formatted for Instagram, Facebook, and TikTok.
Respect the brand voice and keep copy inclusive, empowering, and rooted in herbal integrity.
Always include the hashtag #MyRemedyRoots and herb-specific emoji flourishes.`,
      ],
      [
        "human",
        `Brand voice guide: {brandVoice}
Campaign goal: {campaignGoal}
Launch window or key dates: {keyDates}
Priority platforms: {targetPlatforms}

Herbal focus derived from the knowledge graph:
{herbContext}

Deliver:
- 3 Instagram caption concepts with carousel frame ideas & CTA.
- 2 Facebook post outlines emphasizing community dialogue.
- 3 TikTok script beats + camera directions + AI image prompt for B-roll.
- Weekly micro-content calendar for the next {highlightCount} weeks including themes.`,
      ],
    ]);

    const communityPrompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are the Community Agent safeguarding the #MyRemedyRoots movement.
Design engagement loops, spotlight frameworks, and feedback touchpoints.
Always center community healing, storytelling, and reciprocity.`,
      ],
      [
        "human",
        `Community theme: {communityTheme}
Call to action: {communityAsk}
Spotlight count per month: {highlightCount}

Herbal stories to celebrate:
{herbContext}

Create:
1. Story collection prompts honoring multiple voices.
2. Spotlight cadence plan (live events, reels, newsletters).
3. Moderation + safety guidelines.
4. Metrics dashboard suggestion (qualitative + quantitative).`,
      ],
    ]);

    const args = {
      userProfile,
      symptoms,
      goals,
      restrictions: restrictions ?? "None reported",
      herbContext,
      brandVoice,
      campaignGoal,
      keyDates: keyDates?.trim().length
        ? keyDates
        : "No specific launch dates provided",
      targetPlatforms: targetPlatforms.join(", "),
      communityTheme,
      communityAsk,
      highlightCount,
    };

    const [herbalist, educator, marketer, community] = await Promise.all([
      herbalistPrompt.pipe(model).invoke(args),
      educatorPrompt.pipe(model).invoke(args),
      marketerPrompt.pipe(model).invoke(args),
      communityPrompt.pipe(model).invoke(args),
    ]);

    return NextResponse.json({
      herbalist: toText(herbalist),
      educator: toText(educator),
      marketer: toText(marketer),
      community: toText(community),
      herbMatches: herbMatches.map((match) => ({
        id: match.herb.id,
        name: match.herb.name,
        latinName: match.herb.latinName,
        score: match.score,
        traditions: match.herb.traditions,
        actions: match.herb.actions,
        uses: match.herb.uses,
        cautions: match.herb.cautions,
        pairings: match.herb.pairings,
        matchedKeywords: match.matchedKeywords,
        contraindicated: match.contraindicated,
      })),
      knowledgeEdges,
    });
  } catch (error) {
    console.error("Agent orchestration failed", error);
    return NextResponse.json(
      { error: "Failed to run multi-agent ecosystem" },
      { status: 500 },
    );
  }
}
