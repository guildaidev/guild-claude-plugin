# A first digest preview

Use this path for news, papers and other recurring summaries.

1. Ask what to cover and where the digest should go. Suggest a short format.
   Defer the schedule and time zone until release if they do not affect the preview.
2. Select one suitable source and a small sample. Use published integration tools.
   Do not benchmark feeds or tune a scoring system before the first preview.
3. Build a prompt-and-tools agent. Request source titles, dates and working links.
   Pass an explicit date range and time zone. Do not guess the current date.
   Keep the requested length. Remove duplicate stories and decode HTML entities.
4. Test on Guild with an explicit preview input. Return the digest in the session.
   Do not send email, post messages or create a schedule during the preview.
5. Show the actual result. Ask what to change. Add custom code only when required
   by the user or by an observed test failure.
6. After acceptance, agree on a real delivery test and a separate release.
   Report an external fetch or delivery failure without substituting invented results.
