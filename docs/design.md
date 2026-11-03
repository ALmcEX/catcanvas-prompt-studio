# Assignment 8: Prompt Studio

The user authorized completing the plan presented in this chat, with complete prompt content visible in chain details. Build an independent repository and Vercel project using existing Next.js/Supabase Google-superadmin authorization. Existing public/admin applications remain intact.

- Chain and step CRUD, atomic reorder with revision checks, full prompt template display/editing, explicit initial/previous/earlier-step inputs.
- Sequential Gemini text/vision execution. Generate a downloadable PNG caption card from the final output and optional uploaded image; this produces actual media without requiring a second paid image-generation service.
- Record immutable chain/step snapshots, expanded runtime prompts, per-step outputs, status/errors and final PNG. Show history per chain, including after edits/deletion.
- A private storage bucket and new `studio_*` tables protect data with the existing Google-superadmin predicate. No service key in this application. Soft-delete chains, preserving run history.
- Light, Dark and System themes; responsive sidebar; public login page, protected management and media routes.
- Reject unknown/forward prompt references, stale edits, invalid/oversized images, duplicate runs and more than 12 steps. Execution timeout/failure retains completed outputs. Credentials stay server-side.
- Disable Vercel Deployment Protection; retain application authentication. Prepare three commit-specific URLs; do not submit to the course automatically.

Defaults chosen by the implementer: Gemini's existing text model; PNG rendering via Sharp; up/down reorder buttons; one active run per administrator, ten runs/hour. The chain UI explains prompt variables and PNG output.
