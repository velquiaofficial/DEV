/* VQ_ENRICHED */
"use strict";
document.querySelectorAll(".nav-btn").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    ["chat","drill","progress"].forEach(v=>document.getElementById("view-"+v).classList.toggle("hidden", btn.dataset.view!==v));
  };
});

const KEY="vq_lingualoop_v1";
const state=VQ.load(KEY,{sessions:0,lines:0,streak:1});
function bubble(role,text){const d=document.createElement("div");d.className="bubble "+role;d.textContent=text;const c=document.getElementById("chat");c.appendChild(d);c.scrollTop=99999;}
function stats(){document.getElementById("streak").textContent=state.streak;document.getElementById("sess").textContent=state.sessions;document.getElementById("lines").textContent=state.lines;document.getElementById("lvl").textContent={beginner:"A2",intermediate:"B1",advanced:"C1"}[document.getElementById("lv").value];VQ.store(KEY,state);}
async function send(){const text=document.getElementById("msg").value.trim();if(!text)return;document.getElementById("msg").value="";bubble("user",text);state.lines++;await VQ.think(450);bubble("bot",VQ.langReply(document.getElementById("lv").value,text));state.sessions++;stats();}
document.getElementById("send").onclick=send;document.getElementById("msg").onkeydown=e=>{if(e.key==="Enter")send();};
const drills=[["Translate: 昨日は忙しかった","I was busy yesterday."],["Make a question about weekend plans","What are your plans for the weekend?"]];
let di=0; document.getElementById("q").textContent=drills[0][0];
document.getElementById("check").onclick=()=>{const a=document.getElementById("ans").value.trim(); document.getElementById("fb").textContent=a?("Sample: "+drills[di][1]):"Answer first"; di=(di+1)%drills.length; document.getElementById("q").textContent=drills[di][0]; document.getElementById("ans").value="";};
bubble("bot","Hi! Tell me about your morning routine in English.");
stats();


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
