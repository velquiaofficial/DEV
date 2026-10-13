/* VQ_ENRICHED */
"use strict";
document.querySelectorAll(".nav-btn").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    ["resume","interview","export"].forEach(v=>document.getElementById("view-"+v).classList.toggle("hidden", btn.dataset.view!==v));
  };
});

let resume="";
document.getElementById("gen").onclick=async()=>{
  const name=document.getElementById("name").value.trim()||"Candidate";
  const role=document.getElementById("role").value.trim()||"Product role";
  const exp=document.getElementById("exp").value.trim()||"複数プロダクトの企画と実装を担当";
  document.getElementById("gen").disabled=true; await VQ.think(500);
  resume=["職務経歴書","","氏名: "+name,"志望: "+role,"","■ 概要","成果にこだわる実務家。"+exp,"","■ 経験",exp,"","■ 自己PR",role+"として、速度と品質の両立でチームの前進に貢献します。"].join("\n");
  document.getElementById("resumeOut").textContent=resume;
  document.getElementById("expOut").textContent=resume;
  document.getElementById("iq").textContent=VQ.interviewQ(role);
  document.getElementById("gen").disabled=false; VQ.toast("生成完了");
};
document.getElementById("inext").onclick=()=>{document.getElementById("iq").textContent=VQ.interviewQ(document.getElementById("role").value||"この職種");document.getElementById("ians").value="";document.getElementById("ifb").textContent="";};
document.getElementById("icoach").onclick=async()=>{const a=document.getElementById("ians").value.trim(); if(!a) return VQ.toast("回答を入力"); await VQ.think(400); document.getElementById("ifb").textContent="Feedback: 結論→根拠→学びの順に整えると通過率が上がります。数字を1つ入れると説得力が増します。";};
document.getElementById("copy").onclick=async()=>{if(!resume)return VQ.toast("先に生成"); await navigator.clipboard.writeText(resume); VQ.toast("コピー");};


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
