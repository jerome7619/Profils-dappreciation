# Profils d’appréciation

Questionnaires francophones de réflexion pour découvrir comment chacun préfère recevoir de l’attention et de la reconnaissance, à la maison comme au travail.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/profils-appreciation run dev` — run the web app
- `pnpm --filter @workspace/profils-appreciation run typecheck` — check the web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/profils-appreciation/` — public-facing questionnaire app
- `artifacts/profils-appreciation/src/App.tsx` — survey content, scoring, results, and sharing flows
- `artifacts/profils-appreciation/src/index.css` — app theme and responsive styles

## Architecture decisions

- Responses and scores are computed in the browser and stored only in that browser's local storage.
- Family and workplace questionnaires are separate; the workplace version uses trust and autonomy instead of physical contact.
- The QR code shares the family questionnaire link only; it never contains a participant's answers or result.
- Email sharing opens the participant's own mail app with a prepared summary; the app does not send email.

## Product

The app offers separate 8-question family and workplace questionnaires, personalized preference summaries with examples, QR/link sharing for the family survey, and local print/PDF, clipboard, native share, and mailto sharing for results. It is an informal reflection aid, not a validated assessment.

## User preferences

The user is communicating in French; keep app copy and explanations in French.

## Gotchas

- A QR code scanned by other people needs the app published so its URL is reachable outside the preview.
- Do not add team dashboards or send/collect individual workplace profiles without revisiting consent, access, and anonymity requirements.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
