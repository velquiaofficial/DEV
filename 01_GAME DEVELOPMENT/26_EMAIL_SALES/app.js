"use strict";
document.querySelectorAll(".nav-btn").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    ["write","seq","leads"].forEach(v=>document.getElementById("view-"+v).classList.toggle("hidden", btn.dataset.view!==v));
  };
});

const KEY="vq_outreach_v1";
const state=VQ.load(KEY,{seq:[],leads:[],last:""});
function save(){VQ.store(KEY,state);render();}
function render(){
  document.getElementById("seq").innerHTML=state.seq.map((s,i)=>"<li><strong>Day "+(i===0?0:i*3)+"</strong><pre style='white-space:pre-wrap'>"+s+"</pre></li>").join("")||"<li>Empty</li>";
  document.getElementById("leads").innerHTML=state.leads.map((l,i)=>"<li><div>"+l+"</div><button data-x='"+i+"'>Del</button></li>").join("")||"<div class='empty'>No leads</div>";
  document.querySelectorAll("[data-x]").forEach(b=>b.onclick=()=>{state.leads.splice(+b.dataset.x,1);save();});
}
document.getElementById("gen").onclick=async()=>{gen.disabled=true;await VQ.think(500);state.last=VQ.salesEmail(persona.value,offer.value,cta.value);mail.textContent=state.last;gen.disabled=false;VQ.toast("Ready");};
document.getElementById("copy").onclick=async()=>{if(!state.last)return;await navigator.clipboard.writeText(state.last);VQ.toast("Copied");};
document.getElementById("toSeq").onclick=()=>{
  if(!state.last)return VQ.toast("Generate first");
  if(state.seq.length>=3) state.seq=[];
  state.seq.push(state.last);
  if(state.seq.length===1) state.seq.push(state.last.replace("3分だけ","続報です").replace("突然の","先日ご案内した"));
  if(state.seq.length===2) state.seq.push("件名: 最終ご案内\n\n"+ (persona.value||"ご担当者") +" 様\n\nクローズ予定のため、今週中のご返信をいただけますと幸いです。");
  save(); VQ.toast("Sequence updated");
};
document.getElementById("addL").onclick=()=>{const v=lead.value.trim();if(!v)return;state.leads.unshift(v);lead.value="";save();};
document.getElementById("expS").onclick=()=>VQ.downloadText("sequence.txt",state.seq.join("\n\n-----\n\n"));
render();
