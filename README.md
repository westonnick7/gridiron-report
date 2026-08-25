# Gridiron Report — automated pipeline

Same pattern as the baseball dashboard: nightly data pull (GitHub Actions) → committed
JSON → live dashboard (GitHub Pages). Once set up, nothing needs to run on your own
computer.

## What's in here

```
gridiron-report-automated/
├── scripts/pull_nfl_data.py      # nfl_data_py puller — writes data/gridiron_report_data.json
├── data/                         # nightly job commits its output here
├── .github/workflows/
│   ├── pull-data.yml             # runs pull_nfl_data.py on a schedule, commits the result
│   └── deploy.yml                # builds web/ and publishes it to GitHub Pages on every push
└── web/                          # the React dashboard (Vite project)
```

## Read this first: what's real vs. approximated

`scripts/pull_nfl_data.py` has a long docstring at the top spelling out exactly which
stats come from real public data (team records, EPA, CPOE, injuries, schedules, player
props — all real) and which ones simply aren't publicly available anywhere for free
(pressure-to-sack%, broken tackle%, yards/route run, coverage grade, time of possession,
pace, upcoming-game weather forecasts). Those come back as `null` and the dashboard
already renders "—" for them — that's expected, not a bug. If you need those specific
numbers, they generally require a paid data source (PFF, SIS, a weather API with a key).

## One-time setup (about 10 minutes)

1. **Create a GitHub repo** (public, for the free GitHub Pages tier) — e.g. `gridiron-report`.

2. **Push this project to it.**
   ```
   cd gridiron-report-automated
   git init
   git add .
   git commit -m "Initial scaffold"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/gridiron-report.git
   git push -u origin main
   ```

3. **Edit the season/week/teams you want tracked.**
   Open `scripts/pull_nfl_data.py`, edit `SEASON`, `WEEK`, and `TEAMS` near the top.
   `TEAMS` currently matches the dashboard's 10-team demo subset — expand it to all 32
   team codes if you want full league coverage (the schedule builder will then show
   every real game for that week instead of just games between your subset).

4. **Point the dashboard at your repo.**
   Open `web/src/App.jsx`, find `LIVE_DATA_URL` near the top, replace
   `YOUR_GITHUB_USERNAME` with your GitHub username (and `gridiron-report` if you
   named the repo differently). Also update `base: "/gridiron-report/"` in
   `web/vite.config.js` to match.

5. **Turn on GitHub Pages.** Repo → Settings → Pages → Source → "GitHub Actions".

6. **Seed the data file.**
   `pip install nfl_data_py pandas numpy`, then `python scripts/pull_nfl_data.py`
   from the repo root, then commit the resulting `data/gridiron_report_data.json`.
   After this, the nightly job keeps it fresh automatically. Fair warning: the first
   run pulls a full season of play-by-play and can take a few minutes.

7. **Push again** to trigger the deploy workflow. Your dashboard will be live at
   `https://YOUR_USERNAME.github.io/gridiron-report/`.

## How the automation runs from here

- Nightly at 6am ET, GitHub's servers run `pull_nfl_data.py` and commit fresh data —
  your computer doesn't need to be on.
- Every repo change (including that nightly commit) triggers a rebuild/redeploy.
- The dashboard fetches the live JSON on every page load, with a manual "Refresh"
  button in the header too.
- If a nightly pull fails (nflverse changes a column name, a team code doesn't match,
  etc.), the site keeps showing the last successful data — check the Actions tab for
  the error.

## Local development

```
cd web
npm install
npm run dev
```

## Adjusting the schedule

Edit the `cron` line in `.github/workflows/pull-data.yml` (UTC time). NFL data
typically finalizes results by early Tuesday morning ET after Monday Night Football,
so if you want fully-settled prior-week results reflected, a pull time later on
Tuesday may be more reliable than a strict nightly 6am run during the season.
