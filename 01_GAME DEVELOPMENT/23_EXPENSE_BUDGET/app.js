/* VQ_ENRICHED */
"use strict";
document.querySelectorAll(".nav-btn").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    ["add","budget","report"].forEach(v=>document.getElementById("view-"+v).classList.toggle("hidden", btn.dataset.view!==v));
  };
});

const KEY="vq_ledgerly_v1";
const state=VQ.load(KEY,{items:[],budget:80000});
function yen(n){return "¥"+Math.round(n).toLocaleString("ja-JP");}
function render(){
  document.getElementById("budget").value=state.budget;
  document.getElementById("recent").innerHTML=state.items.slice(0,12).map((x,i)=>"<li><div><strong>"+yen(x.amt)+"</strong> "+x.cat+"<br><span class='muted'>"+x.memo+"</span></div><button data-i='"+i+"'>削除</button></li>").join("")||"<li class='muted'>なし</li>";
  document.getElementById("recent").querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{state.items.splice(+b.dataset.i,1);save();});
  const total=state.items.reduce((s,x)=>s+x.amt,0);
  const map={}; state.items.forEach(x=>map[x.cat]=(map[x.cat]||0)+x.amt);
  const top=Object.entries(map).sort((a,b)=>b[1]-a[1])[0];
  document.getElementById("total").textContent=yen(total);
  document.getElementById("left").textContent=yen(state.budget-total);
  document.getElementById("top").textContent=top?top[0]:"-";
  document.getElementById("byCat").innerHTML=Object.entries(map).map(([k,v])=>"<li><div>"+k+"</div><strong>"+yen(v)+"</strong></li>").join("")||"<li class='muted'>なし</li>";
  document.getElementById("budgetMsg").textContent=total>state.budget?"予算超過です":"予算内で順調です";
}
function save(){VQ.store(KEY,state);render();}
document.getElementById("add").onclick=()=>{const amt=+document.getElementById("amt").value; if(!amt)return VQ.toast("金額を入力"); state.items.unshift({amt,cat:document.getElementById("cat").value,memo:document.getElementById("memo").value||"-",at:Date.now()}); document.getElementById("amt").value=""; document.getElementById("memo").value=""; save(); VQ.toast("追加");};
document.getElementById("saveBudget").onclick=()=>{state.budget=+document.getElementById("budget").value||0; save(); VQ.toast("予算保存");};
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
