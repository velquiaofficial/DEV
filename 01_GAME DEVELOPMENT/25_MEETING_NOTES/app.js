"use strict";
document.querySelectorAll(".nav-btn").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    ["capture","actions","archive"].forEach(v=>document.getElementById("view-"+v).classList.toggle("hidden", btn.dataset.view!==v));
  };
});

const KEY="vq_meetnote_v1";
const state=VQ.load(KEY,{meetings:[],actions:[],last:null});
function save(){VQ.store(KEY,state);render();}
function render(){
  document.getElementById("k1").textContent=state.meetings.length;
  document.getElementById("k2").textContent=state.actions.filter(a=>!a.done).length;
  document.getElementById("k3").textContent=state.actions.filter(a=>a.done).length;
  const week=Date.now()-7*864e5;
  document.getElementById("k4").textContent=state.meetings.filter(m=>m.at>week).length;
  document.getElementById("abody").innerHTML=state.actions.map((a,i)=>"<tr><td>"+a.text+"</td><td><input data-o='"+i+"' value='"+(a.owner||"")+"' style='margin:0'></td><td><input type='date' data-d='"+i+"' value='"+(a.due||"")+"' style='margin:0'></td><td><button data-ok='"+i+"'>"+(a.done?"Undo":"Done")+"</button></td></tr>").join("");
  document.querySelectorAll("[data-o]").forEach(el=>el.onchange=()=>{state.actions[+el.dataset.o].owner=el.value;save();});
  document.querySelectorAll("[data-d]").forEach(el=>el.onchange=()=>{state.actions[+el.dataset.d].due=el.value;save();});
  document.querySelectorAll("[data-ok]").forEach(b=>b.onclick=()=>{state.actions[+b.dataset.ok].done=!state.actions[+b.dataset.ok].done;save();});
  document.getElementById("arch").innerHTML=state.meetings.map(m=>"<li><div><strong>"+m.title+"</strong><br><span class='muted'>"+m.summary+"</span></div><span class='badge'>"+new Date(m.at).toLocaleDateString()+"</span></li>").join("")||"<div class='empty'>No meetings</div>";
}
document.getElementById("sample").onclick=()=>{raw.value="決定: 来月ローンチ\nTODO: キーアート確定 — 佐藤\nTODO: SNS投稿3本 — 山田\n懸念: APIクレジット\nOK: 英語キャプション採用";mtitle.value="Launch sync";};
document.getElementById("digest").onclick=async()=>{
  digest.disabled=true; await VQ.think(600);
  const dig=VQ.meetingDigest(raw.value);
  state.last={title:mtitle.value||"Meeting",...dig,at:Date.now()};
  out.textContent=["Summary",dig.summary,"","Decisions",...dig.decisions.map(d=>"・"+d),"","Actions",...dig.actions.map(a=>"・"+a)].join("\n");
  digest.disabled=false; VQ.toast("Digested");
};
document.getElementById("saveM").onclick=()=>{
  if(!state.last) return VQ.toast("Digest first");
  state.meetings.unshift(state.last);
  state.last.actions.forEach(t=>state.actions.push({text:t,owner:"",due:"",done:false,meeting:state.last.title}));
  save(); VQ.toast("Saved");
};
document.getElementById("expM").onclick=()=>VQ.downloadJSON("meetings.json",state);
render();
