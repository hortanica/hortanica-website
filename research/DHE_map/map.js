'use strict';
(() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const $ = (id) => document.getElementById(id);
  const canvas = $('diagram-canvas');
  const query = $('map-search');
  const reset = $('map-reset');
  const feedback = $('diagram-feedback');
  const showAllButton = $('map-show-all');
  const guide = $('diagram-guide-text');
  let graph = null;
  let matches = [];
  let currentFocus = null;
  let focusedView = false;
  let previousScrollY = null;

  function svg(tag, attrs = {}, text) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [key, val] of Object.entries(attrs)) el.setAttribute(key, String(val));
    if (text !== undefined) el.textContent = String(text);
    return el;
  }
  const textNode = (tag, content, className) => {
    const el = document.createElement(tag);
    el.textContent = content;
    if (className) el.className = className;
    return el;
  };
  function color(phase) {
    return graph.phases.find(x => x.name === phase)?.color || '#888';
  }

  function setFocus(selected) {
    currentFocus = selected;
    const allNodes = canvas.querySelectorAll('.map-node');
    const edges = canvas.querySelectorAll('.edge');
    const papers = new Set();
    const phases = new Set();
    const systems = new Set();
    if (selected) {
      if (selected.type === 'phase') {
        phases.add(selected.id);
        graph.papers.filter(p => p.phase === selected.id).forEach(p => papers.add(p.name));
      } else if (selected.type === 'paper') {
        papers.add(selected.id);
        const p = graph.papers.find(p => p.name === selected.id);
        if (p) phases.add(p.phase);
      } else if (selected.type === 'system') {
        systems.add(selected.id);
        graph.edges.filter(e => e.system === selected.id).forEach(e => {
          papers.add(e.paper);
          phases.add(e.phase);
        });
      }
      for (const e of graph.edges) if (papers.has(e.paper)) systems.add(e.system);
    }
    const dim = Boolean(selected);
    allNodes.forEach(n => {
      const type = n.dataset.type, id = n.dataset.id;
      const highlighted = type === 'phase' ? phases.has(id) : type === 'paper' ? papers.has(id) : systems.has(id);
      n.classList.toggle('dimmed', dim && !highlighted);
      n.classList.toggle('emphasized', dim && highlighted);
    });
    edges.forEach(e => {
      const highlight = e.dataset.kind === 'phase'
        ? (selected?.type === 'system'
            ? graph.edges.some(x => x.system === selected.id && x.paper === e.dataset.paper)
            : papers.has(e.dataset.paper))
        : (selected?.type === 'system' ? e.dataset.system === selected.id
           : selected?.type === 'paper' ? e.dataset.paper === selected.id
           : papers.has(e.dataset.paper));
      e.classList.toggle('dimmed', dim && !highlight);
      e.classList.toggle('emphasized', dim && highlight);
    });
    if (!selected) feedback.textContent = 'Every label is a link to its corresponding page.';
    else if (selected.type === 'phase') feedback.textContent = `${selected.id}: ${papers.size} connected paper${papers.size === 1 ? '' : 's'}. Select to open the phase page.`;
    else if (selected.type === 'paper') feedback.textContent = `${selected.id}: ${graph.edges.filter(e => e.paper === selected.id).length} mapped systems. Select to open the paper page.`;
    else feedback.textContent = `${selected.id}: ${graph.edges.filter(e => e.system === selected.id).length} connected papers. Select to open the system page.`;
  }

  function drawNode(parent, {x,y,w,h,type,id,url,label,fill,stroke,small=false,count=null}) {
    const a = svg('a',{href:url, 'aria-label':`${type}: ${label}`,class:'map-node'});
    a.dataset.type=type;
    a.dataset.id=id;
    a.appendChild(svg('rect',{x,y,width:w,height:h,rx:3,fill,stroke,class:'node-rect'}));
    a.appendChild(svg('text',{x:x+w/2-(count===null?0:14),y:y+h/2+1,class:'node-label'+(small?' system-label':'')},label));
    if (count !== null) a.appendChild(svg('text',{x:x+w-15,y:y+h/2+1,'text-anchor':'end',class:'node-label system-count'},`[${count}]`));
    a.appendChild(svg('title',{},`${label} — open page`));
    let hoverTimer = null;
    a.addEventListener('pointerenter',() => {
      if (focusedView) return;
      setFocus({type,id});
      if (type === 'paper' || type === 'system') {
        hoverTimer = window.setTimeout(() => {
          hoverTimer = null;
          enterFocusedView({type,id});
        }, 280);
      }
    });
    a.addEventListener('pointerleave',() => {
      if (hoverTimer !== null) window.clearTimeout(hoverTimer);
      hoverTimer = null;
      if (!focusedView) setFocus(null);
    });
    a.addEventListener('focus',() => { if (!focusedView) setFocus({type,id}); });
    a.addEventListener('blur',() => { if (!focusedView) setFocus(null); });
    a.addEventListener('keydown',(event) => {
      if (event.key === ' ' && !focusedView && (type==='paper' || type==='system')) {
        event.preventDefault();
        enterFocusedView({type,id});
      }
    });
    parent.appendChild(a);
  }

  function renderMap() {
    const phaseGroups = graph.phases.map(phase => ({
      ...phase, papers: graph.papers.filter(p => p.phase === phase.name)
    }));
    const yPaper = new Map();
    let y = 140;
    phaseGroups.forEach(g => {
      g.papers.forEach(p => { yPaper.set(p.name,y); y+=63; });
      y+=102;
    });
    const paperEnd = y - 100;
    const lastSystem = 140 + (graph.systems.length-1)*33;
    const height = Math.max(1740,paperEnd+110,lastSystem+110);
    const out = svg('svg',{viewBox:`0 0 1490 ${height}`,role:'img','aria-label':'Linked phase, research paper, and brain/body system diagram'});
    out.appendChild(svg('title',{},'Research System Map: clickable phases, papers, and brain and body systems'));
    [['Phases',170],['Papers',580],['Systems',1215]].forEach(([t,x]) => out.appendChild(svg('text',{x,y:42,class:'column-label'},t)));
    [['PROGRAM',170],['RESEARCH ARTICLES',580],['BRAIN & BODY SYSTEMS',1215]].forEach(([t,x]) => out.appendChild(svg('text',{x,y:63,class:'column-sub'},t)));
    const edges = svg('g',{'aria-hidden':'true'});
    const nodes = svg('g');
    const py = new Map(), paperPhase = new Map();
    for (const group of phaseGroups) {
      const ys = group.papers.map(p=>yPaper.get(p.name));
      const center = ys.length ? (ys[0]+ys.at(-1))/2 : 120;
      for (const p of group.papers) {
        paperPhase.set(p.name,group.name);
        py.set(p.name,yPaper.get(p.name));
        const a = svg('path',{d:`M 270 ${center} C 335 ${center}, 353 ${yPaper.get(p.name)}, 450 ${yPaper.get(p.name)}`,
          stroke:color(group.name),class:'edge phase-edge'});
        a.dataset.kind='phase'; a.dataset.paper=p.name; edges.appendChild(a);
      }
      drawNode(nodes,{x:58,y:center-19,w:212,h:38,type:'phase',id:group.name,
        url:group.url,label:group.name,fill:group.color+'24',stroke:group.color});
    }
    const systemYs=new Map();
    graph.systems.forEach((s,i)=>systemYs.set(s.name,140+i*33));
    graph.edges.forEach(e => {
      const y1=py.get(e.paper),y2=systemYs.get(e.system);
      const path=svg('path',{d:`M 715 ${y1} C 845 ${y1}, 895 ${y2}, 1008 ${y2}`,
        stroke:color(e.phase),class:'edge system-edge'});
      path.dataset.kind='system'; path.dataset.paper=e.paper;
      path.dataset.system=e.system; edges.appendChild(path);
    });
    graph.papers.forEach(p => drawNode(nodes,{x:450,y:py.get(p.name)-15,w:265,h:30,type:'paper',id:p.name,
       url:p.url,label:p.name,fill:color(p.phase)+'23',stroke:color(p.phase)}));
    graph.systems.forEach(s=>drawNode(nodes,{x:1008,y:systemYs.get(s.name)-12,w:436,h:24,
        type:'system',id:s.name,url:s.url,label:s.name,fill:'#f7f7f7',stroke:'#a8adb5',small:true,count:s.count}));
    out.append(edges,nodes);
    canvas.replaceChildren(out);
    if (graph.systems.some(s=>s.name.length>52)) console.warn('Very long system labels may need resizing');
  }

  // Focus keeps one node and its immediate neighborhood together in a compact map.
  // The original full diagram can be restored at any time without changing links or source data.
  function enterFocusedView(selected) {
    if (focusedView || !graph) return;
    focusedView = true;
    previousScrollY = window.scrollY;
    currentFocus = selected;
    const phaseX = 35, phaseW = 194, paperX = 334, paperW = 286;
    const systemX = 778, systemW = 307;
    const output = svg('svg',{
      viewBox:'0 0 1120 480', role:'img',
      'aria-label':`Focused connections for ${selected.id}`
    });
    const edges = svg('g',{'aria-hidden':'true'}), nodes=svg('g');
    const columnHeader = (label,x) => output.appendChild(svg('text',{x,y:42,class:'column-label'},label));
    columnHeader('Phases',phaseX+phaseW/2);
    columnHeader('Papers',paperX+paperW/2);
    columnHeader('Systems',systemX+systemW/2);

    const phaseEdge = (p,phaseY,paperY) => {
      edges.appendChild(svg('path',{
        d:`M ${phaseX+phaseW} ${phaseY} C 272 ${phaseY}, 287 ${paperY}, ${paperX} ${paperY}`,
        stroke:color(p.phase),class:'edge phase-edge'
      }));
    };
    const systemEdge = (p,paperY,systemY) => {
      edges.appendChild(svg('path',{
        d:`M ${paperX+paperW} ${paperY} C 694 ${paperY}, 711 ${systemY}, ${systemX} ${systemY}`,
        stroke:color(p.phase),class:'edge system-edge'
      }));
    };

    let height;
    if (selected.type === 'system') {
      const linked = new Set(graph.edges.filter(e=>e.system===selected.id).map(e=>e.paper));
      const papers = graph.papers.filter(p=>linked.has(p.name));
      const grouped = graph.phases.map(phase=>({phase, papers:papers.filter(p=>p.phase===phase.name)}))
        .filter(g=>g.papers.length);
      const paperY=new Map(), phaseY=new Map();
      let y=110;
      for (const g of grouped) {
        const first=y;
        g.papers.forEach(p=>{paperY.set(p.name,y); y+=36;});
        phaseY.set(g.phase.name,(first+y-36)/2);
        y+=16;
      }
      const coords=[...paperY.values()];
      const center=coords.length?(coords[0]+coords.at(-1))/2:190;
      height=Math.max(220,y+30);
      for (const g of grouped) {
        const yc=phaseY.get(g.phase.name);
        drawNode(nodes,{x:phaseX,y:yc-19,w:phaseW,h:38,type:'phase',id:g.phase.name,
          url:g.phase.url,label:g.phase.name,fill:g.phase.color+'24',stroke:g.phase.color});
        for (const p of g.papers) {
          const py=paperY.get(p.name);
          phaseEdge(p,yc,py); systemEdge(p,py,center);
          drawNode(nodes,{x:paperX,y:py-16,w:paperW,h:32,type:'paper',id:p.name,
            url:p.url,label:p.name,fill:color(p.phase)+'23',stroke:color(p.phase)});
        }
      }
      const sys=graph.systems.find(x=>x.name===selected.id);
      drawNode(nodes,{x:systemX,y:center-18,w:systemW,h:36,type:'system',id:sys.name,
        url:sys.url,label:sys.name,fill:'#f2f4f2',stroke:'#79887e',small:true,count:sys.count});
      feedback.textContent=`${sys.name}: ${papers.length} connected paper${papers.length===1?'':'s'}. Select any label to open its page; choose “Show full map” to return.`;
    } else {
      const paper=graph.papers.find(p=>p.name===selected.id);
      if (!paper) { focusedView=false;return; }
      const phase=graph.phases.find(x=>x.name===paper.phase);
      const linked = new Set(graph.edges.filter(e=>e.paper===paper.name).map(e=>e.system));
      const systems = graph.systems.filter(s=>linked.has(s.name));
      const initial=105, step=27;
      const end=initial+(Math.max(1,systems.length)-1)*step;
      const center=(initial+end)/2;
      height=Math.max(235,end+65);
      drawNode(nodes,{x:phaseX,y:center-19,w:phaseW,h:38,type:'phase',id:phase.name,
        url:phase.url,label:phase.name,fill:phase.color+'24',stroke:phase.color});
      drawNode(nodes,{x:paperX,y:center-17,w:paperW,h:34,type:'paper',id:paper.name,
        url:paper.url,label:paper.name,fill:phase.color+'23',stroke:phase.color});
      phaseEdge(paper,center,center);
      systems.forEach((sys,i)=>{
        const sy=initial+i*step;
        systemEdge(paper,center,sy);
        drawNode(nodes,{x:systemX,y:sy-12,w:systemW,h:24,type:'system',id:sys.name,
          url:sys.url,label:sys.name,fill:'#f2f4f2',stroke:'#79887e',small:true,count:sys.count});
      });
      if (!systems.length) nodes.appendChild(svg('text',{
        x:systemX+systemW/2,y:center,class:'focus-no-systems'
      },'No systems assigned in the workbook'));
      feedback.textContent=`${paper.name}: ${systems.length} mapped system${systems.length===1?'':'s'}. Select any label to open its page; choose “Show full map” to return.`;
    }
    output.setAttribute('viewBox',`0 0 1120 ${height}`);
    output.append(edges,nodes);
    canvas.classList.add('focused');
    canvas.replaceChildren(output);
    showAllButton.hidden=false;
    guide.textContent=`Focused connections: ${selected.id}`;
    // The triggering node may be below the fold in the full map. Bring the compact
    // view into the viewport so the system and paper columns are visible together.
    const top=window.scrollY+canvas.getBoundingClientRect().top-80;
    window.scrollTo({top:Math.max(0,top),behavior:'auto'});
  }

  function restoreFullMap() {
    if (!focusedView || !graph) return;
    focusedView=false;
    currentFocus=null;
    canvas.classList.remove('focused');
    showAllButton.hidden=true;
    guide.textContent='Hover over a paper or system to isolate its connections.';
    renderMap();
    setFocus(null);
    if (previousScrollY!==null) window.scrollTo({top:previousScrollY,behavior:'auto'});
    previousScrollY=null;
  }
  showAllButton.addEventListener('click',restoreFullMap);
  document.addEventListener('keydown', event => {
    if (event.key==='Escape' && focusedView) restoreFullMap();
  });

  function renderMobile() {
    const holder=$('mobile-phases');
    for(const phase of graph.phases) {
      const detail=document.createElement('details'); detail.className='mobile-phase';
      if (phase.name==='Construction') detail.open=true;
      const sum=textNode('summary',`${phase.name} — ${graph.papers.filter(p=>p.phase===phase.name).length} papers`);
      detail.append(sum);
      const phaseLink=textNode('a',`Open ${phase.name} phase →`,'phase-open');phaseLink.href=phase.url;detail.append(phaseLink);
      for(const paper of graph.papers.filter(p=>p.phase===phase.name)) {
        const pd=document.createElement('details');pd.className='mobile-paper';
        pd.dataset.search=[paper.name,...graph.edges.filter(e=>e.paper===paper.name).map(e=>e.system)].join(' ').toLowerCase();
        const sm=document.createElement('summary');sm.append(textNode('strong',paper.name));pd.append(sm);
        const link=textNode('a',paper.detailPending?'View current paper listing →':'Open paper page →','paper-open');link.href=paper.url;pd.append(link);
        const systems=document.createElement('div');systems.className='system-row';
        const names=new Set(graph.edges.filter(e=>e.paper===paper.name).map(e=>e.system));
        if (!names.size) systems.append(textNode('span','No anatomical systems assigned in the workbook.'));
        [...names].sort().forEach(name=>{
          const sys=graph.systems.find(s=>s.name===name);
          const item=textNode('a',name);item.href=sys.url;systems.append(item);
        });
        pd.append(systems);detail.append(pd);
      }
      holder.append(detail);
    }
    const directory=$('mobile-systems');directory.className='mobile-systems-grid';
    for(const s of graph.systems) {
      const link=document.createElement('a');link.href=s.url;link.dataset.search=s.name.toLowerCase();
      link.append(document.createTextNode(s.name),textNode('span',String(s.count)));
      directory.append(link);
    }
  }

  function applySearch() {
    if (focusedView) restoreFullMap();
    const term=query.value.trim().toLowerCase();
    const nodes=canvas.querySelectorAll('.map-node');
    if (!term) { setFocus(null); nodes.forEach(n=>n.classList.remove('dimmed','emphasized')); }
    else {
      matches=graph.papers.filter(p=>p.name.toLowerCase().includes(term)).map(p=>({type:'paper',id:p.name}))
        .concat(graph.systems.filter(s=>s.name.toLowerCase().includes(term)).map(s=>({type:'system',id:s.name})))
        .concat(graph.phases.filter(p=>p.name.toLowerCase().includes(term)).map(p=>({type:'phase',id:p.name})));
      if(matches.length===1) setFocus(matches[0]);
      else {
        setFocus(null);
        nodes.forEach(n=>{
          const hit=n.dataset.id.toLowerCase().includes(term);
          n.classList.toggle('dimmed',!hit);
          n.classList.toggle('emphasized',hit);
        });
        feedback.textContent=`${matches.length} matching items. Select any item to open its page.`;
      }
    }
    document.querySelectorAll('.mobile-paper').forEach(p=>{
      const hit=p.dataset.search.includes(term);
      p.hidden=Boolean(term&&!hit);
      if(term&&hit) p.open=true;
    });
    document.querySelectorAll('.mobile-phase').forEach(p=>{
      const visible=[...p.querySelectorAll('.mobile-paper')].some(x=>!x.hidden);
      p.hidden=Boolean(term&&!visible&&!p.querySelector('summary').textContent.toLowerCase().includes(term));
      if(term&&visible) p.open=true;
    });
    document.querySelectorAll('.mobile-systems-grid a').forEach(a=>a.hidden=Boolean(term&&!a.dataset.search.includes(term)));
  }
  query.addEventListener('input',applySearch);
  reset.addEventListener('click',()=>{query.value=''; applySearch();query.focus();});
  fetch('research-map.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error(`${r.status} ${r.statusText}`);return r.json();})
    .then(data=>{
      if(!Array.isArray(data.phases)||!Array.isArray(data.papers)||!Array.isArray(data.systems)||!Array.isArray(data.edges)) throw new Error('Unexpected map data format');
      graph=data;
      $('map-counts').textContent=`${data.counts.phases} phases · ${data.counts.papers} papers · ${data.counts.systems} systems · ${data.counts.connections} paper–system connections`;
      renderMap();renderMobile();
    })
    .catch(err=>{canvas.replaceChildren(textNode('p','The map data could not be loaded. Recheck the JSON file and deploy the complete DHE_map folder.'));$('map-counts').textContent=`Data unavailable: ${err.message}`;});
})();
