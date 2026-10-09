#!/usr/bin/env python3
"""Build static research-map.json from the Excel master (Python standard library only).

Usage: python research/DHE_map/build_map.py path/to/Research_Portfolio_System_Map.xlsx
"""
import argparse
import json
import re
import unicodedata
import zipfile
from collections import Counter
from pathlib import Path
from xml.etree import ElementTree as ET

XML = {'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
       'r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
       'p':'http://schemas.openxmlformats.org/package/2006/relationships'}

# Stable canonical URLs for all 16 paper detail pages.
PAPER_URLS = {
 'Boundary Theory':'/research/boundary-relative-state-time/',
 'Containment':'/research/grey-matter-containment/',
 'EndGame':'/research/representation-to-realization/',
 'How Long Is a Thought?':'/research/how-long-is-a-thought/',
 'Icarus':'/research/constrained-realization/',
 'Squirrel':'/research/task-initiation-failure/',
 'Time':'/research/boundary-relative-temporal-experience/',
 'You Are Here':'/research/bottleneck-relative-phenomenal-content/',
 'Relevance':'/research/historical-relevance-audit/',
 'Push':'/research/knowledge-handoffs-under-change/',
 'Pull':'/research/when-an-alternative-becomes-possible/',
 'PhoneWalletKeys':'/research/action-specific-history/',
 'FuckYourFeelings':'/research/emotional-reality-before-explanation/',
 'Weight':'/research/weight-same-words-different-consequence/',
 'WhatchyaDoin':'/research/whatchyadoin/',
 'FutureYou':'/research/futureyou/'
}
COLORS = {'Foundation':'#2F80ED', 'Construction':'#18B982',
          'Action':'#F2994A','Integration':'#9B51E0'}

def slugify(value):
    chars = unicodedata.normalize('NFKD',value).encode('ascii','ignore').decode('ascii').lower()
    return re.sub(r'-+','-',re.sub(r'[^a-z0-9]+','-',chars)).strip('-')

def excel_sheets(path):
    """Read textual/numeric workbook values from ordinary OOXML worksheet parts."""
    with zipfile.ZipFile(path) as z:
        shared=[]
        if 'xl/sharedStrings.xml' in z.namelist():
            root=ET.fromstring(z.read('xl/sharedStrings.xml'))
            for entry in root.findall('m:si',XML):
                shared.append(''.join(t.text or '' for t in entry.findall('.//m:t',XML)))
        workbook=ET.fromstring(z.read('xl/workbook.xml'))
        rels=ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        rel_by_id={r.attrib['Id']: r.attrib['Target'] for r in rels}
        result={}
        for sh in workbook.findall('m:sheets/m:sheet',XML):
            name=sh.attrib['name']
            relid=sh.attrib['{%s}id'%XML['r']]
            target=rel_by_id[relid].lstrip('/')
            member=target if target.startswith('xl/') else 'xl/'+target
            doc=ET.fromstring(z.read(member))
            data=[]
            for row in doc.findall('.//m:sheetData/m:row', XML):
                cols={}
                for cell in row.findall('m:c',XML):
                    ref=cell.attrib.get('r','')
                    letters=re.match(r'[A-Z]+',ref)
                    if not letters: continue
                    idx=0
                    for letter in letters.group(): idx=idx*26+ord(letter)-64
                    idx-=1
                    kind=cell.attrib.get('t','')
                    v=cell.find('m:v',XML)
                    inline=cell.find('m:is',XML)
                    if kind=='s' and v is not None and v.text is not None:
                        val=shared[int(v.text)]
                    elif kind=='inlineStr' and inline is not None:
                        val=''.join(t.text or '' for t in inline.findall('.//m:t',XML))
                    elif v is not None:
                        val=v.text or ''
                    else:
                        continue
                    cols[idx]=val
                if cols:
                    data.append([cols.get(i,'') for i in range(max(cols)+1)])
            result[name]=data
        return result

def value(row,n):
    return (row[n] if n < len(row) else '').strip()

def build(xlsx):
    sheets=excel_sheets(xlsx)
    for name in ('Papers','Systems','Connections'):
        if name not in sheets: raise ValueError(f'Missing sheet: {name}')
    def descriptions(sheet_name, expected_header):
        if sheet_name not in sheets:
            raise ValueError(f'Missing workbook description sheet: {sheet_name}')
        rows = sheets[sheet_name]
        if rows[0][:2] != expected_header:
            raise ValueError(f'Unexpected headers in {sheet_name}: {rows[0][:2]}')
        result={}
        for row in rows[1:]:
            key, content=value(row,0),value(row,1)
            if not key: continue
            if key in result: raise ValueError(f'Duplicate metadata name: {key}')
            result[key]=content
        return result
    phase_descriptions=descriptions('Phase Descriptions',['Phase','Human-centered subtitle'])
    paper_descriptions=descriptions('Paper Descriptions',['Paper','Short question or status'])
    system_descriptions=descriptions('System Descriptions',['System','Human-centered description'])
    paper_rows=sheets['Papers']
    assert paper_rows[0][:2]==['Paper','Phase'], 'Unexpected Papers headers'
    papers=[]
    paper_names=set()
    phase_count=Counter()
    for row in paper_rows[1:]:
        name,phase=value(row,0),value(row,1)
        if not name: continue
        if phase not in COLORS: raise ValueError(f'Invalid phase for {name}: {phase}')
        if name in paper_names: raise ValueError(f'Duplicate paper: {name}')
        paper_names.add(name)
        slug=slugify(name)
        url=PAPER_URLS.get(name, f'/research/DHE_map/papers/?paper={slug}')
        papers.append({'name':name,'slug':slug,'phase':phase,
                       'phaseOrder':int(value(row,2)), 'order':int(value(row,3)),
                       'url':url, 'detailPending':name not in PAPER_URLS,
                       'description':paper_descriptions.get(name,'Description pending.')})
        phase_count[phase]+=1
    papers.sort(key=lambda p:(p['phaseOrder'],p['order']))
    phase_rows=[{'name':phase, 'slug':phase.lower(), 'order':i+1, 'color':COLORS[phase],
                 'url':f'/research/{phase.lower()}/', 'paperCount':phase_count[phase],
                 'description':phase_descriptions.get(phase,'')}
                for i,phase in enumerate(COLORS)]
    systems=[]
    sys_names=set()
    for row in sheets['Systems'][1:]:
        name=value(row,0)
        if not name: continue
        if name in sys_names: raise ValueError(f'Duplicate system: {name}')
        sys_names.add(name)
        slug=slugify(name)
        systems.append({'name':name,'slug':slug,'count':int(value(row,1)),
                        'coverage':value(row,2), 'description':system_descriptions.get(name,''),
                        'url':f'/research/DHE_map/systems/?system={slug}'})
    if len({s['slug'] for s in systems})!=len(systems): raise ValueError('System slug collision')
    for title,lookup,names in [('Phase',phase_descriptions,set(COLORS)),('Paper',paper_descriptions,paper_names),('System',system_descriptions,sys_names)]:
        for unknown in set(lookup)-names:
            raise ValueError(f'Orphan description in {title}: {unknown}')
        for missing in names-set(lookup):
            print(f'Note: {title} description pending for {missing}')
    edges=[]
    unique=set()
    for row in sheets['Connections'][1:]:
        phase,paper,system,edgeid=(value(row,i) for i in range(4))
        if not paper: continue
        if paper not in paper_names or system not in sys_names:
            raise ValueError(f'Unknown paper/system: {paper} / {system}')
        known_phase=next(p['phase'] for p in papers if p['name']==paper)
        if known_phase!=phase: raise ValueError(f'Phase disagreement: {paper}')
        if (paper,system) in unique: raise ValueError(f'Duplicate connection: {paper} > {system}')
        unique.add((paper,system))
        edges.append({'phase':phase,'paper':paper,'system':system,'id':edgeid})
    counts=Counter(edge['system'] for edge in edges)
    for s in systems:
        if s['count']!=counts[s['name']]:
            raise ValueError(f'Count mismatch: {s["name"]} ({s["count"]} != {counts[s["name"]]})')
    counts=Counter(edge['paper'] for edge in edges)
    for p,row in zip(papers,sorted(paper_rows[1:],key=lambda r:int(value(r,3)))):
        expected=int(value(row,4))
        if counts[p['name']]!=expected:
            raise ValueError(f'Paper count mismatch: {p["name"]} ({counts[p["name"]]} != {expected})')
    return {'schemaVersion':2, 'source':'Research_Portfolio_System_Map.xlsx',
            'note':'Mapped associations, not unique anatomical localization or demonstrated causal attribution.',
            'counts':{'phases':len(phase_rows),'papers':len(papers),'systems':len(systems),'connections':len(edges)},
            'phases':phase_rows,'papers':papers,'systems':systems,'edges':edges}

if __name__=='__main__':
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('workbook',type=Path)
    ap.add_argument('--output',type=Path,default=Path(__file__).with_name('research-map.json'))
    opts=ap.parse_args()
    data=build(opts.workbook)
    opts.output.parent.mkdir(parents=True,exist_ok=True)
    opts.output.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f"Generated {opts.output}: {data['counts']}")
