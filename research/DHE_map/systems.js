'use strict';
(() => {
  const title=document.getElementById('system-title');
  const intro=document.getElementById('system-intro');
  const content=document.getElementById('system-content');
  const slug=new URLSearchParams(location.search).get('system');
  const elem=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
  const anchor=(text,url,cls)=>{const a=elem('a',text,cls);a.href=url;return a;};
  function renderList(data){
    title.textContent='Brain & Body Systems';
    intro.textContent=`Browse ${data.systems.length} systems connected to ${data.papers.length} papers. Choose a system to view its research papers.`;
    const panel=elem('section',undefined,'system-panel');
    const search=elem('input');search.type='search';search.placeholder='Find a system…';search.setAttribute('aria-label','Find a system');
    const grid=elem('div',undefined,'system-list');
    data.systems.forEach(s=>{
      const a=anchor('',s.url);
      a.append(elem('span',s.name),elem('span',`${s.count} papers`));
      a.dataset.search=s.name.toLowerCase();grid.append(a);
    });
    search.addEventListener('input',()=>{const q=search.value.toLowerCase().trim();[...grid.children].forEach(a=>a.hidden=!a.dataset.search.includes(q));});
    panel.append(search,grid);content.replaceChildren(panel);
  }
  function renderDetail(data,system){
    document.title=system.name+' — Hortanica';title.textContent=system.name;
    const edges=data.edges.filter(e=>e.system===system.name);
    intro.textContent=`${edges.length} research paper${edges.length===1?'':'s'} currently associated with this system.`;
    const panel=elem('section',undefined,'system-panel');
    panel.append(elem('h2','Associated papers'));
    for(const phase of data.phases){
      const group=edges.filter(e=>e.phase===phase.name).map(e=>data.papers.find(p=>p.name===e.paper)).filter(Boolean);
      if(!group.length)continue;
      const section=elem('section',undefined,'system-phase');
      const h=elem('h3');h.append(anchor(`Phase ${String(phase.order).padStart(2,'0')} — ${phase.name}`,phase.url));section.append(h);
      const ul=elem('ul');group.sort((a,b)=>a.order-b.order).forEach(p=>{const li=elem('li');li.append(anchor(p.name+' →',p.url,'paper-result'));ul.append(li);});
      section.append(ul);panel.append(section);
    }
    const seeAll=elem('p');seeAll.append(anchor('← Browse all systems','./'));
    panel.append(seeAll);content.replaceChildren(panel);
  }
  fetch('../research-map.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('Data could not be loaded');return r.json();})
    .then(data=>{
      const system=data.systems.find(s=>s.slug===slug);
      if(slug&&!system){content.replaceChildren(elem('p','This system is not in the current spreadsheet.'));return;}
      if(system)renderDetail(data,system);else renderList(data);
    }).catch(e=>content.replaceChildren(elem('p',e.message)));
})();
