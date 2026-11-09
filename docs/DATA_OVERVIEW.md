# Data & sources dashboard

Open `/dashboard/data` from **Data & sources** in the sidebar, or use the link in
**AI Capabilities → Demo Questions → Evaluation walkthrough**.

The page reads current local figures from the backend. It includes projects,
distinct organisations, organisation participation records, funding calls, graph
nodes/relationships, and the system document inventory grouped by EU programme.
The graph composition shows participation, derived collaborations, country/type,
funding-topic and cluster/programme relationships separately.

Search the document inventory by title, year or edition. Programme buttons filter
the table; badges count searchable records. The status filter includes archived
editions and pending source reviews. Official links and source warnings are shown
where recorded. A verified source is not a guarantee of current legal applicability.

## Count definitions

- Organisations are distinct CORDIS organisation identifiers; participation records
  can contain multiple roles for an organisation/project pair.
- Graph connections count stored directed relationships, including derived and
  retained reference entities. This is not the count of unique current partnerships.
- Document records are combined only when a matching stored hash or explicit
  cross-library parent link identifies a copy. They are not presented as unique PDFs.
- Searchable documents are active inventory records with indexed text. Pending
  reviews and archived editions remain separate. Programme assignment uses stored
  metadata or source/title identifiers; unknown legacy records stay unassigned.
- User-owned general-library uploads are excluded. No document text, local paths,
  credentials, conversations, or user information is returned by the inventory API.

## API and configuration

Frontend `/api/data-overview` requires a verified Supabase user. It calls backend
`/api/data-overview` with a server-generated viewer JWT. The frontend's private
`JWT_SECRET_KEY` must match the backend signing key. Never expose it through a
`PUBLIC_` environment variable. Restart the frontend after changing runtime settings.

The backend reads PostgreSQL in a read-only transaction and measures Neo4j
independently. Results are cached for 30 seconds; **Refresh** bypasses that cache.
Both APIs send private/no-store cache headers. A failed source produces an
unavailable state and a dash instead of fabricated zero totals. If a refresh
fails, the last checked figures remain visible with a warning.

No generation or embedding API requests are made by this page. Source timestamps
are distinguished from import dates. Refreshing the page measures the local index;
it does not ingest new CORDIS, call or document data.

For source refresh procedures see the backend's `docs/data-refresh.md`.
For the current 18-question demo bank see `src/lib/data/evaluationDemoQuestions.ts`.
The first three form a short walkthrough; the remaining options cover project
search, semantic discovery, organisations, networks, consortium patterns, country
statistics, budget benchmarks, programme comparison, eligibility, documents,
drafting, timelines and feedback. Labels describe capabilities outside the prompt.
The revised questions are not an end-to-end rehearsal of all 18 agent answers;
the earlier recorded checks remain documented separately.

## Preview builds

`BUILD_OUTPUT_DIR` optionally changes the adapter-node output directory; the default
remains `build`. This supports checking a release separately before promotion:

```bash
BUILD_OUTPUT_DIR=.releases/preview npm run build:prod
```

Load the configured runtime environment when starting a preview. `.releases/` is
excluded from Git. Keep a recoverable copy of the previous deployed build when
publishing, then restart the existing PM2 service.

## Public reference quality policy

Normal reference retrieval requires a verified publication origin. Unresolved
records are retained in reversible quarantine; pending legal reviews remain
separate. The inventory shows both for transparency, and archived source notes
explain the quarantine reason. Source verification is separate from edition
applicability. On 9 November the inventory changed to 156 active verified entries,
69 archived entries and six pending reviews, without deleting text or embeddings.

See the backend's `docs/document-lifecycle.md` for the SQL migration, maintenance
commands, backups, guarded restoration and validation.
