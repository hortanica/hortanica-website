'use strict';
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const $ = id => document.getElementById(id);
  const canvas=$('diagram-canvas'), query=$('map-search');
  const feedback=$('diagram-feedback'), guide=$('diagram-guide-text');
  const showAll=$('map-show-all'), depthInput=$('map-depth');
  const depthLabel=$('map-depth-value'), depthRow=$('map-depth-row');
  // The diagram remains the default at every viewport width. Under 1100px,
  // visitors can switch to the existing text explorer without losing map focus.
  const mapPage=document.querySelector('.map-page');
  const diagramView=$('map-view-diagram'), explorerView=$('map-view-explorer');
  function setMobileView(view){
    mapPage.dataset.mobileView=view;
    diagramView.setAttribute('aria-pressed',String(view==='diagram'));
    explorerView.setAttribute('aria-pressed',String(view==='explorer'));
    diagramView.classList.toggle('active',view==='diagram');
    explorerView.classList.toggle('active',view==='explorer');
  }
  setMobileView('diagram');
  diagramView.addEventListener('click',()=>setMobileView('diagram'));
  explorerView.addEventListener('click',()=>setMobileView('explorer'));
  function keepFocusedNodeVisible(){
    const selected=canvas.querySelector('.selected-root');
    if(!selected || canvas.scrollWidth<=canvas.clientWidth)return;
    const viewport=canvas.getBoundingClientRect(), item=selected.getBoundingClientRect();
    const inset=18;
    if(item.left<viewport.left+inset)canvas.scrollLeft-=viewport.left+inset-item.left;
    else if(item.right>viewport.right-inset)canvas.scrollLeft+=item.right-viewport.right+inset;
  }
  let data=null, root=null, previousScroll=null;
  const make=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined) el.textContent=text;if(cls)el.className=cls;return el;};
  const S=(tag,attrs={},text)=>{const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));if(text!==undefined)el.textContent=String(text);return el;};
  const color=phase=>data.phases.find(p=>p.name===phase)?.color||'#89928c';
  const phaseLabel=phase=>`Phase ${phase.order}: ${phase.name}`;
  const depthDescription=[
    'Directly connected systems or papers.',
    'Also show papers or systems sharing those connections.',
    'Expand one more step through shared relationships.',
    'Continue expanding the connected research network.',
    'Show a wider connected network (up to five hops).'
  ];
  const pad=n=>String(n).padStart(2,'0');

  function focusHover(selected){
    if(root) return;
    const papers=new Set(), systems=new Set(), phases=new Set();
    if(selected){
      if(selected.type==='paper') papers.add(selected.id);
      if(selected.type==='system') systems.add(selected.id);
      if(selected.type==='phase') data.papers.filter(p=>p.phase===selected.id).forEach(p=>papers.add(p.name));
      for(const e of data.edges){
        if(papers.has(e.paper)) systems.add(e.system);
        if(selected.type==='system'&&e.system===selected.id) papers.add(e.paper);
      }
      for(const p of data.papers) if(papers.has(p.name)) phases.add(p.phase);
    }
    canvas.querySelectorAll('.map-node').forEach(n=>{
      const active=n.dataset.type==='phase'?phases.has(n.dataset.id):n.dataset.type==='paper'?papers.has(n.dataset.id):systems.has(n.dataset.id);
      n.classList.toggle('dimmed',!!selected&&!active);
      n.classList.toggle('emphasized',!!selected&&active);
    });
    canvas.querySelectorAll('.edge').forEach(e=>{
      const active=e.dataset.kind==='phase' ? papers.has(e.dataset.paper) :
        (selected?.type==='system'?e.dataset.system===selected.id:papers.has(e.dataset.paper));
      e.classList.toggle('dimmed',!!selected&&!active);
      e.classList.toggle('emphasized',!!selected&&active);
    });
  }

  function node(parent,{x,y,w,h,type,id,label,url,fill,stroke,count,selected=false}){
    const actionText=selected?'Click again to open page':root?'Click to make this your focus':'Click to explore connections';
    const a=S('a',{href:url,'aria-label':`${label}. ${actionText}`,class:`map-node${selected?' selected-root':''}`});
    a.dataset.type=type;a.dataset.id=id;
    a.appendChild(S('rect',{x,y,width:w,height:h,rx:4,fill,stroke,class:'node-rect'}));
    a.appendChild(S('text',{x:x+w/2-(count===undefined?0:15),y:y+h/2+1,class:`node-label${type==='system'?' system-label':''}`},label));
    if(count!==undefined)a.appendChild(S('text',{x:x+w-12,y:y+h/2+1,'text-anchor':'end',class:'node-label system-count'},`[${count}]`));
    const description=type==='phase'?data.phases.find(p=>p.name===id)?.description:type==='paper'?data.papers.find(p=>p.name===id)?.description:data.systems.find(s=>s.name===id)?.description;
    a.appendChild(S('title',{},`${label}\n${description||''}\n${actionText}`));
    a.addEventListener('click',event=>{
      // Only the currently highlighted node navigates. Any other visible node
      // becomes the focus; its next click opens the corresponding page.
      if(root?.type===type && root.id===id) return;
      event.preventDefault();
      enterFocus({type,id},a);
    });
    a.addEventListener('pointerenter',()=>{if(!root)focusHover({type,id});});
    a.addEventListener('pointerleave',()=>{if(!root)focusHover(null);});
    a.addEventListener('focus',()=>{if(!root)focusHover({type,id});});
    a.addEventListener('blur',()=>{if(!root)focusHover(null);});
    a.addEventListener('keydown',event=>{
      if(event.key===' '){
        event.preventDefault();
        if(root?.type===type&&root.id===id) window.location.assign(url);
        else enterFocus({type,id},a);
      }
    });
    parent.appendChild(a);
  }
  function phaseNode(group,grpY,edges,nodes,focused=false){
    const x=focused?30:55,w=focused?200:220,h=38;
    node(nodes,{x,y:grpY-h/2,w,h,type:'phase',id:group.name,label:phaseLabel(group),url:group.url,
      fill:group.color+'24',stroke:group.color,selected:root?.type==='phase'&&root.id===group.name});
    return x+w;
  }
  function path(parent,{x1,y1,x2,y2,stroke,kind,paper,system}){
    const curve=(x2-x1)*0.38;
    const e=S('path',{d:`M ${x1} ${y1} C ${x1+curve} ${y1}, ${x2-curve} ${y2}, ${x2} ${y2}`,
      stroke,class:`edge ${kind==='phase'?'phase-edge':'system-edge'}`});
    e.dataset.kind=kind;e.dataset.paper=paper;if(system)e.dataset.system=system;parent.appendChild(e);
  }

  function renderAll(){
    const groups=data.phases.map(phase=>({...phase,papers:data.papers.filter(p=>p.phase===phase.name)}));
    const paperY=new Map();let y=130;
    groups.forEach(g=>{g.papers.forEach(p=>{paperY.set(p.name,y);y+=62;});y+=105;});
    const systemsY=new Map();data.systems.forEach((sys,i)=>systemsY.set(sys.name,132+i*33));
    const height=Math.max(1710,y+40,Math.max(...systemsY.values())+66);
    const output=S('svg',{viewBox:`0 0 1490 ${height}`,role:'group','aria-label':'Clickable network of research phases, papers and brain and body systems'});
    output.append(S('title',{},'Click a label to reveal its connections'));
    [['PHASES',173],['PAPERS',584],['BRAIN & BODY SYSTEMS',1223]].forEach(([label,x])=>output.append(S('text',{x,y:50,class:'column-label'},label)));
    const lines=S('g',{'aria-hidden':'true'}),nodes=S('g');
    groups.forEach(g=>{
      if(!g.papers.length)return;
      const ys=g.papers.map(p=>paperY.get(p.name)),cy=(ys[0]+ys.at(-1))/2;
      phaseNode(g,cy,lines,nodes);
      g.papers.forEach(p=>path(lines,{x1:275,y1:cy,x2:450,y2:paperY.get(p.name),stroke:color(g.name),kind:'phase',paper:p.name}));
    });
    for(const e of data.edges)path(lines,{x1:715,y1:paperY.get(e.paper),x2:1008,y2:systemsY.get(e.system),stroke:color(e.phase),kind:'system',paper:e.paper,system:e.system});
    data.papers.forEach(p=>node(nodes,{x:450,y:paperY.get(p.name)-15,w:265,h:30,type:'paper',id:p.name,url:p.url,label:p.name,fill:color(p.phase)+'23',stroke:color(p.phase)}));
    data.systems.forEach(s=>node(nodes,{x:1008,y:systemsY.get(s.name)-12,w:436,h:24,type:'system',id:s.name,url:s.url,label:s.name,fill:'#f7f7f7',stroke:'#9aa69c',count:s.count}));
    output.append(lines,nodes);canvas.replaceChildren(output);
    canvas.classList.remove('focused');showAll.hidden=true;depthRow.hidden=true;
    guide.textContent='Click a phase, paper, or system to explore its connections.';
    feedback.textContent='Click a node to focus. Click another node to switch focus. Click the highlighted node again to open its page.';
  }

  // 0 layers = one direct paper/system hop. Each additional layer expands one
  // more hop on the bipartite paper ↔ system graph, never on cosmetic phase edges.
  function neighborhood(selected,depth){
    const papers=new Set(),systems=new Set();
    let frontier=[];
    if(selected.type==='paper'){
      papers.add(selected.id);frontier=[{type:'paper',id:selected.id}];
    }else if(selected.type==='system'){
      systems.add(selected.id);frontier=[{type:'system',id:selected.id}];
    }else{
      const candidates=data.papers.filter(p=>p.phase===selected.id);
      candidates.forEach(p=>papers.add(p.name));
      frontier=candidates.map(p=>({type:'paper',id:p.name}));
    }
    for(let step=0;step<=depth;step++){
      const next=[];
      for(const n of frontier){
        if(n.type==='paper'){
          for(const e of data.edges){
            if(e.paper===n.id&&!systems.has(e.system)){
              systems.add(e.system);next.push({type:'system',id:e.system});
            }
          }
        } else {
          for(const e of data.edges){
            if(e.system===n.id&&!papers.has(e.paper)){
              papers.add(e.paper);next.push({type:'paper',id:e.paper});
            }
          }
        }
      }
      frontier=next;if(!frontier.length)break;
    }
    return {papers,systems};
  }

  function renderFocus(){
    if(!root)return;
    const depth=Number(depthInput.value);
    const active=neighborhood(root,depth);
    const papers=data.papers.filter(p=>active.papers.has(p.name));
    const systems=data.systems.filter(s=>active.systems.has(s.name));
    const groups=data.phases.map(phase=>({...phase,papers:papers.filter(p=>p.phase===phase.name)})).filter(g=>g.papers.length);
    const px=330,pw=286,sx=770,sw=330;
    const paperY=new Map(),phaseY=new Map(),systemY=new Map();
    let y=110;
    groups.forEach(g=>{
      const first=y;
      g.papers.forEach(p=>{paperY.set(p.name,y);y+=38;});
      phaseY.set(g.name,(first+y-38)/2);
      y+=17;
    });
    const paperExtent=y+22;
    const sysStep=systems.length>31?26:systems.length>18?29:32;
    const sysTop=106;
    systems.forEach((s,i)=>systemY.set(s.name,sysTop+i*sysStep));
    const systemExtent=sysTop+Math.max(1,systems.length-1)*sysStep+65;
    const height=Math.max(225,paperExtent,systemExtent);
    // When many systems are visible, center smaller groups against the taller column.
    if(paperExtent>systemExtent&&systems.length){
      const shift=(paperExtent-systemExtent)/2;
      systemY.forEach((v,k)=>systemY.set(k,v+shift));
    }else if(systemExtent>paperExtent&&papers.length){
      const shift=(systemExtent-paperExtent)/2;
      paperY.forEach((v,k)=>paperY.set(k,v+shift));
      phaseY.forEach((v,k)=>phaseY.set(k,v+shift));
    }
    const output=S('svg',{viewBox:`0 0 1135 ${height}`,role:'group',
      'aria-label':`Connections for ${root.id}, depth ${depth}`});
    output.append(S('title',{},`Selected ${root.id}: ${papers.length} papers and ${systems.length} systems`));
    [['PHASES',130],['PAPERS',473],['BRAIN & BODY SYSTEMS',935]].forEach(([label,x])=>output.append(S('text',{x,y:52,class:'column-label'},label)));
    const lines=S('g',{'aria-hidden':'true'}),nodes=S('g');
    groups.forEach(g=>{
      const yc=phaseY.get(g.name);
      phaseNode(g,yc,lines,nodes,true);
      g.papers.forEach(p=>{
        path(lines,{x1:230,y1:yc,x2:px,y2:paperY.get(p.name),stroke:color(g.name),kind:'phase',paper:p.name});
      });
    });
    for(const e of data.edges){
      if(paperY.has(e.paper)&&systemY.has(e.system)){
        path(lines,{x1:px+pw,y1:paperY.get(e.paper),x2:sx,y2:systemY.get(e.system),stroke:color(e.phase),kind:'system',paper:e.paper,system:e.system});
      }
    }
    papers.forEach(p=>node(nodes,{x:px,y:paperY.get(p.name)-16,w:pw,h:32,type:'paper',id:p.name,label:p.name,url:p.url,
      fill:color(p.phase)+'23',stroke:color(p.phase),selected:root.type==='paper'&&root.id===p.name}));
    systems.forEach(s=>node(nodes,{x:sx,y:systemY.get(s.name)-14,w:sw,h:28,type:'system',id:s.name,label:s.name,url:s.url,
      fill:'#f6f6f4',stroke:'#89988f',count:s.count,selected:root.type==='system'&&root.id===s.name}));
    if(!systems.length)output.append(S('text',{x:sx+sw/2,y:Math.max(140,height/2),class:'focus-no-systems'},'No systems currently mapped'));
    output.append(lines,nodes);
    canvas.classList.add('focused');canvas.replaceChildren(output);
    showAll.hidden=false;depthRow.hidden=false;
    depthLabel.textContent=`${depth} — ${depthDescription[depth]}`;
    guide.textContent=`Focused on ${root.id}: ${papers.length} paper${papers.length===1?'':'s'} · ${systems.length} system${systems.length===1?'':'s'}`;
    feedback.textContent='Click a different node to switch focus; click the highlighted node again to open its page. Click empty space to clear.';
  }

  function enterFocus(selected,clickedNode=null){
    if(!data)return;
    const wasFocused=!!root;
    const clickedY=wasFocused&&clickedNode?clickedNode.getBoundingClientRect().top:null;
    if(!wasFocused){
      previousScroll=window.scrollY;
      depthInput.value='0';
      query.value='';
    }
    root=selected;
    renderFocus();
    keepFocusedNodeVisible();
    if(!wasFocused){
      const target=window.scrollY+canvas.getBoundingClientRect().top-90;
      window.scrollTo({top:Math.max(0,target),behavior:'auto'});
    } else if(clickedY!==null){
      // Retarget without resetting the slider. Keep the clicked node near its
      // original screen position even when the focused diagram changes height.
      const newNode=canvas.querySelector('.selected-root');
      if(newNode)window.scrollBy({top:newNode.getBoundingClientRect().top-clickedY,behavior:'auto'});
    }
  }
  function restore(){
    if(!root)return;
    root=null;renderAll();
    if(previousScroll!==null)window.scrollTo({top:previousScroll,behavior:'auto'});
    previousScroll=null;
  }
  // Any non-control click outside a map node dismisses the active filter.
  // The depth control is exempt so its label and slider remain interactive.
  document.addEventListener('click',event=>{
    if(root&&!event.target.closest('.map-node, #map-depth-row, #map-show-all, .map-view-toggle')) restore();
  });
  showAll.addEventListener('click',restore);
  depthInput.addEventListener('input',()=>{if(root)renderFocus();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&root)restore();});

  function renderMobile(){
    const holder=$('mobile-phases');holder.replaceChildren();
    for(const phase of data.phases){
      const detail=make('details',undefined,'mobile-phase');if(phase.name==='Foundation')detail.open=true;
      const summary=make('summary');summary.append(make('strong',`${phaseLabel(phase)} — ${phase.paperCount} paper${phase.paperCount===1?'':'s'}`));
      detail.append(summary,make('p',phase.description,'phase-tagline'));
      const open=make('a',`Explore ${phase.name} phase →`,'phase-open');open.href=phase.url;detail.append(open);
      for(const paper of data.papers.filter(p=>p.phase===phase.name)){
        const pd=make('details',undefined,'mobile-paper');
        pd.dataset.search=[phase.name,paper.name,paper.description,...data.edges.filter(e=>e.paper===paper.name).map(e=>e.system)].join(' ').toLowerCase();
        const sm=make('summary');sm.append(make('strong',paper.name),make('span',paper.description,'paper-tagline'));pd.append(sm);
        const link=make('a',paper.detailPending?'View current paper listing →':'Open paper page →','paper-open');link.href=paper.url;pd.append(link);
        const names=new Set(data.edges.filter(e=>e.paper===paper.name).map(e=>e.system));
        const systems=make('div',undefined,'system-row');
        if(!names.size)systems.append(make('span','No systems currently mapped.'));
        else data.systems.filter(s=>names.has(s.name)).forEach(s=>{
          const a=make('a',s.name);a.href=s.url;a.title=s.description;systems.append(a);
        });
        pd.append(systems);detail.append(pd);
      }
      holder.append(detail);
    }
    const directory=$('mobile-systems');directory.replaceChildren();directory.className='mobile-systems-grid';
    for(const system of data.systems){
      const a=make('a',undefined,'mobile-system-link');a.href=system.url;
      a.dataset.search=`${system.name} ${system.description}`.toLowerCase();
      const header=make('span',undefined,'mobile-system-header');header.append(make('strong',system.name),make('span',`${system.count} paper${system.count===1?'':'s'}`,'mobile-system-count'));
      a.append(header,make('span',system.description,'mobile-system-description'));directory.append(a);
    }
  }
  function applySearch(){
    const term=query.value.trim().toLowerCase();
    if(!data)return;
    if(root)restore();
    if(!term){focusHover(null);feedback.textContent='Click to focus a node, then click that same highlighted node again to open its page.';}
    else{
      let count=0;
      canvas.querySelectorAll('.map-node').forEach(n=>{
        const type=n.dataset.type,id=n.dataset.id;
        const desc=(type==='phase'?data.phases:type==='paper'?data.papers:data.systems).find(x=>x.name===id)?.description||'';
        const match=(id+' '+desc).toLowerCase().includes(term);
        if(match)count++;
        n.classList.toggle('dimmed',!match);n.classList.toggle('emphasized',match);
      });
      canvas.querySelectorAll('.edge').forEach(e=>e.classList.remove('emphasized'));
      feedback.textContent=`${count} matching map labels. Click a label to explore.`;
    }
    document.querySelectorAll('.mobile-paper').forEach(p=>{p.hidden=!!term&&!p.dataset.search.includes(term);if(term&&!p.hidden)p.open=true;});
    document.querySelectorAll('.mobile-phase').forEach(p=>{
      const hit=[...p.querySelectorAll('.mobile-paper')].some(x=>!x.hidden);
      p.hidden=!!term&&!hit&&!p.querySelector('summary').textContent.toLowerCase().includes(term);
      if(term&&hit)p.open=true;
    });
    document.querySelectorAll('.mobile-system-link').forEach(a=>{a.hidden=!!term&&!a.dataset.search.includes(term);});
  }
  query.addEventListener('input',applySearch);
  $('map-reset').addEventListener('click',()=>{query.value='';applySearch();query.focus();});
  fetch('research-map.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error(`${r.status} ${r.statusText}`);return r.json();})
    .then(graph=>{
      if(!Array.isArray(graph.phases)||!Array.isArray(graph.papers)||!Array.isArray(graph.systems)||!Array.isArray(graph.edges))throw Error('Invalid map JSON');
      data=graph;
      $('map-counts').textContent=`${data.counts.phases} phases · ${data.counts.papers} papers · ${data.counts.systems} systems · ${data.counts.connections} paper–system connections`;
      renderAll();renderMobile();
    })
    .catch(error=>{canvas.replaceChildren(make('p','The research map could not be loaded.'));$('map-counts').textContent=error.message;});
})();
