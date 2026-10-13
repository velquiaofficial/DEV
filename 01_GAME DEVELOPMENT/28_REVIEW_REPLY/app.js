"use strict";
document.querySelectorAll(".nav-btn").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    ["inbox","studio","stats"].forEach(v=>document.getElementById("view-"+v).classList.toggle("hidden", btn.dataset.view!==v));
  };
});

const KEY="vq_repliqa_v1";
const state=VQ.load(KEY,{items:[],current:null});
function save(){VQ.store(KEY,state);render();}
function render(){
  list.innerHTML=state.items.map((it,i)=>"<li><div><strong>"+"★".repeat(it.stars)+"</strong> "+(it.replied?"<span class='badge ok'>sent</span>":"<span class='badge warn'>pending</span>")+"<br><span class='muted'>"+it.body+"</span></div><button data-i='"+i+"'>Open</button></li>").join("")||"<div class='empty'>Load samples</div>";
  list.querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{state.current=+b.dataset.i;rev.textContent=state.items[state.current].body;reply.value=state.items[state.current].reply||"";document.querySelector('[data-view=studio]').click();save();});
  const n=state.items.length||1;
  s1.textContent=state.items.length;
  s2.textContent=state.items.filter(x=>x.replied).length;
  s3.textContent=(state.items.reduce((a,b)=>a+b.stars,0)/n).toFixed(1);
  s4.textContent=state.items.filter(x=>!x.replied).length;
}
document.getElementById("seed").onclick=()=>{state.items=[
  {stars:5,body:"接客が最高でした。また来ます!",replied:false,reply:""},
  {stars:2,body:"待ち時間が長く残念でした。",replied:false,reply:""},
  {stars:4,body:"料理は美味しい。予約しやすさ◎",replied:false,reply:""}
];save();VQ.toast("Loaded");};
document.getElementById("gen").onclick=async()=>{
  if(state.current==null) return VQ.toast("Open a review");
  gen.disabled=true; await VQ.think(450);
  let text=VQ.reviewReply(state.items[state.current].stars,state.items[state.current].body);
  if(tone.value==="formal") text=text.replace("ありがとうございます","誠にありがとうございます");
  if(tone.value==="short") text=text.split("。").slice(0,2).join("。")+"。";
  reply.value=text; gen.disabled=false; VQ.toast("Drafted");
};
document.getElementById("saveR").onclick=()=>{if(state.current==null)return;state.items[state.current].reply=reply.value;state.items[state.current].replied=true;save();VQ.toast("Marked sent");};
document.getElementById("copyR").onclick=async()=>{await navigator.clipboard.writeText(reply.value);VQ.toast("Copied");};
render();
