/* VQ_ENRICHED */
"use strict";
document.querySelectorAll(".nav-btn").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    ["make","library"].forEach(v=>document.getElementById("view-"+v).classList.toggle("hidden", btn.dataset.view!==v));
  };
});

const KEY="vq_shelfshot_v1";
const state=VQ.load(KEY,{items:[]});
let last="";
function render(){document.getElementById("lib").innerHTML=state.items.map((x,i)=>"<li><div><strong>"+x.name+"</strong><br><span class='muted'>"+x.ch+" · "+x.at+"</span></div><button data-i='"+i+"'>削除</button></li>").join("")||"<li class='muted'>なし</li>";document.getElementById("lib").querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{state.items.splice(+b.dataset.i,1);VQ.store(KEY,state);render();});}
document.getElementById("gen").onclick=async()=>{
  const name=document.getElementById("pname").value.trim()||"プレミアム商品";
  const feats=document.getElementById("feats").value;
  const ch=document.getElementById("ch").value;
  document.getElementById("gen").disabled=true; await VQ.think(550);
  const copy=VQ.productCopy(name,feats);
  const prompt="studio product photo of "+name+", seamless background, accurate color, commercial lighting, "+feats;
  last=["【"+ch+" 商品説明】",copy,"","【画像プロンプト】",prompt,"","【広告見出し】",name+" — 今日から、選び方が変わる。"].join("\n");
  document.getElementById("out").textContent=last;
  document.getElementById("gen").disabled=false; VQ.toast("生成完了");
};
document.getElementById("save").onclick=()=>{if(!last)return VQ.toast("先に生成");state.items.unshift({name:document.getElementById("pname").value||"商品",ch:document.getElementById("ch").value,body:last,at:new Date().toLocaleString("ja-JP")});VQ.store(KEY,state);render();VQ.toast("保存しました");};
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
