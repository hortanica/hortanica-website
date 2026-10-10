'use strict';
(() => {
  const title=document.getElementById('system-title');
  const intro=document.getElementById('system-intro');
  const content=document.getElementById('system-content');
  const slug=new URLSearchParams(location.search).get('system');
  const elem=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
  const anchor=(text,url,cls)=>{const a=elem('a',text,cls);a.href=url;return a;};
  // Explanatory website copy; the spreadsheet-generated map data remains authoritative for relationships.
  const SYSTEM_EXPLANATIONS = Object.freeze({
  "basal-ganglia-striatum": "The basal ganglia are interconnected groups of nerve cells deep inside the brain, beneath the outer cortex. The striatum, including the caudate and putamen, is one of their main entry points. Working with the frontal cortex and dopamine signaling, these circuits help select actions, learn routines, and influence whether an intention becomes a movement.",
  "hippocampus-medial-temporal-lobe": "The hippocampus is a curved structure deep within the temporal lobe on each side of the brain, alongside other medial temporal regions. These areas help form and retrieve memories of events, places, and context. They let past experiences inform what feels familiar, what you expect, and how you navigate new situations.",
  "dacc-midcingulate-cortex": "The dorsal anterior cingulate and midcingulate cortex lie along the inner surface of the brain, above the band of fibers connecting its hemispheres. They are involved in monitoring conflict, effort, errors, pain, and demands for control. Their activity can help adjust attention or action when continuing as usual becomes difficult; the boundaries between these named regions vary across studies.",
  "anterior-insula": "The anterior insula is part of the cerebral cortex folded deep within a groove on each side of the brain, beneath portions of the frontal and temporal lobes. It combines signals about the body's condition with attention, emotion, and the importance of events. That makes internal changes, such as discomfort or anticipation, more relevant to what you notice and do.",
  "apfc-frontopolar-cortex": "The anterior prefrontal, or frontopolar, cortex is near the very front of the frontal lobes, behind the forehead. It is involved in considering alternatives, maintaining longer-term intentions, and shifting between what is happening now and what could happen later. It works with other regions rather than independently generating future plans.",
  "sma-pre-sma": "The supplementary motor area and pre-supplementary motor area sit on the upper inner surface of the frontal lobes, just ahead of the primary motor cortex. They help organize sequences of movements and prepare self-initiated actions. The pre-SMA is especially involved when an action must be selected, changed, or organized before it begins.",
  "valuation-systems": "Valuation systems are not one anatomical structure. They involve communicating regions such as the ventromedial and orbitofrontal prefrontal cortex, striatum, amygdala, and insula. Together, they help estimate possible benefits, costs, uncertainty, and personal significance, so an option can feel worth approaching, avoiding, or reconsidering depending on the context.",
  "dlpfc": "The dorsolateral prefrontal cortex (DLPFC) lies on the upper outer sides of the frontal lobes, roughly behind the forehead. It helps hold information in mind, organize steps, apply rules, and keep a goal active despite distractions. It is one part of larger control networks that support flexible, deliberate behavior.",
  "interoceptive-systems": "Interoception is the processing of signals about the body's internal condition, not a structure in one spot. Information from organs and blood vessels travels through peripheral nerves and spinal pathways to the brainstem, thalamus, insula, and other areas. These networks contribute to sensations such as hunger, heartbeat, breathing effort, and bodily discomfort.",
  "posterior-parietal-cortex": "The posterior parietal cortex is in the upper back portion of the cerebral cortex, behind the areas that first process touch. It brings together visual, touch, and body-position information to represent where things are in relation to you. That information supports attention, navigation, reaching, and selecting actions in space.",
  "autonomic-arousal-systems": "Autonomic and arousal systems span the brain and body rather than occupying one location. Brainstem and hypothalamic circuits coordinate with sympathetic and parasympathetic nerves running to organs throughout the body. They adjust functions such as heart rate, sweating, digestion, and alertness as circumstances change, often without conscious direction.",
  "default-mode-network": "The default mode network is a set of communicating brain regions rather than a single area. Important parts include the medial prefrontal cortex, posterior cingulate and precuneus, angular gyrus, and medial temporal regions. It often contributes to recalling your past, imagining the future, reflecting on yourself, and thinking about other people.",
  "frontoparietal-control-network": "The frontoparietal control network links regions along the outer prefrontal cortex with parts of the parietal lobes toward the back and top of the brain. It helps maintain goals, coordinate attention, and adapt strategies when a task changes. Its role depends on cooperation with sensory, memory, and other control networks.",
  "prefrontal-cortex-general": "The prefrontal cortex is the front portion of the brain's frontal lobes, behind the forehead and in front of the motor areas. It contains several distinct regions involved in planning, working memory, weighing consequences, and adjusting behavior. Those abilities emerge through connections with the rest of the brain, not from one executive center.",
  "sensory-cortex-sensory-systems": "Sensory systems are distributed across the nervous system. Visual processing relies heavily on occipital cortex at the back of the brain; hearing on temporal cortex; and touch and body position on parietal cortex, with other pathways for taste, smell, and bodily sensation. They transform incoming signals into information that can influence perception and action.",
  "thalamus": "The thalamus consists of paired structures deep near the center of the brain, just above the brainstem. Its different nuclei relay and regulate many sensory, motor, and cortical signals, often through two-way connections with the cerebral cortex. It also participates in attention, sleep, and the coordination of activity between brain regions.",
  "vmpfc-ofc": "The ventromedial prefrontal cortex sits along the lower inner frontal lobes, while the orbitofrontal cortex lies on their underside, just above the eye sockets. Both connect with memory, emotion, and reward circuits. They contribute to learning what outcomes mean, comparing choices, and revising an option's value when circumstances change.",
  "cerebellum": "The cerebellum is the densely folded structure at the lower back of the brain, behind the brainstem and beneath the rear of the cerebral hemispheres. It uses incoming and outgoing signals to refine coordination, timing, and predictions about movement. Research also connects cerebellar circuits with aspects of learning, attention, and cognition.",
  "medial-prefrontal-cortex": "The medial prefrontal cortex runs along the inner, midline-facing surface of the frontal lobes. It connects with memory, valuation, emotion, and social-processing networks. These connections help relate experiences and possible actions to personal goals, beliefs, and context, although different subregions make different contributions.",
  "posterior-mid-insula": "The middle and posterior insula are portions of cortex buried deep in the lateral groove on each side of the brain, farther back than the anterior insula. They process signals about bodily conditions, including touch-related, temperature, pain, and visceral information. Those representations can inform how the body feels before a situation receives a broader emotional interpretation.",
  "premotor-cortex": "The premotor cortex lies in the frontal lobe immediately ahead of the primary motor cortex, particularly along the brain's outer surface. It helps translate sensory information, goals, and learned movement patterns into preparations for action. It works with parietal and motor regions when deciding how to reach, orient, or move next.",
  "acc": "The anterior cingulate cortex (ACC) lies along the inner surface of the frontal brain, above the front of the corpus callosum. Its subregions participate in evaluating conflict, effort, outcomes, emotional significance, and bodily responses. The label overlaps with more specific terms such as dorsal ACC, so its functions cannot be reduced to a single task.",
  "dorsal-premotor-cortex": "The dorsal premotor cortex is on the upper outer surface of the frontal lobe, just in front of the primary motor cortex. It is especially involved in preparing movements using external cues and spatial information, such as deciding how to reach toward something you see. It communicates with parietal and motor regions to shape an action before execution.",
  "frontoparietal-attention-network": "The frontoparietal attention network refers to connections between frontal regions involved in orienting, including the frontal eye fields, and upper parietal regions such as the intraparietal sulcus. These areas are spread across the front and upper rear of the brain. Together, they help direct attention toward a location or feature according to current goals.",
  "neuromodulatory-systems": "Neuromodulatory systems are groups of signaling cells whose chemical messengers change how strongly other circuits respond. Their sources include small nuclei in the brainstem and midbrain, as well as basal forebrain areas, with projections reaching widely across the brain. Dopamine, norepinephrine, serotonin, and acetylcholine help regulate learning, alertness, motivation, and flexibility in different ways.",
  "prospective-memory-timing-systems": "Prospective memory and timing depend on a network, not a single clock or reminder center. Prefrontal and parietal regions, the hippocampus, basal ganglia, and cerebellum contribute from different locations across the brain. Together, they help preserve an intention, judge when it matters, and bring it back into action at an appropriate moment.",
  "tpj-psts": "The temporoparietal junction (TPJ) is where parts of the temporal and parietal lobes meet near the side and back of each hemisphere. The posterior superior temporal sulcus (pSTS) runs nearby along the temporal cortex. These regions help interpret social cues, others' actions, and shifts in attention; their roles are related but not identical.",
  "amygdala": "The amygdala is a pair of small groups of nuclei deep in the front of the medial temporal lobes, near the hippocampus. It helps detect and learn about events with emotional or motivational significance, including threats and rewards. Its influence depends on connections with sensory, memory, and prefrontal systems rather than a single 'fear center.'",
  "angular-gyrus": "The angular gyrus is part of the inferior parietal lobule near the junction of the temporal, parietal, and occipital areas, toward the lower back side of the brain. It participates in combining information across senses and supporting language, meaning, memory, and perspective-taking. Its exact contribution varies with the task and connected regions.",
  "apical-dendrites": "Apical dendrites are branching extensions of many pyramidal neurons, not a separate brain region. In the cerebral cortex, they often extend from a cell's body toward the outer cortical layers. Their branches receive and integrate inputs from different sources, which can affect how context and incoming signals influence a neuron's activity.",
  "association-cortex": "Association cortex describes areas of the cerebral cortex that integrate information beyond the initial stages of sensation or movement. These regions are spread through frontal, parietal, temporal, and parts of occipital cortex. They help connect what is sensed with memory, concepts, goals, and expectations, allowing information to be interpreted in context.",
  "brainstem": "The brainstem sits at the base of the brain between the cerebral hemispheres and the spinal cord, in front of the cerebellum. It includes the midbrain, pons, and medulla. Its circuits support breathing, heart and blood-pressure regulation, sleep and wakefulness, and the transfer of signals between the body and higher brain regions.",
  "cardiac-systems": "Cardiac systems include the heart and its electrical and muscular activity in the chest, together with the nerves and brain circuits that regulate and sense it. Autonomic pathways connect the heart to the brainstem and other regions. Changes in heartbeat and blood pressure can therefore become part of how bodily arousal and effort are experienced.",
  "caudate": "The caudate nucleus is a curved structure deep within each cerebral hemisphere and is part of the dorsal striatum of the basal ganglia. It exchanges information with frontal cortical circuits and helps link goals, learned outcomes, and action choices. It contributes to updating behavior when an established response is no longer the best option.",
  "frontostriatal-systems": "Frontostriatal systems are interconnected loops linking frontal cortical regions to the striatum deep inside the brain, with further connections through other basal ganglia structures and the thalamus. These circuits help select, start, stop, and switch thoughts or actions while taking goals and learned consequences into account. They have no single anatomical address.",
  "gene-regulatory-plasticity-systems": "Gene-regulatory and plasticity processes occur inside cells throughout the brain and nervous system, rather than in one location. Activity and experience can alter gene expression, protein production, and the strength or structure of connections between neurons. These changes unfold over different timescales and help explain how earlier experiences can influence later responses.",
  "higher-order-thalamus": "The higher-order thalamus refers to particular nuclei within the thalamus, deep near the center of the brain, including regions such as the mediodorsal nucleus and pulvinar. Rather than simply passing sensory inputs onward, these nuclei help coordinate communication between cortical areas. Their roles include aspects of attention, learning, and flexible information exchange.",
  "hypothalamus": "The hypothalamus is a small collection of nuclei near the base of the brain, beneath the thalamus and above the pituitary gland. It connects nervous, hormonal, and autonomic processes to regulate hunger, temperature, thirst, sleep rhythms, stress responses, and other bodily needs. It helps turn internal conditions into coordinated physical responses.",
  "lateral-anterior-prefrontal-cortex": "The lateral anterior prefrontal cortex occupies forward portions of the outer frontal lobes, behind the forehead. It contributes to considering alternative rules or approaches, holding goals in mind, and changing strategy when familiar solutions are inadequate. It works with parietal, memory, and valuation circuits when new possibilities must be evaluated.",
  "layer-5-pyramidal-neurons": "Layer-5 pyramidal neurons are a class of excitatory nerve cells found in the fifth layer of the cerebral cortex across multiple brain regions. Many send long-range output signals to other brain areas, the brainstem, or spinal pathways. Their dendrites integrate incoming information, while their axons help cortical processing influence wider networks and, in some circuits, bodily action.",
  "locus-coeruleus-noradrenergic-system": "The locus coeruleus is a small nucleus in the upper brainstem, within the pons, whose nerve cells release norepinephrine. Its projections reach widespread areas of the brain. This system helps adjust alertness, attention, and responses to significant changes, influencing how readily other circuits react rather than specifying one particular behavior.",
  "motor-cortex": "The primary motor cortex lies along the precentral gyrus of the frontal lobe, just in front of the central groove separating frontal and parietal areas. It sends signals through descending pathways that help control voluntary muscle movements. Its output is shaped by premotor, sensory, basal ganglia, and cerebellar circuits.",
  "pcc-precuneus": "The posterior cingulate cortex and precuneus lie on the inner surface toward the back of the brain, around the medial parietal region. They are important parts of the default mode network and interact with memory and attention systems. They contribute to recalling experiences, representing context, and relating events to one's perspective or sense of self.",
  "substantia-nigra-dopaminergic-system": "The substantia nigra is a group of nuclei in the midbrain, near the top of the brainstem. Dopamine-producing cells in its compact part project strongly to the striatum, influencing movement, action selection, and learning from outcomes. This is one component of dopamine signaling, not the source of every reward or motivation process.",
  "thalamocortical-circuits": "Thalamocortical circuits are two-way connections between nuclei of the thalamus deep in the brain and regions of the cerebral cortex across its outer surface. They help coordinate the flow and timing of sensory, motor, and other information. Their repeated signaling is involved in attention, perception, sleep rhythms, and broader brain activity.",
  "ventral-striatum": "The ventral striatum lies deep in the front-lower part of the forebrain and includes the nucleus accumbens. It connects with prefrontal, limbic, and dopamine-signaling regions. These circuits help link expected outcomes to motivation and learning, making some options more likely to draw effort or approach behavior in a particular situation."
});
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
    const explanation=SYSTEM_EXPLANATIONS[system.slug];
    if(explanation)intro.insertAdjacentElement('afterend',elem('p',explanation,'system-explanation'));
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
