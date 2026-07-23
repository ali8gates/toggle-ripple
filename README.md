# Ripple

**Event to Impact Tracer, built for Reflexivity.**

Pick a market event, or type a question in plain English, and Ripple traces it through the knowledge graph to show the second and third order names it moves. It renders a narrative card, a provenance and confidence table, and a live price tape on the impacted tickers. You can also spin up a throwaway subgraph, scope it to one event, trace it, and discard it.

This is a working prototype. The seed graph is illustrative, but the traversal, the interface, and the prices are real. The idea is that you can drop it on the production Neo4j graph and it keeps the same shape.

---

## Run it locally

No build step and no dependencies. It is plain HTML, CSS, and JavaScript, and the prices are baked into a JSON file so it works offline.

**Option 1: open the file directly**
Double click `index.html`. It opens in your browser and runs.

**Option 2: serve it (recommended, avoids browser file restrictions)**
From this folder:

```bash
# Python
python3 -m http.server 8099
# then open http://localhost:8099
```

or

```bash
# Node
npx serve .
```

---

## How to use it

1. **Ask a question** in the plain English box, for example "what happens if a fertilizer port shuts?" or "JPMorgan just beat earnings." Ripple maps it to the right event and traces it. You can also skip this and pick an event from the list below the box.
2. **Set the trace depth** (1 to 3 hops) and the ranking bias (precision favors the highest confidence paths, recall widens coverage).
3. **Press Trace ripple.** The graph animates out from the event through the first, second, and third degree names. Tradeable endpoints are outlined in red. You can drag any node.
4. **Read the right rail:** the narrative card (what happened, the ripple path, and the non-obvious trade), the provenance and confidence table (every edge cites its source), and the live tape with current prices.
5. **Press Discard subgraph** to clear it and start over.

---

## What is real and what is illustrative

- **Real:** the traversal logic, the interface, the temporary subgraph controls, and the prices on the live tape.
- **Illustrative:** the seed graph nodes and edges, and the confidence scores. In production these bind to the real graph and to the extraction pipeline's confidence outputs.

---

## How it works under the hood

- The traversal walks existing typed edges in the graph (supply chain, input, geographic, thematic, peer) and ranks the impacted names by exposure. This part is deterministic.
- The language layer only reads your typed question and writes the narrative. It never creates or scores an edge. In this prototype the question matching runs locally with keyword routing, which stands in for the production language model so nothing can break during a live demo.
- The catalyst-validation pipeline decides which events are real enough to trace.
- Confidence stays visible on every edge, and low-confidence edges are flagged rather than hidden.

---

## Files

- `index.html` — the app markup and styling
- `app.js` — the seed graph, the traversal and animation, and the plain English routing
- `quotes.json` — the baked-in price data for the live tape

---

## Data sources

| Layer | Source | Role |
|---|---|---|
| Graph store | Neo4j | Holds the typed edges the traversal walks |
| Edge extraction | Language extraction plus deterministic guardrails | Builds and validates the edges |
| Event gating | Catalyst-validation pipeline | Decides which events fire a trace |
| Citations behind edges | Company filings, transcripts, sector maps | Source shown in the provenance table |
| Time-series signals | Intraday market and commodity data | Feeds exposure ranking |
| Live prices | Real-time market quotes | Shown on the live tape |
