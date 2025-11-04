"use client";

import { useMemo, useState } from "react";
import {
  graphConnectionsFor,
  matchHerbs,
  type HerbEdge,
  type HerbMatch,
  type Tradition,
} from "@/data/herbGraph";

type AgentResponses = {
  herbalist: string;
  educator: string;
  marketer: string;
  community: string;
  herbMatches: {
    id: string;
    name: string;
    latinName: string;
    score: number;
    traditions: Tradition[];
    actions: string[];
    uses: string[];
    cautions: string[];
    pairings: string[];
    matchedKeywords: string[];
    contraindicated: boolean;
  }[];
  knowledgeEdges: HerbEdge[];
};

const allTraditions: Tradition[] = [
  "African Diaspora",
  "Ayurvedic",
  "Traditional Chinese Medicine",
];

const socialPlatforms = ["Instagram", "Facebook", "TikTok"] as const;

const initialFormState = {
  userProfile:
    "31-year-old creative entrepreneur balancing a wellness studio launch with caretaking for family elders.",
  symptoms:
    "Chronic fatigue, brain fog, and high stress with evening restlessness.",
  goals:
    "Restore vibrant energy, sharpen focus for content creation, and support immune resilience during travel.",
  restrictions: "Allergic to nightshades; sensitive to very warming herbs.",
  traditions: [...allTraditions] as Tradition[],
  brandVoice:
    "Rooted, community-forward, high-touch concierge tone with remixable storytelling and warmth.",
  campaignGoal:
    "Ignite a 6-week storytelling wave that positions Nova Pure Herbal as the go-to ritual companion for caretakers and creators.",
  targetPlatforms: ["Instagram", "Facebook", "TikTok"],
  keyDates: "Spring Equinox activation; weekly Tea + Talk on Sundays.",
  communityTheme: "Caretaker resilience and ancestral ritual revival.",
  communityAsk:
    "Share a wellness ritual that grounds you using #MyRemedyRoots and tag a lineage bearer who taught it to you.",
  highlightCount: 4,
};

type FormState = typeof initialFormState;

function HerbMatchCard({ match }: { match: HerbMatch }) {
  return (
    <div className="rounded-2xl border border-white/40 bg-white/80 p-4 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-lg font-semibold text-slate-900">
            {match.herb.name}
          </h4>
          <p className="text-sm text-slate-500 italic">
            {match.herb.latinName}
          </p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
          Score {match.score}
        </span>
      </div>
      <p className="mt-3 text-sm font-medium text-slate-600">
        Traditions: {match.herb.traditions.join(", ")}
      </p>
      <p className="mt-2 text-sm text-slate-600">
        Key actions: {match.herb.actions.join(", ")}
      </p>
      <p className="mt-2 text-sm text-slate-600">
        Highlighted uses: {match.herb.uses.join(", ")}
      </p>
      <p className="mt-2 text-sm text-slate-600">
        Star pairings: {match.herb.pairings.join(", ")}
      </p>
      {match.matchedKeywords.length > 0 ? (
        <p className="mt-2 text-sm text-emerald-700">
          Matched client keywords:{" "}
          <span className="font-medium">
            {match.matchedKeywords.join(", ")}
          </span>
        </p>
      ) : (
        <p className="mt-2 text-sm text-slate-500">
          No direct keyword match — consider creative integration.
        </p>
      )}
      {match.contraindicated ? (
        <p className="mt-3 text-sm font-semibold text-red-600">
          Safety flag: review contraindications before recommending.
        </p>
      ) : null}
    </div>
  );
}

function AgentPanel({
  title,
  body,
  accent,
}: {
  title: string;
  body?: string;
  accent: string;
}) {
  return (
    <section
      className={`rounded-3xl border border-white/40 bg-white/90 p-6 shadow-lg backdrop-blur ${accent}`}
    >
      <h3 className="text-2xl font-semibold text-slate-900">{title}</h3>
      <pre className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
        {body ?? "Awaiting orchestration..."}
      </pre>
    </section>
  );
}

function EdgeVisualization({ edges }: { edges: HerbEdge[] }) {
  if (!edges.length) {
    return (
      <p className="text-sm text-slate-500">
        Add more detail to reveal relationship pathways in the herbal knowledge
        graph.
      </p>
    );
  }

  return (
    <ul className="space-y-3 text-sm">
      {edges.map((edge) => (
        <li
          key={`${edge.from}-${edge.to}`}
          className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-emerald-900"
        >
          <span className="font-semibold capitalize">{edge.from}</span>{" "}
          <span className="text-xs text-emerald-600">⇄</span>{" "}
          <span className="font-semibold capitalize">{edge.to}</span>
          <p className="mt-1 text-xs text-emerald-700">{edge.label}</p>
        </li>
      ))}
    </ul>
  );
}

export default function Page() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responses, setResponses] = useState<AgentResponses | null>(null);

  const localMatches = useMemo(
    () =>
      matchHerbs({
        symptoms: form.symptoms,
        goals: form.goals,
        restrictions: form.restrictions,
        traditions: form.traditions,
      }),
    [form.symptoms, form.goals, form.restrictions, form.traditions],
  );

  const localEdges = useMemo(
    () => graphConnectionsFor(localMatches),
    [localMatches],
  );

  function toggleTradition(tradition: Tradition) {
    setForm((prev) => {
      const selected = new Set(prev.traditions);
      if (selected.has(tradition)) {
        selected.delete(tradition);
      } else {
        selected.add(tradition);
      }
      return { ...prev, traditions: Array.from(selected) as Tradition[] };
    });
  }

  function togglePlatform(platform: (typeof socialPlatforms)[number]) {
    setForm((prev) => {
      const exists = prev.targetPlatforms.includes(platform);
      const targetPlatforms = exists
        ? prev.targetPlatforms.filter((entry) => entry !== platform)
        : [...prev.targetPlatforms, platform];
      return { ...prev, targetPlatforms };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          highlightCount: form.highlightCount,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          payload?.error ?? `Request failed with status ${response.status}`,
        );
      }

      const data = (await response.json()) as AgentResponses;
      setResponses(data);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Unexpected error while orchestrating agents.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-100 via-lime-50 to-amber-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-24 pt-16 lg:px-12">
        <header className="space-y-4 rounded-3xl border border-white/40 bg-white/90 p-10 shadow-xl backdrop-blur-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-emerald-600">
            Nova Pure Herbal Presents
          </p>
          <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
            Remedy Roots — Multi-Agent Ritual Architect
          </h1>
          <p className="max-w-3xl text-base text-slate-600 sm:text-lg">
            Orchestrate AI herbalist, educator, marketer, and community agents
            to craft culturally rooted wellness pathways, storytelling kits, and
            engagement loops powered by the Remedy Roots knowledge graph.
          </p>
        </header>

        <main className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <form
            onSubmit={handleSubmit}
            className="space-y-8 rounded-3xl border border-white/40 bg-white/95 p-8 shadow-lg backdrop-blur"
          >
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Client & Wellness Inputs
                </h2>
                <p className="text-sm text-slate-500">
                  Feed the Herbalist and Educator agents with lived context,
                  goals, and safety notes.
                </p>
              </div>
              <div className="grid gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Client profile & roles
                  </span>
                  <textarea
                    className="w-full rounded-xl border border-slate-200 bg-white/70 p-3 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    rows={3}
                    value={form.userProfile}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        userProfile: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Symptoms & energetic patterns
                  </span>
                  <textarea
                    className="w-full rounded-xl border border-slate-200 bg-white/70 p-3 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    rows={3}
                    value={form.symptoms}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        symptoms: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Priority wellness goals
                  </span>
                  <textarea
                    className="w-full rounded-xl border border-slate-200 bg-white/70 p-3 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    rows={3}
                    value={form.goals}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        goals: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Allergies, medications, or cultural boundaries
                  </span>
                  <textarea
                    className="w-full rounded-xl border border-slate-200 bg-white/70 p-3 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    rows={2}
                    value={form.restrictions}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        restrictions: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Tradition Blend
                </h2>
                <p className="text-sm text-slate-500">
                  Toggle the lineages you want emphasized across agents.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {allTraditions.map((tradition) => {
                  const active = form.traditions.includes(tradition);
                  return (
                    <button
                      key={tradition}
                      type="button"
                      onClick={() => toggleTradition(tradition)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                          : "border border-emerald-200 bg-white/60 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {tradition}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Marketing Parameters
                </h2>
                <p className="text-sm text-slate-500">
                  Feed the Marketer agent with voice, goals, and campaign
                  structure.
                </p>
              </div>
              <div className="grid gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Brand voice anchor
                  </span>
                  <textarea
                    className="w-full rounded-xl border border-slate-200 bg-white/70 p-3 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    rows={2}
                    value={form.brandVoice}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        brandVoice: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Campaign goal
                  </span>
                  <textarea
                    className="w-full rounded-xl border border-slate-200 bg-white/70 p-3 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    rows={2}
                    value={form.campaignGoal}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        campaignGoal: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Launch moments & key dates
                  </span>
                  <textarea
                    className="w-full rounded-xl border border-slate-200 bg-white/70 p-3 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    rows={2}
                    value={form.keyDates}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        keyDates: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Campaign platforms
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {socialPlatforms.map((platform) => {
                      const active = form.targetPlatforms.includes(platform);
                      return (
                        <button
                          key={platform}
                          type="button"
                          onClick={() => togglePlatform(platform)}
                          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                            active
                              ? "bg-amber-500 text-white shadow-lg shadow-amber-200"
                              : "border border-amber-200 bg-white/60 text-amber-700 hover:bg-amber-100"
                          }`}
                        >
                          {platform}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Community Activation
                </h2>
                <p className="text-sm text-slate-500">
                  Inform the Community agent to curate highlights and feedback
                  loops.
                </p>
              </div>
              <div className="grid gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Community theme
                  </span>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white/70 p-3 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    value={form.communityTheme}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        communityTheme: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Community ask or ritual invitation
                  </span>
                  <textarea
                    className="w-full rounded-xl border border-slate-200 bg-white/70 p-3 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    rows={2}
                    value={form.communityAsk}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        communityAsk: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    Spotlight cadence (stories per month): {form.highlightCount}
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={6}
                    value={form.highlightCount}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        highlightCount: Number(event.target.value),
                      }))
                    }
                    className="accent-emerald-500"
                  />
                </label>
              </div>
            </section>

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
            >
              {loading ? "Orchestrating agents..." : "Run Multi-Agent Strategy"}
            </button>
          </form>

          <div className="space-y-8">
            <section className="space-y-6 rounded-3xl border border-white/40 bg-white/90 p-8 shadow-lg backdrop-blur">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Knowledge Graph Preview
                </h2>
                <p className="text-sm text-slate-500">
                  Live preview from the Remedy Roots herbal knowledge graph
                  before agent orchestration.
                </p>
              </div>
              <div className="space-y-4">
                {localMatches.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-200 bg-white/50 p-4 text-sm text-slate-500">
                    Enter more detail to unlock herbal insight pathways.
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {localMatches.map((match) => (
                      <HerbMatchCard key={match.herb.id} match={match} />
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                  Synergy pathways
                </h3>
                <EdgeVisualization edges={localEdges} />
              </div>
            </section>

            <section className="space-y-6 rounded-3xl border border-white/40 bg-white/95 p-8 shadow-lg backdrop-blur">
              <h2 className="text-xl font-semibold text-slate-900">
                Agent Output
              </h2>
              <div className="grid gap-6">
                <AgentPanel
                  title="Herbalist Agent"
                  body={responses?.herbalist}
                  accent="shadow-emerald-100"
                />
                <AgentPanel
                  title="Educator Agent"
                  body={responses?.educator}
                  accent="shadow-lime-100"
                />
                <AgentPanel
                  title="Marketer Agent"
                  body={responses?.marketer}
                  accent="shadow-amber-100"
                />
                <AgentPanel
                  title="Community Agent"
                  body={responses?.community}
                  accent="shadow-rose-100"
                />
              </div>

              {responses?.herbMatches?.length ? (
                <div className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-6">
                  <h3 className="text-lg font-semibold text-emerald-900">
                    Verified Herb Matches from Agents
                  </h3>
                  <ul className="space-y-3 text-sm text-emerald-800">
                    {responses.herbMatches.map((match) => (
                      <li key={match.id} className="leading-relaxed">
                        <span className="font-semibold">{match.name}</span>{" "}
                        <span className="text-xs text-emerald-600">
                          ({match.latinName})
                        </span>{" "}
                        · traditions: {match.traditions.join(", ")} · actions:{" "}
                        {match.actions.join(", ")} · cautions:{" "}
                        {match.cautions.length
                          ? match.cautions.join("; ")
                          : "none noted"}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {responses?.knowledgeEdges?.length ? (
                <div className="space-y-3 rounded-2xl border border-amber-100 bg-amber-50/60 p-6">
                  <h3 className="text-lg font-semibold text-amber-900">
                    Agent Highlighted Synergies
                  </h3>
                  <EdgeVisualization edges={responses.knowledgeEdges} />
                </div>
              ) : null}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
