"use strict";
document.querySelectorAll(".nav-btn").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    ["board","staff","auto"].forEach(v=>document.getElementById("view-"+v).classList.toggle("hidden", btn.dataset.view!==v));
  };
});

const KEY="vq_shiftly_v1";
const DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const SLOTS=["AM","PM"];
const state=VQ.load(KEY,{staff:[{id:"1",name:"Aya",role:"Hall"},{id:"2",name:"Ken",role:"Kitchen"},{id:"3",name:"Rin",role:"Cashier"}],week:0,cells:{}});
function key(d,s){return state.week+":"+d+":"+s;}
function save(){VQ.store(KEY,state);render();}
function render(){
  let html="<thead><tr><th></th>"+DAYS.map(d=>"<th>"+d+"</th>").join("")+"</tr></thead><tbody>";
  SLOTS.forEach(s=>{html+="<tr><th>"+s+"</th>";DAYS.forEach(d=>{const k=key(d,s);const v=state.cells[k]||"";html+="<td><select data-k='"+k+"' style='margin:0'><option value=''>-</option>"+state.staff.map(st=>"<option value='"+st.id+"'"+(v===st.id?" selected":"")+">"+st.name+"</option>").join("")+"</select></td>";});html+="</tr>";});
  html+="</tbody>"; grid.innerHTML=html;
  grid.querySelectorAll("select").forEach(sel=>sel.onchange=()=>{state.cells[sel.dataset.k]=sel.value;save();});
  // conflicts: same person AM+PM same day ok; duplicate same slot
  const counts={}; Object.entries(state.cells).forEach(([k,v])=>{if(!v)return;const parts=k.split(":");const sig=parts[0]+parts[1]+parts[2]+":"+v;counts[sig]=(counts[sig]||0)+1;});
  const bad=Object.values(counts).some(c=>c>1);
  conflicts.textContent=bad?"Conflict: duplicate assignment detected":"No conflicts";
  conflicts.className="mini "+(bad?"warn-text":"ok-text");
  staff.innerHTML=state.staff.map((s,i)=>"<li><div><strong>"+s.name+"</strong> · "+s.role+"</div><button data-x='"+i+"'>Del</button></li>").join("");
  staff.querySelectorAll("[data-x]").forEach(b=>b.onclick=()=>{state.staff.splice(+b.dataset.x,1);save();});
}
document.getElementById("addS").onclick=()=>{if(!sname.value.trim())return;state.staff.push({id:VQ.uid(),name:sname.value.trim(),role:role.value});sname.value="";save();};
document.getElementById("prevW").onclick=()=>{state.week--;save();};
document.getElementById("nextW").onclick=()=>{state.week++;save();};
document.getElementById("fill").onclick=()=>{let i=0;DAYS.forEach(d=>SLOTS.forEach(s=>{const k=key(d,s);if(!state.cells[k]){state.cells[k]=state.staff[i%state.staff.length].id;i++;}}));save();VQ.toast("Filled");};
document.getElementById("clr").onclick=()=>{Object.keys(state.cells).filter(k=>k.startsWith(state.week+":")).forEach(k=>delete state.cells[k]);save();};
render();
