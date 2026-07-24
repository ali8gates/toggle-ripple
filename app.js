// The seed graph is illustrative. The prices are real, pulled live and baked into quotes.json
// The plain-English box maps a typed question to the right event with keyword matching
// In production this is where the language model reads intent; here it runs locally so nothing breaks

let QUOTES = {};

//  Seed knowledge graph: three event scenarios 
// Each node: id, label, sub (ticker or note), degree (0=event,1,2,3), tradeable, ticker
// Each edge: from, to, rel (relationship type), src (provenance), conf (0-1)
const SCENARIOS = {
  fertilizer: {
    tag: "Supply-chain shock", title: "Fertilizer export terminal shut in the East",
    desc: "Trace one input up and down the supply chain.",
    narrative: {
      what: "A key fertilizer export terminal in the East was shut, choking a critical planting input.",
      ripple: [
        ["1-hop","Fertilizer and ammonia supply tightens, so producers gain pricing power"],
        ["2-hop","US planting season starts with less fertilizer, so nitrogen cost rises"],
        ["3-hop","Lower corn and wheat yield locked in for September, and food-producer margins compress"],
      ],
      trade: "Go long the ag complex (fertilizer producers and grain funds) before the market prices the September shortfall. Watch food producers as the offsetting short."
    },
    nodes: [
      {id:"evt", label:"East port shut", sub:"EVENT", degree:0},
      {id:"fert", label:"Fertilizer supply", sub:"input", degree:1},
      {id:"CF", label:"CF Industries", sub:"CF", degree:1, ticker:"CF"},
      {id:"NTR", label:"Nutrien", sub:"NTR", degree:1, ticker:"NTR"},
      {id:"MOS", label:"Mosaic", sub:"MOS", degree:2, ticker:"MOS"},
      {id:"plant", label:"US planting season", sub:"less input", degree:2},
      {id:"CORN", label:"Corn fund", sub:"CORN", degree:3, ticker:"CORN", tradeable:true},
      {id:"WEAT", label:"Wheat fund", sub:"WEAT", degree:3, ticker:"WEAT", tradeable:true},
      {id:"ADM", label:"Archer-Daniels", sub:"ADM", degree:3, ticker:"ADM"},
    ],
    edges: [
      {from:"evt",to:"fert",rel:"chokes",src:"filing + 2 news",conf:.91},
      {from:"fert",to:"CF",rel:"benefits",src:"commodity data",conf:.88},
      {from:"fert",to:"NTR",rel:"benefits",src:"commodity data",conf:.86},
      {from:"CF",to:"MOS",rel:"peer",src:"sector map",conf:.83},
      {from:"fert",to:"plant",rel:"constrains",src:"USDA model",conf:.84},
      {from:"plant",to:"CORN",rel:"lifts",src:"price corr. 5y",conf:.79},
      {from:"plant",to:"WEAT",rel:"lifts",src:"price corr. 5y",conf:.77},
      {from:"plant",to:"ADM",rel:"pressures",src:"transcripts",conf:.62},
    ]
  },
  jpm: {
    tag: "Earnings read-through", title: "JPMorgan earnings beat expectations",
    desc: "A strong bank print reads across to its peers.",
    narrative: {
      what: "JPMorgan reported earnings well above expectations, led by a strong trading quarter.",
      ripple: [
        ["1-hop","Trading strength reads across to peer bulge-bracket desks"],
        ["2-hop","Goldman and Morgan Stanley likely to have strong trading quarters too"],
        ["3-hop","Sector-wide re-rate of capital-markets exposure into their prints"],
      ],
      trade: "Position ahead of the GS and MS prints. The JPM beat is a leading tell. The peer desks correlate, but the market prices them on their own report dates."
    },
    nodes: [
      {id:"evt", label:"JPM beat", sub:"EVENT", degree:0},
      {id:"JPM", label:"JPMorgan", sub:"JPM", degree:1, ticker:"JPM"},
      {id:"trade", label:"Trading revenue ↑", sub:"driver", degree:1},
      {id:"GS", label:"Goldman Sachs", sub:"GS", degree:2, ticker:"GS", tradeable:true},
      {id:"MS", label:"Morgan Stanley", sub:"MS", degree:2, ticker:"MS", tradeable:true},
      {id:"capmkts", label:"Capital-markets theme", sub:"sector", degree:3},
    ],
    edges: [
      {from:"evt",to:"JPM",rel:"reports",src:"earnings feed",conf:.95},
      {from:"JPM",to:"trade",rel:"driven by",src:"transcript",conf:.9},
      {from:"trade",to:"GS",rel:"reads across",src:"trading corr.",conf:.82},
      {from:"trade",to:"MS",rel:"reads across",src:"trading corr.",conf:.8},
      {from:"GS",to:"capmkts",rel:"part of",src:"sector map",conf:.7},
      {from:"MS",to:"capmkts",rel:"part of",src:"sector map",conf:.68},
    ]
  },
  rareearth: {
    tag: "Geopolitical / moat", title: "Rare-earth export restriction announced",
    desc: "Trace from a raw input to the names that win and lose.",
    narrative: {
      what: "A major exporter announced new restrictions on rare-earth element exports.",
      ripple: [
        ["1-hop","Domestic rare-earth miners gain strategic pricing power"],
        ["2-hop","Defense primes and EV makers face input risk on magnets / motors"],
        ["3-hop","Lithium and specialty-chem names re-rate on a supply-security premium"],
      ],
      trade: "Go long domestic supply (MP Materials) as the scarcity winner, and screen the defense primes and EV makers for input-cost exposure. Today's tape already shows the split."
    },
    nodes: [
      {id:"evt", label:"Export curb", sub:"EVENT", degree:0},
      {id:"MP", label:"MP Materials", sub:"MP", degree:1, ticker:"MP", tradeable:true},
      {id:"magnet", label:"Magnet / motor input", sub:"choke point", degree:1},
      {id:"LMT", label:"Lockheed Martin", sub:"LMT", degree:2, ticker:"LMT", tradeable:true},
      {id:"RTX", label:"RTX Corp", sub:"RTX", degree:2, ticker:"RTX", tradeable:true},
      {id:"TSLA", label:"Tesla", sub:"TSLA", degree:2, ticker:"TSLA"},
      {id:"ALB", label:"Albemarle", sub:"ALB", degree:3, ticker:"ALB"},
    ],
    edges: [
      {from:"evt",to:"MP",rel:"benefits",src:"filing + news",conf:.87},
      {from:"evt",to:"magnet",rel:"restricts",src:"policy doc",conf:.9},
      {from:"magnet",to:"LMT",rel:"input risk",src:"supply map",conf:.78},
      {from:"magnet",to:"RTX",rel:"input risk",src:"supply map",conf:.76},
      {from:"magnet",to:"TSLA",rel:"input risk",src:"supply map",conf:.74},
      {from:"magnet",to:"ALB",rel:"substitute demand",src:"transcripts",conf:.6},
    ]
  }
};

const COLOR = {0:"#e3a008",1:"#4a9eff",2:"#3fb950",3:"#a371f7"};
const TRADE_COLOR = "#f85149";
let current = null, sim = null, maxDepth = 3, bias = "precision";

// ---- init ----
fetch("quotes.json").then(r=>r.json()).then(q=>{QUOTES=q; boot();});

function boot(){
  document.getElementById("ts").textContent = new Date().toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
  const ev = document.getElementById("events");
  Object.entries(SCENARIOS).forEach(([k,s],i)=>{
    const c = document.createElement("button");
    c.className="chip"+(i===0?"":""); c.dataset.k=k;
    c.innerHTML=`<div class="tag">${s.tag}</div><div class="t">${s.title}</div><div class="d">${s.desc}</div>`;
    c.onclick=()=>{document.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));c.classList.add("active");current=k;
      document.getElementById("status").innerHTML=`Loaded: <b>${s.title}</b>. Press Trace.`;};
    ev.appendChild(c);
  });
  // controls
  document.querySelectorAll("#depth button").forEach(b=>b.onclick=()=>{document.querySelectorAll("#depth button").forEach(x=>x.classList.remove("on"));b.classList.add("on");maxDepth=+b.dataset.d;});
  document.querySelectorAll("#bias button").forEach(b=>b.onclick=()=>{document.querySelectorAll("#bias button").forEach(x=>x.classList.remove("on"));b.classList.add("on");bias=b.dataset.b;});
  document.querySelectorAll(".sw").forEach(s=>s.onclick=()=>s.classList.toggle("on"));
  document.getElementById("run").onclick=trace;
  document.getElementById("reset").onclick=reset;

  // plain-English input: map a typed question to a scenario, then trace
  const go=()=>askNlp();
  document.getElementById("nlp-go").onclick=go;
  document.getElementById("nlp-input").addEventListener("keydown",e=>{if(e.key==="Enter")go();});
}

// keyword to scenario routing (stand-in for the production language layer)
const NLP_MAP=[
  {k:"fertilizer", terms:["fertilizer","fertiliser","port","terminal","ammonia","nitrogen","corn","wheat","grain","planting","crop","ag","harvest","food"]},
  {k:"jpm", terms:["jpm","jpmorgan","morgan","bank","earnings","beat","trading","goldman","gs","ms","capital markets","desk"]},
  {k:"rareearth", terms:["rare earth","rare-earth","rareearth","magnet","export","restriction","curb","defense","defence","ev","tesla","lockheed","lithium","mp","geopolit"]},
];
function askNlp(){
  const raw=document.getElementById("nlp-input").value.toLowerCase().trim();
  const hint=document.getElementById("nlp-hint");
  if(!raw){hint.className="nlp-hint warn";hint.textContent="Type a question first, for example: what if a fertilizer port shuts?";return;}
  let best=null,score=0;
  NLP_MAP.forEach(m=>{const s=m.terms.reduce((a,t)=>a+(raw.includes(t)?1:0),0);if(s>score){score=s;best=m.k;}});
  if(!best){hint.className="nlp-hint warn";hint.textContent="No match yet. Try mentioning a supply shock, a bank earnings beat, or a rare-earth curb.";return;}
  hint.className="nlp-hint";
  hint.innerHTML=`Matched your question to <b style="color:var(--teal)">${SCENARIOS[best].title}</b>. Tracing now.`;
  const chip=document.querySelector(`.chip[data-k="${best}"]`);
  document.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));
  chip.classList.add("active"); current=best;
  trace();
}

function reset(){
  if(sim) sim.stop();
  d3.select("#graph").selectAll("*").remove();
  document.getElementById("empty").style.display="flex";
  document.getElementById("narrative").innerHTML=`<div class="empty-r">Trace an event to generate its narrative card.</div>`;
  document.getElementById("provCard").style.display="none";
  document.getElementById("prices").innerHTML=`<div class="empty-r">Impacted tickers appear here with live prices.</div>`;
  document.getElementById("status").innerHTML="Select an event to begin";
}

function trace(){
  if(!current){document.getElementById("status").innerHTML="⚠ Pick an event first";return;}
  const s = SCENARIOS[current];
  const showProv = document.getElementById("sw-prov").classList.contains("on");
  document.getElementById("empty").style.display="none";

  // filter to selected depth
  const nodes = s.nodes.filter(n=>n.degree<=maxDepth).map(n=>({...n}));
  const ids = new Set(nodes.map(n=>n.id));
  const edges = s.edges.filter(e=>ids.has(e.from)&&ids.has(e.to))
    .map(e=>({...e, source:e.from, target:e.to}));

  const svg = d3.select("#graph"); svg.selectAll("*").remove();
  const W = svg.node().clientWidth, H = svg.node().clientHeight;
  svg.attr("viewBox",`0 0 ${W} ${H}`);

  // arrow marker
  const defs = svg.append("defs");
  defs.append("marker").attr("id","arrow").attr("viewBox","0 -5 10 10").attr("refX",26).attr("refY",0)
    .attr("markerWidth",6).attr("markerHeight",6).attr("orient","auto")
    .append("path").attr("d","M0,-4L8,0L0,4").attr("fill","#3a4a58");

  const link = svg.append("g").selectAll("line").data(edges).join("line")
    .attr("class","link").attr("marker-end","url(#arrow)");
  const elbl = svg.append("g").selectAll("text").data(edges).join("text")
    .attr("class","edge-lbl").text(d=>d.rel);

  const node = svg.append("g").selectAll("g").data(nodes).join("g").attr("class","node").style("opacity",0);
  node.append("circle")
    .attr("r",d=>d.degree===0?30:24)
    .attr("fill",d=>d.tradeable?"rgba(248,81,73,.12)":"rgba(17,24,32,.9)")
    .attr("stroke",d=>d.tradeable?TRADE_COLOR:COLOR[d.degree])
    .attr("stroke-width",d=>d.degree===0?2.5:2);
  node.append("text").attr("class","node-lbl").attr("text-anchor","middle").attr("dy",d=>d.ticker?-1:3)
    .attr("font-size",d=>d.degree===0?12:11).text(d=>d.label.length>14?d.label.slice(0,13)+"…":d.label);
  node.append("text").attr("class","node-sub").attr("text-anchor","middle").attr("dy",13)
    .attr("font-size",9).attr("fill",d=>d.tradeable?TRADE_COLOR:COLOR[d.degree]).text(d=>d.sub);

  sim = d3.forceSimulation(nodes)
    .force("link",d3.forceLink(edges).id(d=>d.id).distance(d=>90+d.target.degree*18).strength(.7))
    .force("charge",d3.forceManyBody().strength(-620))
    .force("center",d3.forceCenter(W/2,H/2))
    .force("collide",d3.forceCollide(46))
    .force("x",d3.forceX(d=>W/2 + (d.degree-1.5)*(W*0.16)).strength(.28))
    .on("tick",()=>{
      link.attr("x1",d=>d.source.x).attr("y1",d=>d.source.y).attr("x2",d=>d.target.x).attr("y2",d=>d.target.y);
      elbl.attr("x",d=>(d.source.x+d.target.x)/2).attr("y",d=>(d.source.y+d.target.y)/2 - 4);
      node.attr("transform",d=>`translate(${d.x},${d.y})`);
    });

  // animate reveal hop by hop
  document.getElementById("status").innerHTML=`Tracing <b>${s.title}</b> · depth ${maxDepth} · ${bias}`;
  for(let deg=0; deg<=maxDepth; deg++){
    setTimeout(()=>{
      node.filter(d=>d.degree===deg).transition().duration(450).style("opacity",1);
      link.filter(d=>d.target.degree===deg).transition().duration(450).style("opacity",.7);
      if(showProv) elbl.filter(d=>d.target.degree===deg).transition().duration(450).style("opacity",1);
      if(deg===maxDepth){
        setTimeout(()=>{renderPanels(s,nodes,edges,showProv);
          document.getElementById("status").innerHTML=`✓ Trace complete · <b>${nodes.filter(n=>n.tradeable).length} tradeable</b> nodes surfaced`;},400);
      }
    }, deg*550);
  }
  node.style("cursor","grab").call(d3.drag()
    .on("start",(e,d)=>{if(!e.active)sim.alphaTarget(.3).restart();d.fx=d.x;d.fy=d.y;})
    .on("drag",(e,d)=>{d.fx=e.x;d.fy=e.y;})
    .on("end",(e,d)=>{if(!e.active)sim.alphaTarget(0);d.fx=null;d.fy=null;}));
}

function renderPanels(s,nodes,edges,showProv){
  // narrative
  const n=s.narrative;
  document.getElementById("narrative").innerHTML=`
    <div class="k">What happened</div><div style="margin-bottom:12px">${n.what}</div>
    <div class="k">The ripple (auto-traced)</div>
    ${n.ripple.filter((_,i)=>i<maxDepth).map(r=>`<div class="ripple-step"><span class="hop">${r[0]}</span><span>${r[1]}</span></div>`).join("")}
    <div class="trade"><div class="lbl">💡 Non-obvious trade</div><div>${n.trade}</div></div>`;

  // provenance
  if(showProv){
    document.getElementById("provCard").style.display="block";
    const sorted = bias==="precision" ? [...edges].sort((a,b)=>b.conf-a.conf) : edges;
    document.getElementById("provTable").innerHTML=`
      <tr><th>Edge</th><th>Source</th><th style="text-align:right">Conf</th></tr>
      ${sorted.map(e=>{const nn=id=>nodes.find(x=>x.id===id).label.split(" ")[0];
        const cls=e.conf>=.75?"hi":"md";
        return `<tr><td>${nn(e.from)} <span style="color:var(--faint)">${e.rel}</span> ${nn(e.to)}</td>
          <td class="src">${e.src}</td><td style="text-align:right"><span class="conf ${cls}">${e.conf.toFixed(2)}</span></td></tr>`;}).join("")}`;
  } else { document.getElementById("provCard").style.display="none"; }

  // prices
  const tickers = nodes.filter(n=>n.ticker).map(n=>n.ticker);
  const rows = tickers.map(t=>{const q=QUOTES[t];if(!q)return"";
    const up=q.changePct>=0; const cls=up?"up":"down"; const sign=up?"+":"";
    return `<div class="price-row">
      <div><div class="tk">${t}</div><div class="nm">${q.name}</div></div>
      <div style="text-align:right"><div class="px">$${q.price.toLocaleString('en-US',{minimumFractionDigits:2})}</div>
      <div class="chg ${cls}">${sign}${q.change.toFixed(2)} (${sign}${q.changePct.toFixed(2)}%)</div></div>
    </div>`;}).join("");
  document.getElementById("prices").innerHTML=rows||`<div class="empty-r">No tickers in this trace.</div>`;
}
