# DHE Research System Map (prototype)

Published URL after this folder is uploaded to the GitHub Pages repository:
`https://hortanica.com/research/DHE_map/`

All prototype pages are self-contained in `research/DHE_map/`. Existing research/phase/paper pages are **not** changed.

## Source of truth

The primary workbook lives in OneDrive: `ChatGPT/Research_Portfolio_System_Map.xlsx`.
`Research_Portfolio_System_Map.xlsx` in this folder is a GitHub mirror for publishing the map.
The live webpage loads `research-map.json`, which is generated deterministically from the workbook's `Papers`, `Systems`, and `Connections` sheets.

To refresh data locally after copying the updated workbook into this directory:

```sh
python research/DHE_map/build_map.py research/DHE_map/Research_Portfolio_System_Map.xlsx
```

Commit the updated workbook and regenerated `research-map.json` to GitHub together. A GitHub Actions workflow can be added later to automate the regeneration whenever the workbook changes. No runtime server or database is required.

## Links

- Four phase nodes link to `/research/foundation/`, `/research/construction/`, `/research/action/`, and `/research/integration/`.
- Fourteen existing research papers link to their established landing-page URLs.
- `WhatchyaDoin` links to a manuscript-derived prototype paper page and is accurately marked **not submitted**. Its download links require the separate PDF files under `/papers/WhatchyaDoin/` on GitHub.
- `FutureYou` currently opens a prototype-only holding page because its manuscript PDF has not yet appeared in the OneDrive website papers folder.
- Every system links to `/research/DHE_map/systems/?system=<slug>`, a reusable page that lists its linked papers grouped by phase.

On desktop, pause the pointer over a **paper** or **system** for approximately 0.3 seconds to switch to a compact view of only its direct connections. Click any focused node to open its linked page. Use **Show full map** or **Escape** to return to the complete graph. Keyboard users may focus a paper/system link and press **Space** to open the compact connection view (Enter still follows the link).

On narrow screens, the graph is replaced with a phase/paper/system explorer because shrinking the 3-column diagram to mobile width makes the names illegible.

## Data note

The system map records **implicated systems according to the workbook**, not uniquely identified anatomical mechanisms or experimentally demonstrated causal effects.
