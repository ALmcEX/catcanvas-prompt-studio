# Assignment 8 verification — 2026-11-04

- 16 unit tests passed: prompt references/limits, sequential execution, actual prompt capture before provider invocation, failed attempts, input image validation and real PNG encoding.
- PGlite database suite passed: chain/step CRUD, exact reorder, stale revision rejection, immutable snapshots, preserved deleted-chain history, active-run limit, long Unicode histories, independent failed-run finalization, ordinary/anonymous reads/mutations/storage denial.
- Lint and production build passed.
- Both additive migrations applied to existing Supabase. The same rollback acceptance SQL passed live. Test users/chains/runs were rolled back; existing legacy chains remained untouched.
- Local production app verified with a real Google-superadmin session. Created a real three-step example chain, moved the second step up then restored the sequence, edited and saved the complete third prompt, verified full templates shown directly in the chain view.
- Dark/Light theme switch and Light persistence across refresh verified. System mode is implemented via prefers-color-scheme. Browser viewport override reported success but actual innerWidth remained 1512, so authenticated mobile rendering is not claimed verified.
- Login route returns 200 and protected routes redirect anonymous requests to login. Missing Gemini credentials show a clear error and create no invented run records.

- Real local and production vision chains completed 3/3 steps with Gemini using the approved server key. Generated media and actual expanded prompts are present in immutable run histories.
- New Vercel project created and Production server secret saved. Deployment Protection confirmed disabled after revisiting settings; anonymous requests reach app login and protected pages retain the Google-superadmin guard. Stable and deployment-specific OAuth callbacks added.
- Production visual inspection caught absent server fonts in SVG text. Bundled OFL Noto Sans Latin and outlined glyphs remove reliance on host fonts. Regression test, lint and production build pass. The final deployment URL and post-fix visual evidence are recorded in the course workspace `docs/assignment-8/submission.md` after release.
- Mobile visual rendering remains unverified. Generated media is a PNG caption card, with full text retained in run details.

No course submission has been made.
