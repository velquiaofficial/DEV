"use strict";
document.querySelectorAll(".nav-btn").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    ["editor","list","settings"].forEach(v=>document.getElementById("view-"+v).classList.toggle("hidden", btn.dataset.view!==v));
  };
});

const KEY="vq_billfold_v1";
const state=VQ.load(KEY,{lines:[],docs:[],settings:{co:"VELQUIA",bank:"Please pay within 14 days."},preview:""});
function save(){VQ.store(KEY,state);render();}
function render(){
  co.value=state.settings.co; bank.value=state.settings.bank;
  lines.innerHTML=state.lines.map((l,i)=>"<li><div>"+l.name+" ×"+l.qty+" @ ¥"+l.price.toLocaleString()+"</div><button data-x='"+i+"'>Del</button></li>").join("")||"<div class='empty'>No lines</div>";
  lines.querySelectorAll("[data-x]").forEach(b=>b.onclick=()=>{state.lines.splice(+b.dataset.x,1);save();});
  prev.textContent=state.preview||"";
  docs.innerHTML=state.docs.map(d=>"<li><div><strong>"+d.type.toUpperCase()+" · "+d.client+"</strong><br><span class='muted'>¥"+d.total.toLocaleString()+"</span></div><span class='badge'>"+d.at+"</span></li>").join("")||"<div class='empty'>None</div>";
}
document.getElementById("addLine").onclick=()=>{state.lines.push({name:iname.value||"Item",qty:+iqty.value||1,price:+iprice.value||0});save();};
document.getElementById("build").onclick=()=>{
  const inv=VQ.invoiceLines(state.lines);
  const type=dtype.value;
  state.preview=[state.settings.co,type.toUpperCase(),"Client: "+(client.value||"Client"),"",...inv.rows.map(r=>r.no+". "+r.name+"  "+r.qty+" × ¥"+r.price.toLocaleString()+" = ¥"+r.sum.toLocaleString()),"","Subtotal ¥"+inv.sub.toLocaleString(),"Tax(10%) ¥"+inv.tax.toLocaleString(),"TOTAL ¥"+inv.total.toLocaleString(),"","",state.settings.bank].join("\n");
  state._total=inv.total; save(); VQ.toast("Built");
};
document.getElementById("saveD").onclick=()=>{if(!state.preview)return;state.docs.unshift({type:dtype.value,client:client.value||"Client",total:state._total||0,body:state.preview,at:new Date().toLocaleDateString()});save();VQ.toast("Saved");};
document.getElementById("expD").onclick=()=>{if(!state.preview)return;VQ.downloadText((dtype.value)+".txt",state.preview);};
document.getElementById("saveSet").onclick=()=>{state.settings={co:co.value,bank:bank.value};save();VQ.toast("Settings saved");};
render();
