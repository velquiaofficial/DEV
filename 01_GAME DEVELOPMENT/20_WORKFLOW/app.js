/* VQ_ENRICHED */
"use strict";
document.querySelectorAll(".nav-btn").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    ["board","rules","run"].forEach(v=>document.getElementById("view-"+v).classList.toggle("hidden", btn.dataset.view!==v));
  };
});

const KEY="vq_flowbase_v1";
const state=VQ.load(KEY,{tasks:[{id:"1",title:"請求書PDFを整理",col:"inbox"},{id:"2",title:"週次報告書ドラフト",col:"inbox"}],rules:[{trig:"請求",act:"doing"}],logs:[]});
function save(){VQ.store(KEY,state);render();}
function render(){
  ["inbox","doing","done"].forEach(col=>{
    const el=document.getElementById("col-"+col);
    el.innerHTML=state.tasks.filter(t=>t.col===col).map(t=>"<li><div>"+t.title+"</div><div class='actions'><button data-id='"+t.id+"' data-to='doing'>→</button><button data-id='"+t.id+"' data-to='done'>✓</button></div></li>").join("")||"<li class='muted'>空</li>";
    el.querySelectorAll("button").forEach(b=>b.onclick=()=>{const t=state.tasks.find(x=>x.id===b.dataset.id); if(!t)return; t.col=b.dataset.to; state.logs.unshift({at:new Date().toLocaleTimeString("ja-JP"),msg:t.title+" → "+t.col}); save();});
  });
  document.getElementById("rules").innerHTML=state.rules.map((r,i)=>"<li><div>「"+r.trig+"」→ "+r.act+"</div><button data-r='"+i+"'>削除</button></li>").join("");
  document.getElementById("rules").querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>{state.rules.splice(+b.dataset.r,1);save();});
  document.getElementById("logs").innerHTML=state.logs.slice(0,20).map(l=>"<li><div>"+l.msg+"</div><span class='badge'>"+l.at+"</span></li>").join("")||"<li class='muted'>なし</li>";
}
document.getElementById("addTask").onclick=()=>{const title=prompt("タスク名"); if(!title)return; state.tasks.push({id:VQ.uid(),title,col:"inbox"});
  for(const r of state.rules){ if(title.includes(r.trig)){ state.tasks[state.tasks.length-1].col=r.act==="done"?"done":"doing"; state.logs.unshift({at:new Date().toLocaleTimeString("ja-JP"),msg:"Auto: "+title}); break; } }
  save(); VQ.toast("追加");
};
document.getElementById("addRule").onclick=()=>{const trig=document.getElementById("trig").value.trim(); if(!trig)return; state.rules.push({trig,act:document.getElementById("act").value}); document.getElementById("trig").value=""; save(); VQ.toast("ルール追加");};
render();


(function(){
  const foot=document.querySelector(".side-foot");
  if(!foot||document.getElementById("vq-export-state")) return;
  const b=document.createElement("button");
  b.id="vq-export-state"; b.type="button"; b.textContent="Export data"; b.style.marginTop="8px";
  b.onclick=()=>{
    const keys=Object.keys(localStorage).filter(k=>k.startsWith("vq_"));
    const dump={}; keys.forEach(k=>{try{dump[k]=JSON.parse(localStorage.getItem(k));}catch(e){dump[k]=localStorage.getItem(k);}});
    VQ.downloadJSON(location.pathname.split("/").slice(-2,-1)[0]+"-data.json", dump);
    VQ.toast("Exported");
  };
  foot.appendChild(b);
})();
