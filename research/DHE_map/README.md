# DHE Research System Map — interactive prototype

Public URL after uploading the folder to the website's GitHub Pages repository:
`https://hortanica.com/research/DHE_map/`

This self-contained prototype lives entirely under `research/DHE_map/`. Phase 3 (Action) and Phase 4 (Integration) index pages now link to the two new paper pages; older existing paper pages are unchanged.

## Workbook is the master

OneDrive master: `ChatGPT/Research_Portfolio_System_Map.xlsx`.
The copy in this folder is for website deployment and should remain in sync with that master.

The workbook's **Papers**, **Systems**, and **Connections** sheets determine the phase/paper/system relationships. Three additional sheets hold the user-facing descriptions:

- **Phase Descriptions** — phase subtitles from the existing Research overview.
- **Paper Descriptions** — short questions from the existing Research phase pages for 14 established papers; WhatchyaDoin and FutureYou use short manuscript-derived questions; both manuscripts and human-readable companions are available.
- **System Descriptions** — the 46 reviewed, human-centered system descriptions.

The website reads `research-map.json`, generated from the workbook. Regenerate after editing the Excel master:

```sh
python research/DHE_map/build_map.py research/DHE_map/Research_Portfolio_System_Map.xlsx
```

Commit the updated workbook, generated JSON, and any modified HTML/CSS/JavaScript together. GitHub Actions automatic regeneration is not yet installed.

## Website phase alignment (9 October 2026)

Phase membership and order follow the Research phase pages, not the original chart:

- **Phase 1 — Foundation (6):** Boundary Theory, Relevance, EndGame, Containment, How Long Is a Thought?, Time.
- **Phase 2 — Construction (8):** Icarus, You Are Here, Squirrel, FuckYourFeelings, PhoneWalletKeys, Pull, Weight, Push.
- **Phase 3 — Action (1):** WhatchyaDoin.
- **Phase 4 — Integration (1):** FutureYou.

The paper-to-system edge set, persistent edge IDs, system descriptions, paper-page URLs, and totals are unchanged (16 papers, 46 systems, 134 edges). The Excel **Papers**, **Connections**, **Matrix**, **Systems**, **Coverage**, **Overview**, and **Paper Descriptions** sheets were synchronized before generating `research-map.json`.

## Interactive diagram

**Desktop**: In the full map, click a phase, paper, or system to enter focused mode. Initial **Layer 0** shows direct paper–system connections. Adjust the **Connection depth** slider to Layers 1–4; each additional layer traverses one more paper-to-system or system-to-paper hop. Associated phases are always shown for visible papers.

- In focused mode, click any phase, paper, or system **label to open its page**.
- Click **outside a label and depth-control area** to remove the filter and return to the full diagram. **Show full map** and **Escape** also reset the filter.
- Selecting a new starting node requires returning to the full map first, then clicking the new node.
- Hovering may dim unrelated connections for inspection, but no longer triggers collapse.
- With this densely connected portfolio, one or two extra layers may expose most of the network. Deep layers can exceed the window's height.

**Mobile/narrow windows**: The diagram is replaced with the phase/paper/system text explorer. Phase numbers, phase subtitles, paper questions, and the 46 human-centered system descriptions remain visible without horizontal scrolling. The system directory includes searchable descriptions; selecting a system shows associated papers grouped by phase, with their research questions.

## Links and status

- Phase links lead to the four established website phase pages. The workbook and the existing Research phase pages now use the same assignments: Foundation 6 papers, Construction 8, Action 1, and Integration 1.
- All 16 research papers link to their paper-detail pages under `/research/`.
- WhatchyaDoin and FutureYou have new dedicated paper pages, each with manuscript and companion downloads, marked **To be submitted**.
- The older WhatchyaDoin prototype page redirects to its canonical paper page.
- All 46 system detail links use `research/DHE_map/systems/?system=<slug>`.

Associations are **implicated systems in the mapping**, not claims of unique anatomical localization or demonstrated causal attribution. Human-centered subtitles are illustrative functional summaries, not exclusive roles.
