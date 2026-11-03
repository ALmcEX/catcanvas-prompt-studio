# Assignment 8 verification — 2026-11-03

- 15 unit tests passed: prompt references/limits, sequential execution, actual prompt capture before provider invocation, failed attempts, input image validation and real PNG encoding.
- PGlite database suite passed: chain/step CRUD, exact reorder, stale revision rejection, immutable snapshots, preserved deleted-chain history, active-run limit, long Unicode histories, independent failed-run finalization, ordinary/anonymous reads/mutations/storage denial.
- Lint and production build passed.
- Both additive migrations applied to existing Supabase. The same rollback acceptance SQL passed live. Test users/chains/runs were rolled back; existing legacy chains remained untouched.
- Local production app verified with a real Google-superadmin session. Created a real three-step example chain, moved the second step up then restored the sequence, edited and saved the complete third prompt, verified full templates shown directly in the chain view.
- Dark/Light theme switch and Light persistence across refresh verified. System mode is implemented via prefers-color-scheme. Browser viewport override reported success but actual innerWidth remained 1512, so authenticated mobile rendering is not claimed verified.
- Login route returns 200 and protected routes redirect anonymous requests to login. Missing Gemini credentials show a clear error and create no invented run records.

Pending: new Vercel project deployment (GitHub installation requires mailbox verification), approval to reuse the existing CatMeme API key in the new project's server settings, real provider generation/upload and deployed Incognito checks. No course submission has been made.
