## Nova Pure Herbal — Remedy Roots AI

Remedy Roots is a multi-agent herbal strategy studio built with Next.js 16. It orchestrates four AI specialists—Herbalist, Educator, Marketer, and Community agents—grounded in a handcrafted herbal knowledge graph that honors African Diaspora, Ayurvedic, and Traditional Chinese Medicine lineages.

### Features

- **Multi-agent orchestration** powered by LangChain and OpenAI for coordinated wellness, storytelling, marketing, and community plans.
- **Herbal knowledge graph** with tradition metadata, energetic profiles, actions, and synergy pathways.
- **Interactive planning workspace** that previews graph insights before triggering the agents, including safety flags and lineage blends.
- **Deployment-ready Next.js app** tailored for Vercel with Tailwind CSS styling.

### Prerequisites

Create a `.env.local` file with an OpenAI-compatible API key:

```bash
OPENAI_API_KEY=sk-...
# optional override, defaults to gpt-4o-mini
OPENAI_MODEL=gpt-4o-mini
```

### Local development

```bash
npm install
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) and complete the intake form to generate orchestrated agent output.

### Production build

```bash
npm run build
npm start
```

### Deploying to Vercel

Use the provided deployment command (token must already be configured):

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-ec1ed09b
```

After deployment, verify the production endpoint:

```bash
curl https://agentic-ec1ed09b.vercel.app
```

### Project structure

- `src/app/page.tsx` – client UI and orchestration controls.
- `src/app/api/agents/route.ts` – LangChain agent coordination endpoint.
- `src/data/herbGraph.ts` – knowledge graph nodes, edges, and helper utilities.

### License

All rights reserved © Nova Pure Herbal.
