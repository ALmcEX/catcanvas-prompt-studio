# CatCanvas Prompt Studio — Assignment 8

An independent, Google-superadmin-only prompt chain editor and runner.

## Features
- Create, edit and delete prompt chains and steps; reorder with revision protection.
- Full prompt templates shown directly on chain details, editable in-place. Run details show immutable templates and the actual expanded prompts used.
- Image/text input; sequential Gemini calls; downloadable PNG caption cards from final text and optional original image.
- Per-chain history and generated media. Deleting a chain preserves prior runs.
- Light, Dark and System themes; responsive collapsible sidebar.

## Setup
1. `npm ci`. Copy `.env.example` to `.env.local`; configure the existing Supabase project and Gemini API key. No service-role key is used.
2. Apply `supabase/migrations/20261103000000_prompt_studio.sql` to the existing CatCanvas database, after its Assignment 6/7 migrations. It adds only studio tables, functions and private bucket policies.
3. Add the exact application `/auth/callback` URL to Supabase Authentication → URL Configuration.
4. `npm run dev`. Sign in with an existing Google account whose profile has `is_superadmin = true`. Ordinary accounts receive Access denied; the app never promotes users.
5. Deploy to a separate Vercel project. Configure the same three environment variables for the deployment. Disable Vercel Deployment Protection while retaining application authentication.

## Checks
`npm test`, `npm run test:db`, `npm run lint`, `npm run build`.
The database harness creates an isolated PGlite database and applies fixture copies of earlier CatCanvas migrations; no live data is changed by tests.

## Prompt variables
`{{input}}` is the initial run text. `{{previous}}` is the preceding step output (initial input for step one). `{{step:UUID}}` references a specific earlier step. Unknown or forward references are rejected. Step IDs/references are shown in the editor.

## Generation behavior
The final text is rendered with Sharp as a 1200px-wide PNG, with the uploaded image when provided. PNG cards include up to 1,200 characters; full outputs remain in run details. This is caption-card media generation rather than a text-to-image diffusion service. Steps use the existing Gemini text/vision model. Unsupported uploads, failed provider calls and interrupted execution preserve an honest status and any completed outputs. One active run per administrator, at most ten runs/hour and twelve steps per chain.
