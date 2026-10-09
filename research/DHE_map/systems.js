'use strict';
(() => {
  const title=document.getElementById('system-title');
  const intro=document.getElementById('system-intro');
  const content=document.getElementById('system-content');
  const slug=new URLSearchParams(location.search).get('system');
  const elem=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
  const anchor=(text,url,cls)=>{const a=elem('a',text,cls);a.href=url;return a;};
  const phaseTitle=phase=>`Phase ${phase.order}: ${phase.name}`;
  function renderList(data){
    title.textContent='Brain & Body Systems';
    intro.textContent=`Explore ${data.systems.length} systems associated with ${data.papers.length} research papers. These short descriptions explain how a system may contribute to lived experience.`;
    const panel=elem('section',undefined,'system-panel');
    const search=elem('input');search.type='search';search.placeholder='Find a system or description…';search.setAttribute('aria-label','Find a system');
    const grid=elem('div',undefined,'system-list');
    data.systems.forEach(s=>{
      const a=anchor('',s.url,'system-entry');
      const top=elem('span',undefined,'system-entry-top');
      top.append(elem('strong',s.name),elem('span',`${s.count} paper${s.count===1?'':'s'}`,'system-paper-count'));
      a.append(top,elem('span',s.description||'Description pending.','system-description'));
      a.dataset.search=`${s.name} ${s.description||''}`.toLowerCase();grid.append(a);
    });
    search.addEventListener('input',()=>{
      const q=search.value.toLowerCase().trim();
      [...grid.children].forEach(a=>{a.hidden=!!q&&!a.dataset.search.includes(q);});
    });
    panel.append(search,grid);content.replaceChildren(panel);
  }
  function renderDetail(data,system){
    document.title=system.name+' — Hortanica';title.textContent=system.name;
    const edges=data.edges.filter(e=>e.system===system.name);
    intro.textContent=system.description||'Human-centered description pending.';
    const count=elem('p',`${edges.length} research paper${edges.length===1?'':'s'} currently associated with this system.`,'system-detail-count');
    const panel=elem('section',undefined,'system-panel');panel.append(count,elem('h2','Associated papers'));
    for(const phase of data.phases){
      const group=edges.filter(e=>e.phase===phase.name).map(e=>data.papers.find(p=>p.name===e.paper)).filter(Boolean);
      if(!group.length)continue;
      const section=elem('section',undefined,'system-phase');
      const heading=elem('h3');heading.append(anchor(phaseTitle(phase),phase.url));section.append(heading);
      section.append(elem('p',phase.description||'','system-phase-tagline'));
      const ul=elem('ul');
      group.sort((a,b)=>a.order-b.order).forEach(p=>{
        const li=elem('li');const a=anchor('',p.url,'paper-result');
        a.append(elem('strong',p.name),elem('span',p.description||'Description pending.','paper-question'));
        li.append(a);ul.append(li);
      });
      section.append(ul);panel.append(section);
    }
    const back=elem('p');back.append(anchor('← Browse all systems','./'));panel.append(back);
    content.replaceChildren(panel);
  }
  fetch('../research-map.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('Data could not be loaded');return r.json();})
    .then(data=>{
      const system=data.systems.find(s=>s.slug===slug);
      if(slug&&!system){content.replaceChildren(elem('p','This system is not in the current spreadsheet.'));return;}
      if(system)renderDetail(data,system);else renderList(data);
    }).catch(e=>content.replaceChildren(elem('p',e.message)));
})();
