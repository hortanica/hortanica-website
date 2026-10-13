#!/usr/bin/env python3
"""Build the site's citation-count data from the workbook's Citations tab.

Usage, from this folder after placing the current workbook under research/DHE_map:
  python build_site_citation_tracker.py \
     --workbook research/DHE_map/Research_Portfolio_System_Map.xlsx \
     --out research/citation-stats.json

Requires artifact_tool. The workbook's Shared source ID is the declared
cross-manuscript identity; no new bibliography matching is performed here.
"""
import argparse
import json
from collections import Counter
from pathlib import Path
from datetime import date
from artifact_tool import Blob, SpreadsheetFile

SLUGS = {
    'Boundary Theory': 'boundary-theory',
    'Containment': 'containment',
    'EndGame': 'endgame',
    'How Long Is a Thought?': 'how-long-is-a-thought',
    'Icarus': 'icarus',
    'Relevance': 'relevance',
    'Squirrel': 'squirrel',
    'Time': 'time',
    'You Are Here': 'you-are-here',
    'FuckYourFeelings': 'fuckyourfeelings',
    'PhoneWalletKeys': 'phonewalletkeys',
    'Pull': 'pull',
    'Push': 'push',
    'Weight': 'weight',
    'WhatchyaDoin': 'whatchyadoin',
    'FutureYou': 'futureyou',
}


def build(workbook: Path, output: Path):
    wb = SpreadsheetFile.import_xlsx(Blob.load(str(workbook)))
    rows = wb.worksheets.get_item('Citations').get_range('A1').get_current_region().values
    assert rows and rows[0][:8] == [
        'Phase', 'Originating paper', 'Reference #', 'Full citation',
        'DOI', 'Source URL', 'Shared source ID', 'Papers citing source'
    ], 'Citations sheet header changed; check the input schema.'
    data = [r for r in rows[1:] if r[1] and r[3]]
    counts = Counter(r[1] for r in data)
    if set(counts) != set(SLUGS):
        raise ValueError('Missing/extra portfolio papers: '+str(set(counts)^set(SLUGS)))
    missing_identity = [r for r in data if not r[6]]
    if missing_identity:
        raise ValueError(f'{len(missing_identity)} references have no Shared source ID')
    unique_ids = {str(r[6]).strip() for r in data}
    total = len(data)
    by_slug = {SLUGS[k]: v for k, v in sorted(counts.items())}
    result = {
        'schemaVersion': 1,
        'asOf': date.today().isoformat(),
        'source': 'research/DHE_map/Research_Portfolio_System_Map.xlsx — Citations',
        'method': 'One selected manuscript bibliography per portfolio paper. '
                  'Repeated works are kept in per-paper counts and total entries; '
                  'cross-paper uniqueness follows workbook Shared source ID.',
        'scopeNote': 'Referenced works include articles, books, chapters, standards and technical sources; not journal articles exclusively.',
        'totals': {
            'papers': len(counts),
            'referenceEntries': total,
            'uniqueWorks': len(unique_ids),
            'repeatEntries': total - len(unique_ids),
        },
        'byPaper': dict(sorted(counts.items())),
        'bySlug': by_slug,
    }
    if sum(counts.values()) != total:
        raise ValueError('Per-paper counts do not add up')
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')
    return result

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--workbook', type=Path, default=Path('research/DHE_map/Research_Portfolio_System_Map.xlsx'))
    p.add_argument('--out', type=Path, default=Path('research/citation-stats.json'))
    a=p.parse_args()
    result=build(a.workbook,a.out)
    print(result['totals'])
    print(result['byPaper'])
