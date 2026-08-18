> Status: geremedieerd op 18-08-2026 — zie REMEDIATION_LOG.md
>
> Documentation status: remediated audit record | Owner: MAP-IT frontend team | Scope: documentation/code consistency audit | Last verified: 18-08-2026

# Documentatie-audit — webapp-ui (NEWMAPIT)

**Auditdatum:** 18 augustus 2026
**Scope:** alle getrackte Markdown-bestanden in deze repository, plus `package.json`, `package-lock.json`, `check-env.js`, `check-env.sh`, `drizzle.config.ts`, `.env.example`, `.env.production`, `svelte.config.js`, `vite.config.ts`, `nginx-supabase.conf`, de Supabase CLI-configuratie en relevante delen van `src/`. Geheime waarden uit de lokale `.env` zijn niet opgenomen; alleen de variabelenamen zijn vergeleken.

## TL;DR

- **Nee: deze repo is nog niet zelfstandig klaar voor een nieuwe developer.**
- De README geeft een globale introductie, maar geen reproduceerbare end-to-end quick start voor frontend, database, Supabase en MAP-IT-backend.
- De env-, database- en poortdocumentatie spreekt de code op blokkerende punten tegen.
- De relevante kennis is verspreid over 17 documenten, waaronder verouderde plannen, AI-/sessie-artefacten en kapotte verwijzingen.
- Eerst is één canonieke onboardingroute nodig; daarna moeten deployment- en featuredocs aan de actuele code worden getoetst.

## Score per criterium

| Criterium | Score | Beoordeling |
| --- | --- | --- |
| README met projectdoel, tech stack en quick start | 🟡 | `README.md` beschrijft doel, features en stack en noemt `npm install`/`npm run dev`, maar mist prerequisites, env-configuratie, database/Supabase/backend-start, poort, verificatie en bekende beperkingen. |
| Installatie & setup (Node, package manager, dependencies, env) | 🟡 | `DEPLOYMENT_GUIDE.md` noemt Node 18+, npm/yarn, clone, `npm install` en `cp .env.example .env`. Er is echter geen `.nvmrc`, `.node-version` of `engines`-veld; npm is door `package-lock.json` feitelijk de logische keuze, maar dat wordt niet als canoniek vastgelegd. De lokale full-stack setup staat verspreid over meerdere documenten. |
| `.env.example` met alle benodigde variabelen | ❌ | Het bestand bestaat, maar mist `DATABASE_URL`, dat `drizzle.config.ts` voor alle `db:*`-scripts verplicht stelt. Het bevat tegelijk meerdere ongebruikte of dubbele variabelen en zet een service-role-placeholder ten onrechte onder een `PUBLIC_`-naam. De productie-template heeft een ander, eveneens onvolledig contract. |
| Devserver starten + poort | 🟡 | `npm run dev` is correct en Vite gebruikt standaard 5173; die poort staat alleen expliciet in de deploymentguide. De Supabase-authconfig gebruikt juist poort 3000 en de huidige login-cookiecode is hard gekoppeld aan HTTPS/`.mapit.work`, waardoor een gedocumenteerde localhost-flow niet betrouwbaar is. |
| Koppeling met MAP-IT-backend, URL's en streaming | 🟡 | `BACKEND_URL=http://localhost:18000` en de healthcheck zijn gedocumenteerd. Er ontbreekt één actueel overzicht van de same-origin frontendproxies, V3/V4-routes, JWT-secret en SSE-stromen. `/api/chat/websocket` is bovendien een HTTP POST; de echte WebSocketverbinding is Supabase Realtime. |
| Supabase-setup actueel en consistent | 🟡 | Er zijn lokale en Realtime-gidsen en `supabase_cli/schema.sql` bevat de Realtime-publicatie. Ze bevatten echter verkeerde/verwarrende URLs, een niet-werkende Drizzle-stap, dubbele configlocaties, een auth-poortconflict en voorbeeld-RLS in plaats van een aantoonbaar actuele migratieprocedure. |
| Build & deployment | 🟡 | Scripts en een uitgebreide guide bestaan, maar productiepoort, env-contract, domein, nginxconfig en cookiegedrag zijn niet onderling consistent. De guide kan daarom niet veilig als runbook worden gevolgd. |
| Projectstructuur / architectuuroverzicht | ❌ | `docs/project_docs.md` is een WIP-stub van 25 regels. Er is geen actueel overzicht van routes, server/clientgrenzen, stores, database, Supabase Auth/Realtime, backendproxies en de twee proposalflows. De bestaande architectuurdocs zijn feature-specifiek of expliciet gearchiveerd. |

## Top 5 gaps die onboarding blokkeren

### 1. Er is geen correct en eenduidig env-contract

Dit is de grootste directe blocker:

- De runtime-databaseclient vereist `PRIVATE_DATABASE_URL` (`src/lib/server/db/index.ts`), maar Drizzle CLI vereist `DATABASE_URL` (`drizzle.config.ts`).
- `.env.example` bevat alleen `PRIVATE_DATABASE_URL`; daardoor zijn de gedocumenteerde `npm run db:push`, `db:generate`, `db:migrate` en `db:studio` niet reproduceerbaar vanuit het voorbeeldbestand.
- `.env.production` bevat juist alleen `DATABASE_URL`, terwijl de app-runtime `PRIVATE_DATABASE_URL` vereist. Het bestand mist ook `BACKEND_URL`, `JWT_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY` en de Vite-testvariabelen.
- `JWT_SECRET_KEY` heeft in de code een onveilige fallback (`fallback-secret-change-in-production`), terwijl de backend dezelfde secret moet gebruiken. De docs behandelen dit niet als harde productievoorwaarde.
- `SUPABASE_SERVICE_ROLE_KEY` wordt voor invite/member-adminroutes gelezen. De fallback naar de anon key geeft niet dezelfde rechten en maakt de variabele operationeel noodzakelijk voor die functies.
- `PUBLIC_SUPABASE_SERVICE_KEY` staat in `.env.example`, wordt nergens gelezen en suggereert ten onrechte dat een service-role key publiek mag zijn. Een echte service-role key mag nooit via een `PUBLIC_`-variabele aan clientcode worden blootgesteld.

**Impact:** installatie lijkt voltooid, maar databasecommando's, runtime of adminfuncties kunnen vervolgens falen; daarnaast is de voorbeeldnaamgeving securitygevoelig.

### 2. Een end-to-end lokale quick start ontbreekt en localhost-auth botst met de code

Een nieuwe developer krijgt geen enkele geverifieerde volgorde voor:

1. juiste Node/npm-versie;
2. `npm ci` of `npm install`;
3. lokale Supabase/Docker starten;
4. schema/migraties toepassen;
5. anon- en service-role keys overnemen;
6. MAP-IT FastAPI-backend op 18000 starten;
7. gedeelde `JWT_SECRET_KEY` instellen;
8. frontend op 5173 starten;
9. health, login, query en streaming testen.

Daarbij zegt `DEPLOYMENT_GUIDE.md` dat cookies in development `secure: false` gebruiken, maar `src/routes/api/auth/login/+server.ts` zet `secure: true` onvoorwaardelijk en maakt handmatige cookies voor `.mapit.work`. `supabase_cli/supabase/config.toml` staat bovendien op `site_url=http://127.0.0.1:3000`, terwijl de Vite-devserver 5173 gebruikt.

**Impact:** de server kan wel starten, maar de gedocumenteerde lokale login/session-flow is niet betrouwbaar uitvoerbaar.

### 3. Database- en Supabase-initialisatie zijn niet reproduceerbaar beschreven

- `supabase_cli/how_to_run.md` zegt vanuit `supabase_cli/` daarna `cd webapp-ui`; dat pad bestaat daar niet. Het bedoelde commando is waarschijnlijk `cd ..`.
- Dezelfde gids laat `npm run db:push` uitvoeren met alleen `PRIVATE_DATABASE_URL`, terwijl `drizzle.config.ts` `DATABASE_URL` controleert.
- De gids linkt naar een absolute lokale URI voor `schema.sql`; die link werkt niet op een andere machine.
- `supabase_cli/schema.sql` is een grote database-dump inclusief Supabase-interne objecten, terwijl daarnaast Drizzle-migraties bestaan. Er staat niet welke bron leidend is, wanneer beide nodig zijn en hoe schema drift wordt voorkomen.
- Er zijn twee Supabase-configs (`supabase_cli/config.toml` en `supabase_cli/supabase/config.toml`) met verschillende `project_id`-waarden. Bij `supabase start` vanuit `supabase_cli/` is de geneste config relevant, maar dat onderscheid is niet uitgelegd.
- `docs/SUPABASE_LOCAL_REALTIME_SETUP.md` noemt `http://localhost:54323` “local Supabase”; dat is Studio. De API URL is 54321, zoals `supabase_cli/how_to_run.md` zelf correct meldt.
- De Realtime-publicatie voor `public.message` staat al in `supabase_cli/schema.sql`, terwijl de Realtime-guide dezelfde handmatige SQL als noodzakelijke setup presenteert. Er ontbreekt een idempotente, canonieke migratiestap.

**Impact:** een nieuwe developer kan verschillende, deels conflicterende schema-routes volgen en eindigen met een afwijkende database.

### 4. Het production runbook gebruikt inconsistente poorten, domeinen en env-aannames

- `npm start` draait de adapter-node build. Zonder `PORT` luistert die standaard op 3000; `nginx-supabase.conf` proxyt de app naar 5173 en `DEPLOYMENT_GUIDE.md` tekent de productieapp eveneens op 5173. `PORT`/`HOST`/`ORIGIN` staan nergens in de env-templates of runbook.
- `nginx-supabase.conf` gebruikt `new.mapit.work`, terwijl meerdere guidevoorbeelden `mapit.work` gebruiken.
- In de `/supabase/`-location zet nginx eerst `Connection 'upgrade'` en daarna `Connection ""`, en verbergt het de `Upgrade`-header. Dat is strijdig met de claim dat Supabase Realtime/WebSockets via deze proxy werken.
- `build:prod` is exact `vite build`; het script maakt de productie-envkeuze niet explicieter dan `npm run build`. De guide beschrijft een sterkere scheiding dan de scripts garanderen.
- Het `host`-script gebruikt `npm run build && pm2 delete ...; pm2 start ...`. Door de puntkomma wordt het startdeel ook na een mislukte build uitgevoerd.
- De guide verwijst naar een volledige `/etc/nginx/sites-available/mapit.conf`, maar die staat niet in de repo; `nginx-supabase.conf` is een ander, gedeeltelijk voorbeeld.

**Impact:** letterlijk volgen van de deploymentguide kan een reverse proxy naar de verkeerde poort opleveren of een oude/mislukte build starten.

### 5. Er is geen canonieke documentatiestructuur; historische artefacten lijken gezaghebbend

De root bevat naast de README meerdere concurrerende “guides”, rapporten en sessiesamenvattingen. Sommige historische bestanden zijn correct als `ARCHIVED` gemarkeerd, maar verwezen voor actuele informatie naar een startbestand buiten deze Git-repository. Na een zelfstandige clone was dat doel dus niet beschikbaar. Andere rapporten/plannen hebben geen statuslabel en ogen actueel terwijl routes, voorbeelden of claims niet meer kloppen.

**Impact:** een nieuwe developer kan niet bepalen welke bron leidend is en volgt gemakkelijk een oud implementatievoorstel of incidentfix in plaats van de huidige architectuur.

## Documentinventaris en status

### Root

| Bestand | Soort | Beoordeling | Aanbevolen status/actie |
| --- | --- | --- | --- |
| `README.md` | Projectintroductie | Gedeeltelijk actueel, maar geen complete onboarding. | Uitbouwen tot de canonieke ingang met quick start en links naar verdiepende docs. |
| `DEPLOYMENT_GUIDE.md` | Setup/deployment-runbook | Uitgebreid maar op cruciale punten verouderd of inconsistent met code/config. | Na correctie behouden als productie-runbook; lokale onboarding uit de README laten verwijzen naar een aparte setupguide. |
| `TROUBLESHOOTING.md` | Operations quick reference | Deels bruikbaar, maar erft poort/env/cookie-aannames uit de deploymentguide. | Actualiseren na het vastleggen van de echte deploymentarchitectuur. |
| `CRUSH.md` | AI-agentconfiguratie | Geen documentatie voor menselijke onboarding. De buildscripts kloppen grotendeels; de testsectie niet. | Buiten de menselijke docnavigatie houden. Corrigeer `npm run test -- <file>`: er is geen test runner en `test` is alleen een alias voor `check`. |
| `AI_Proposal_Writer_Frontend_Integration_Guide.md` | Externe/V4 API-integratiespecificatie | V4-routes sluiten grotendeels aan op `proposalSessionService.ts` en `/api/v4/[...path]`, maar ruim 1.700 regels React/Redux-voorbeelden passen niet bij deze SvelteKit-repo. De genoemde backendmigratie `015_proposal_sessions.sql` staat niet hier. De V4 service/store bestaan, maar er is geen route/component die `proposalSessionStore` importeert; de zichtbare editor gebruikt nog `proposalStore`. | Label als backend API reference/handoff, vermeld eigenaar en versie, en beschrijf eerlijk of de V4 UI geïntegreerd, gedeeltelijk geïntegreerd of alleen voorbereid is. |
| `CHECK_ISSUES.md` | Tijdgebonden kwaliteitsbaseline | Statusartefact, waarschijnlijk uit een audit-/AI-werksessie; geen onboarding. Op 18 augustus 2026 opnieuw geverifieerd: nog steeds **64 errors en 76 warnings in 34 bestanden**. | Verplaatsen naar `docs/status/` of issue tracker; datum en commit toevoegen. Niet als permanente architectuurdoc gebruiken. |
| `SESSION_SUMMARY.md` | AI-/sessie- en incidentartefact | Expliciet gearchiveerd. Eindclaims “documentatie compleet” en “deployment ready” zijn strijdig met de huidige audit. Verwijst buiten de repo naar een ontbrekende startpagina. | Uit root verwijderen of naar `docs/archive/` verplaatsen; niet als bron voor onboarding gebruiken. |
| `proposal_editor_report.md` | Handoff-/analyseartefact | Verouderd: noemt `.../proposals/[proposal_id]/+page.svelte`, terwijl de route nu `.../[proposal_id]/edit/+page.svelte` is. | Archiveren of actualiseren en duidelijk als historisch backend-handoffrapport labelen. |

### `docs/`

| Bestand | Soort | Beoordeling | Aanbevolen status/actie |
| --- | --- | --- | --- |
| `docs/project_docs.md` | Beoogd architectuuroverzicht | WIP-stub; noemt alleen stack en timestampconventie. | Vervangen door een echt architectuuroverzicht. |
| `docs/project_setup.md` | Oude VPS/demo-setup | Expliciet gearchiveerd; bevat destructieve stappen, open firewalladvies en oude poorten. Linkt buiten de repo naar een ontbrekende startpagina. | Naar `docs/archive/` of verwijderen na veiligstellen van nuttige historie. |
| `docs/SUPABASE_LOCAL_REALTIME_SETUP.md` | Lokale Realtime-setup | Deels bruikbaar, maar verwart Studio met API, dupliceert SQL uit `schema.sql` en legt de schema-eigenaar niet vast. | Samenvoegen met de lokale Supabase-guide. |
| `docs/SUPABASE_REALTIME_SETUP.md` | Hosted/algemene Realtime-setup | Beschrijft de daadwerkelijke `postgres_changes`-flow op `public.message`, maar RLS is voorbeeldcode en niet aantoonbaar dezelfde policy als de huidige schema-initialisatie. | Actualiseren met de echte migratie/policies en onderscheid local/hosted. |
| `docs/RATE_LIMITING.md` | Featuredocumentatie | De endpointlimieten kloppen, maar de claim “global protection op alle `/api/*`” is onjuist: die middleware is in `src/hooks.server.ts` uitgecommentarieerd. | Corrigeren en duidelijk “implemented” versus “disabled/planned” onderscheiden. |
| `docs/PROPOSAL_EDITOR_IMPLEMENTATION.md` | Feature-/implementatieoverzicht | Gedeeltelijk bruikbaar, maar noemt mockgedrag als implementatie, bevat toekomstclaims en linkt naar ontbrekende `API_DOCUMENTATION.md` en `COMPONENT_LIBRARY.md`. | Tegen de huidige `/edit`-route en V4-sessionflow valideren; kapotte links herstellen. |
| `docs/CITATION_IMPLEMENTATION_VERIFICATION.md` | Testplan/AI-implementatieartefact | Onuitgevoerd plan: alle checklistitems staan open en voorbeeldtests (`citationRenderer.test.ts`) bestaan niet. | Naar `docs/testing/` met status “plan, niet geïmplementeerd”, of omzetten naar echte tests/issues. |
| `docs/CONVERSATIONAL_AI_ARCHITECTURE.md` | Historisch architectuurvoorstel | Expliciet gearchiveerd pre-V3-voorstel; verwijst buiten de repo naar een ontbrekende startpagina. | Naar `docs/archive/`. |
| `docs/CONVERSATION_IMPLEMENTATION_GUIDE.md` | Historische implementatiehandleiding | Expliciet gearchiveerd; bevat vooral backend-Pythonbestanden die niet in deze repo bestaan. | Naar `docs/archive/`. |

### Andere locatie

| Bestand | Soort | Beoordeling | Aanbevolen status/actie |
| --- | --- | --- | --- |
| `supabase_cli/how_to_run.md` | Lokale database/Supabase-setup | Waardevolle basis, maar de `cd`-stap, absolute link en `DATABASE_URL`/`PRIVATE_DATABASE_URL`-instructie zijn onjuist. | Corrigeren en vanuit de README als enige lokale Supabase-bron linken. |

## Env-var cross-check

### Door de huidige code gelezen of operationeel vereist

| Variabele | Lezer / functie | Status in `.env.example` | Audit |
| --- | --- | --- | --- |
| `PUBLIC_SUPABASE_URL` | Browserclient, hooks en veel serverroutes | Aanwezig | Nodig. Voor local hoort dit normaal naar API-poort 54321 te wijzen. |
| `PUBLIC_SUPABASE_ANON_KEY` | Browserclient, hooks en serverroutes | Aanwezig | Nodig. |
| `PRIVATE_DATABASE_URL` | Runtime Drizzle-client en test/migratiecode | Aanwezig | Nodig voor app-runtime. |
| `DATABASE_URL` | `drizzle.config.ts` en dus `db:*`-scripts | **Ontbreekt** | Blokkerende fout in het voorbeeldcontract. Documenteer beide namen of uniformeer de code. |
| `BACKEND_URL` | Health, query, proposal, V3- en V4-proxies | Aanwezig | Heeft fallback `http://localhost:18000`, maar moet expliciet per omgeving worden vastgelegd. |
| `JWT_SECRET_KEY` | JWT voor de beveiligde backend V3-streamingproxy | Aanwezig | Operationeel vereist; fallback is niet veilig en de “moet backend matchen”-stap ontbreekt in onboarding/deployment. |
| `SUPABASE_SERVICE_ROLE_KEY` | Collaboration invite/member-adminroutes | Aanwezig | Server-only houden; functioneel nodig voor adminoperaties. |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Alleen `/api/test_rls` | Aanwezig | Legacy/testalias, niet de hoofd-Supabaseconfig. Dit onderscheid ontbreekt. |
| `PUBLIC_APP_NAME`, `PUBLIC_APP_URL`, `PUBLIC_APP_ENV` | Config/SEO/defaults | Aanwezig | Optioneel door defaults, maar `PUBLIC_APP_ENV` bestuurt niet SvelteKit's echte buildmode. |
| `PUBLIC_ENABLE_DEBUG_TOOLS`, `PUBLIC_ENABLE_ANALYTICS`, `PUBLIC_API_TIMEOUT_MS`, `PUBLIC_MAX_UPLOAD_SIZE_MB` | Alleen configobject/defaults | Aanwezig | Geen aangetoonde consumers buiten config; documenteer als optioneel of verwijder dode configuratie. |

### In `.env.example`, maar niet door de huidige frontendcode gebruikt

- `PUBLIC_SUPABASE_SERVICE_KEY` — verwijderen; de naam is securitygevaarlijk.
- `SUPABASE_URL` — niet gebruikt naast `PUBLIC_SUPABASE_URL`.
- `GOOGLE_API_KEY` — niet gelezen in deze frontend.
- `MAPBOX_API_KEY` — niet gelezen in deze frontend; er is ook geen gedocumenteerde alternatieve tokenvariabele.
- `DEBUG` — niet gelezen door de app.

`check-env.js` controleert slechts vier namen, laadt zelf geen `.env` en staat niet in `package.json`. `check-env.sh` bekijkt alleen PM2 en Supabase-URLregels. Geen van beide valideert het werkelijke, hierboven beschreven contract. Maak één fail-fast validator en koppel die aan een npm-script, bijvoorbeeld `npm run env:check`.

## Huidige backend/API-architectuur zoals uit de code afgeleid

De browser benadert overwegend relatieve, same-origin SvelteKit-routes. SvelteKit praat server-side met `BACKEND_URL` (standaard `http://localhost:18000`). Dat belangrijke grensvlak staat nergens compact beschreven.

| Frontendroute | Backenddoel | Transport / doel |
| --- | --- | --- |
| `/api/backend-status` | `${BACKEND_URL}/api/health` | JSON healthcheck |
| `/api/query` | `${BACKEND_URL}/api/query` | Niet-streamende AI-query |
| `/api/query/stream` | `${BACKEND_URL}/api/query/stream` | SSE-stream |
| `/api/proxy/conversation/:id/message` | `${BACKEND_URL}/api/v3/conversation/:id/message` | V3 JSON-proxy; voegt zelf geen backend-JWT toe |
| `/api/proxy/conversation/:id/message/stream` | `${BACKEND_URL}/api/v3/conversation/:id/message/stream` | V3 SSE met backend-JWT |
| `/api/proxy/conversation/:id/context`, `reset-context` | V3 conversationroutes | Contextbeheer |
| `/api/proxy/conversation/:id/follow-ups` | Geen backenddoel; lokale stub | Retourneert momenteel altijd een lege lijst |
| `/api/v4/*` | `${BACKEND_URL}/api/v4/*` | Transparante V4-proxy, gebruikt door proposal sessions en SSE |
| `/api/proposal-document/*` | `${BACKEND_URL}/api/proposal-document/*` | Proposal document REST/proxy |
| `/api/providers` | `${BACKEND_URL}/api/providers` | Providerlijst |
| `/api/chat/websocket` | Geen backend-WebSocket; schrijft via SvelteKit/Supabase | HTTP POST, ondanks de routenaam |
| Supabase browserclient | `PUBLIC_SUPABASE_URL` | Auth, REST en echte Realtime WebSocket (`postgres_changes` op `public.message`) |

De V3 streamingproxy maakt een HS256 JWT met `JWT_SECRET_KEY`; de niet-streamende V3-messageproxy en de V4 catch-all-proxy doen dit momenteel niet. Dit verschil en de vereiste backendconfiguratie horen in het architectuuroverzicht.

## Concrete docs-vs-code-tegenstrijdigheden

1. **Databasevariabele:** README/deployment/Supabase-gids sturen op `PRIVATE_DATABASE_URL`; `drizzle.config.ts` weigert te starten zonder `DATABASE_URL`.
2. **Productietemplate:** `.env.production` heeft `DATABASE_URL`, maar `src/lib/server/db/index.ts` stopt zonder `PRIVATE_DATABASE_URL`; de template is dus niet zelfstandig bruikbaar voor runtime.
3. **Productiepoort:** nginx en het deploymentdiagram gebruiken 5173; `npm start` met adapter-node gebruikt zonder `PORT` standaard 3000.
4. **Dev-authpoort:** README/Vite gebruiken 5173; `supabase_cli/supabase/config.toml` gebruikt 3000 voor `site_url` en redirects.
5. **Cookiegedrag:** deploymentguide zegt development `secure: false`; logincode gebruikt altijd `secure: true` en `.mapit.work`.
6. **Global rate limiting:** `docs/RATE_LIMITING.md` zegt actief voor alle `/api/*`; `src/hooks.server.ts` markeert dit expliciet als `DISABLED`.
7. **Tests:** `CRUSH.md` suggereert één testbestand via `npm run test -- <file>`; `package.json` laat `test` alleen `npm run check` uitvoeren en bevat geen Vitest/Jest/Playwright-runner.
8. **Proposalroute:** `proposal_editor_report.md` wijst naar `[proposal_id]/+page.svelte`; de echte route is `[proposal_id]/edit/+page.svelte`.
9. **Proposalstack:** de V4 integration guide geeft uitgebreide React/Redux-implementaties; de repo gebruikt Svelte stores en heeft `proposalSessionService.ts`/`proposalSessionStore.ts`, maar de actieve editorroute importeert de oudere `proposalStore` en geen UI importeert de V4 sessionstore.
10. **Realtime URL:** de lokale Realtime-guide noemt poort 54323 als Supabase URL; dat is Studio, terwijl de API op 54321 staat.
11. **Realtime setup:** docs vragen handmatig `ALTER PUBLICATION`; `supabase_cli/schema.sql` bevat die publicatie al. De canonieke/idempotente route ontbreekt.
12. **Nginx Realtime:** docs claimen WebSocketondersteuning via `/supabase/`, maar de meegeleverde location wist de `Connection`-header en verbergt `Upgrade` na die eerst te hebben gezet.
13. **Production env:** de deploymentguide toont `PRIVATE_DATABASE_URL`, `BACKEND_URL`, Vite-vars en service key; het getrackte `.env.production` bevat deze niet.
14. **Buildmodes:** de guide zegt dat standaard `npm run build` `.env` gebruikt en `build:prod` specifiek `.env.production`; beide productiebuilds draaien feitelijk `vite build`, waarbij Vite's mode/env-laadregels gelden. `build:dev` injecteert `.env`, maar voert nog steeds een productiebuild uit.
15. **Kapotte docslinks:** `docs/PROPOSAL_EDITOR_IMPLEMENTATION.md` linkt naar niet-bestaande `API_DOCUMENTATION.md` en `COMPONENT_LIBRARY.md`. Gearchiveerde docs verwijzen naar een startpagina buiten de repository.
16. **Kwaliteitsclaim:** `SESSION_SUMMARY.md` eindigt met “documentation complete” en “deployment ready”; `npm run check` faalt nog met 64 errors/76 warnings en dit rapport vindt meerdere onboardingblockers.

## Aanbevolen acties

### P0 — vóór overdracht aan een nieuwe developer

1. **Maak de README de canonieke startpagina.** Voeg een daadwerkelijk geteste quick start toe met exacte Node/npm-versie, `npm ci`, env-copy, Supabase-start, schema-init, backend-start, frontend-start, URLs en healthchecks.
2. **Definieer één env-contract.** Beslis over `DATABASE_URL` versus `PRIVATE_DATABASE_URL`; documenteer required/optional, scope (public/server/build/runtime), voorbeeldwaarde en eigenaar. Verwijder `PUBLIC_SUPABASE_SERVICE_KEY` en ongebruikte aliases.
3. **Maak localhost-auth expliciet werkend en documenteer het resultaat.** Breng Vite 5173, Supabase redirect URLs en cookie `secure`/`domain`-gedrag op één lijn. Dit vereist later een codewijziging; deze audit heeft die bewust niet uitgevoerd.
4. **Maak één reproduceerbare databaseprocedure.** Kies een leidende migratiebron (Supabase migrations, Drizzle migrations of een duidelijk geversioneerde bootstrap), corrigeer de `cd`- en env-stappen en test vanaf een schone clone/database.
5. **Herstel het production runbook.** Leg `PORT`, `HOST` en `ORIGIN` vast, maak nginx consistent met die poort en één domein, en valideer Supabase Realtime/WebSocketproxying.

### P1 — begrip en onderhoudbaarheid

6. **Voeg `docs/ARCHITECTURE.md` toe** met:
   - SvelteKit routegroepen en server/clientgrens;
   - `src/lib/clients`, `stores`, `components`, `server/db` en `routes/api`;
   - Supabase Auth, Postgres/Drizzle en Realtime;
   - same-origin API-proxies naar backend V3/V4;
   - SSE-eventflow en JWT-koppeling;
   - proposal document versus proposal session flow.
7. **Voeg een compacte API/backend-matrix toe** zoals hierboven, inclusief welke service elk endpoint gebruikt en welke env-var/auth nodig is.
8. **Maak `npm run env:check`** dat zonder secrets te printen alle verplichte variabelen valideert voor `dev`, `db` en `production`. Vervang of documenteer de beperkingen van de twee huidige check-env-scripts.
9. **Leg de verwachte kwaliteitsstatus vast.** `npm run check` faalt momenteel. Zet dit prominent onder “Known issues” of herstel de fouten voordat “ready” wordt geclaimd. Voeg echte testcommando's pas toe als een test runner bestaat.

### P2 — documentatie opschonen

10. **Verplaats sessie-/AI-artefacten naar `docs/archive/` of de issue tracker:** `SESSION_SUMMARY.md`, `CHECK_ISSUES.md`, `proposal_editor_report.md`, de twee gearchiveerde conversationdocs en eventueel het citation-verificatieplan.
11. **Label elk blijvend document** met status (`current`, `draft`, `archived`), eigenaar, toepassingsgebied en “last verified against commit/date”.
12. **Splits API-specificaties van repo-onboarding.** Behoud de V4 proposalguide als versiegebonden backendcontract, maar laat hem niet concurreren met SvelteKit-implementatiedocs en verwijder/verplaats de Reactvoorbeelden.
13. **Herstel alle lokale links** en zorg dat geen actuele instructie afhankelijk is van een bestand buiten deze Git-repository of een absolute lokale bestands-URI.
14. **Combineer de Supabase-docs** tot één local setup plus één hosted/production hoofdstuk; beschrijf expliciet API (54321), DB (54322), Studio (54323), Inbucket (54324), RLS en Realtime-publicatie.

## Eindoordeel

De repo heeft opvallend veel documentatie, maar volume is hier geen vervanging voor een betrouwbare onboardingroute. De actuele README is te dun, terwijl de gedetailleerde informatie verspreid en soms tegenstrijdig is. Een ervaren maintainer kan de bedoelde architectuur uit de code reconstrueren; een nieuwe developer kan op basis van de huidige docs niet met voldoende zekerheid een schone clone configureren, lokaal inloggen, database en backend koppelen en dezelfde build deployen. De aanbevolen P0-acties zijn daarom voorwaarden voor een zelfstandige overdracht.
