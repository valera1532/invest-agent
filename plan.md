# AI Trading Plan

## Current Baseline

Already implemented:

- investor profile is stored in DB
- AI execution mode is stored in DB as `manual_approval | full_auto`
- settings UI works against backend state
- OpenAI integration works on backend through `OPENAI_PROXY_URL`
- AI preview page exists at `/app/ai`
- AI preview jobs exist and report progress stages
- AI decisions are persisted in DB
- decision history is available
- `approve`, `reject`, `execute` endpoints already exist
- `TradeExecution` records are already stored
- daily AI review runner already exists

Current AI context already includes:

- investor profile from DB
- execution mode
- accounts
- cash
- positions
- recent AI history
- multi-asset universe

Current multi-asset universe includes:

- shares
- bonds
- ETFs
- currencies

Not implemented as a dedicated source yet:

- metals
- external research layer
- hard execution validator
- audit-grade decision trace

## 1. Execution Hardening

Status: next core priority

What is already present:

- AI decisions are saved before execution
- manual approval flow exists
- execution flow exists for `buy` and `sell`
- `TradeExecution` rows are created and updated with broker response or failure
- `full_auto` daily run is already wired

What still needs to be done:

- separate "approved" from immediate execution in manual mode if product logic requires it
- prevent repeated execution of the same decision
- add idempotency and overlap protection for scheduled runs
- make execution flow safer around partial failures
- make execution result reporting more explicit in API and UI

Expected result:

- execution becomes predictable, restart-safe and easier to trust in production

## 2. Risk Guardrails And Audit

Status: required before trusting automation

Goal:
Add hard backend validation that is independent from the model.

What needs to be done:

- validate available cash before `buy`
- validate position size before `sell`
- validate lot sizing and instrument tradability
- validate account compatibility and allowed instruments
- validate concentration rules and basic safety limits
- block execution when validator fails
- store validator result together with decision and execution
- store broker response and failure reason in a more audit-friendly shape

Audit trail to keep:

- AI runtime context snapshot
- AI output snapshot
- validator result
- broker response
- final execution status
- failure reason

Expected result:

- AI is only an idea generator
- validator becomes the final execution gate

## 3. UI And Workflow Completion

Status: partial

Already done:

- investor settings UI
- AI preview page
- decision history base

Still needed:

- clearer decision history UI with execution outcomes
- approval / reject UX with notes
- explicit execution result UI
- manual execute / retry controls if needed
- scheduler visibility in UI or admin/debug endpoint
- protection against overlapping parallel runs

Expected result:

- the full decision lifecycle becomes visible and debuggable from the UI

## 4. External Research Layer

Status: next strategic extension after validator work starts

Goal:
Add normalized external investment research as a secondary signal for AI decisions.

Important rules:

- do not inject raw HTML, full articles or random long text into the prompt
- normalize every source into a compact common schema
- use research as an additional signal, not as execution authority

Source priority:

- first priority: institutional research from brokers and investment houses
- second priority: public market media with named analysts
- third priority: community sources such as Smart-Lab, only as a weak secondary signal

Preferred source types:

- T-Invest analytics
- BCS analytics
- Sber investment analytics
- Alfa investment analytics
- other public broker research pages with named analysts and clear publication dates

Community-source limitation:

- anonymous or weakly attributable posts must never carry the same weight as broker analytics
- Smart-Lab should not be treated as expert authority by default
- Smart-Lab items can be used only as supplementary sentiment or idea-discovery input

### Target Data Model

1. `ResearchItem`

- `source`
- `sourceType`
- `ticker`
- `companyName`
- `author`
- `direction`
- `sentiment`
- `thesis`
- `url`
- `publishedAt`
- `engagementJson`
- `tagsJson`
- `rawContentHash`

2. `ResearchSourceState`

- `source`
- `lastFetchedAt`
- `lastCursor`
- `status`
- `lastError`

3. Optional later model: `ResearchTickerSummary`

- `ticker`
- `sentimentConsensus`
- `sourcesCount`
- `positiveCount`
- `neutralCount`
- `negativeCount`
- `summaryText`
- `updatedAt`

### Institutional Analytics: What To Prefer

Best target fields from broker analytics pages:

- source
- sourceType such as `broker_research` or `broker_digest`
- analyst name
- analyst firm
- published date
- ticker
- company name
- recommendation such as `buy | hold | sell`
- target price if published
- time horizon if published
- short thesis
- sector / tags
- source URL

Examples of normalized institutional items:

```json
{
  "source": "T-Invest",
  "sourceType": "broker_research",
  "ticker": "LKOH",
  "companyName": "Lukoil",
  "author": "T-Invest Analytics",
  "direction": "buy",
  "sentiment": "positive",
  "thesis": "Broker research highlights resilient free cash flow and continued dividend support.",
  "url": "https://...",
  "publishedAt": "2026-04-18T08:30:00.000Z",
  "tagsJson": ["oil", "dividends"],
  "engagementJson": {},
  "rawContentHash": "sha256:..."
}
```

```json
{
  "source": "BCS",
  "sourceType": "broker_research",
  "ticker": "SBER",
  "companyName": "Sberbank",
  "author": "BCS World of Investments",
  "direction": "hold",
  "sentiment": "neutral",
  "thesis": "Broker sees stable operating outlook but limited upside after the recent run.",
  "url": "https://...",
  "publishedAt": "2026-04-18T10:15:00.000Z",
  "tagsJson": ["banks"],
  "engagementJson": {},
  "rawContentHash": "sha256:..."
}
```

### Smart-Lab: What Can Be Collected

Good MVP source groups:

- Smart-Lab posts
- Smart-Lab corporate blogs
- Smart-Lab trade signals
- comments only later, not in MVP

Typical fields we can try to extract from Smart-Lab pages:

- post title
- author
- published date
- source URL
- ticker mentions such as `SBER`, `GAZP`, `LKOH`
- company name if present
- short thesis from title + first paragraphs
- rough sentiment: `positive | neutral | negative`
- rough direction: `buy | sell | hold | watch`
- tags / sector labels
- engagement indicators such as comments count or likes if visible

Examples of normalized Smart-Lab items:

```json
{
  "source": "Smart-Lab",
  "sourceType": "post",
  "ticker": "SBER",
  "companyName": "Sberbank",
  "author": "Ivan Petrov",
  "direction": "buy",
  "sentiment": "positive",
  "thesis": "Author expects stronger banking sector earnings and sees Sber as the main liquid beneficiary.",
  "url": "https://smart-lab.ru/blog/...",
  "publishedAt": "2026-04-18T08:30:00.000Z",
  "tagsJson": ["banks", "dividends"],
  "engagementJson": { "comments": 14 },
  "rawContentHash": "sha256:..."
}
```

```json
{
  "source": "Smart-Lab",
  "sourceType": "trade_signal",
  "ticker": "GAZP",
  "companyName": "Gazprom",
  "author": "Signal Desk",
  "direction": "watch",
  "sentiment": "neutral",
  "thesis": "The setup is not confirmed yet; the idea is to watch for momentum continuation before entering.",
  "url": "https://smart-lab.ru/signals/...",
  "publishedAt": "2026-04-18T10:15:00.000Z",
  "tagsJson": ["energy", "signal"],
  "engagementJson": {},
  "rawContentHash": "sha256:..."
}
```

What to avoid in MVP:

- raw article HTML in DB
- full prompt injection from source pages
- sentiment based only on one keyword match
- comments parsing as a first step

How Smart-Lab should be weighted:

- lower weight than institutional broker analytics
- lower trust if there is no named expert or clear track record
- best use case is spotting repeated retail narratives or emerging discussion themes

### Recommended Build Order

1. Add Prisma models

- `ResearchItem`
- `ResearchSourceState`

2. Build first connector

- start with one institutional public source that is easy to parse
- if stable institutional parsing is not available yet, use Smart-Lab only as temporary secondary input
- save fetch state and deduplicate by `source + url + rawContentHash`

3. Build normalizer layer

- extract ticker
- extract author
- infer direction and sentiment
- compress to short thesis

4. Build aggregation layer

- group by ticker
- count positive / neutral / negative
- keep only fresh items

5. Add prompt integration

- inject compact `externalResearch` into AI runtime context
- cap items per ticker and total prompt size

6. Add debug API and UI later

- inspect stored research items
- inspect summary by ticker
- show which research entered the prompt

Expected result:

- AI gets structured external context instead of noisy text
- research influences ranking and confidence, not execution safety

## Suggested Next Implementation Step

Recommended immediate next task:

- implement hard validator rules before expanding full automation

Recommended next task after that:

- add `ResearchItem` and `ResearchSourceState`
- build one Smart-Lab connector end-to-end
- inject aggregated research into AI preview context
