'use strict';
(() => {
  const slug=new URLSearchParams(location.search).get('paper');
  const phase=document.getElementById('paper-phase');
  const title=document.getElementById('paper-title');
  const summary=document.getElementById('paper-summary');
  const content=document.getElementById('paper-content');
  const elem=(tag,t,cls)=>{const e=document.createElement(tag);if(t!==undefined)e.textContent=t;if(cls)e.className=cls;return e;};
  const link=(t,url)=>{const a=elem('a',t);a.href=url;return a;};
  fetch('../research-map.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Data unavailable');return r.json();}).then(data=>{
    const paper=data.papers.find(p=>p.slug===slug);
    if(!paper){title.textContent='Paper not found';summary.textContent='No corresponding entry exists in the current workbook.';return;}
    title.textContent=paper.name;document.title=paper.name+' — Hortanica';
    const p=data.phases.find(p=>p.name===paper.phase);
    phase.textContent=`Phase ${String(p.order).padStart(2,'0')} — ${p.name}`;
    summary.textContent='Manuscript ready for submission; not yet submitted. The full paper description and download links will be added when the manuscript is available for the website.';
    const panel=elem('section',undefined,'system-panel');panel.append(elem('h2','Systems mapped to this paper'));
    const items=data.edges.filter(e=>e.paper===paper.name).map(e=>data.systems.find(s=>s.name===e.system)).filter(Boolean);
    if(!items.length)panel.append(elem('p','No systems currently mapped.'));
    else {const ul=elem('ul');items.forEach(s=>{const li=elem('li');li.append(link(s.name+' →',s.url));ul.append(li);});panel.append(ul);}
    const back=elem('p');back.append(link('← Phase '+p.order+' — '+p.name,p.url));panel.append(back);content.replaceChildren(panel);
  }).catch(err=>{summary.textContent=err.message;});
})();
