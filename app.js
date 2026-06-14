const $=id=>document.getElementById(id);
const today=()=>new Date().toISOString().slice(0,10);
const STORE="mofunote_clean_v12";
let state={selectedPet:"moka",viewMonth:new Date(),selectedDate:today(),graph:"weight"};

const iconChoices=[
 {file:"animal_chinchilla.png",label:"チンチラ"},
 {file:"animal_degu.png",label:"デグー"},
 {file:"animal_guineapig.png",label:"モルモット"},
 {file:"animal_hamster.png",label:"ハムスター"},
 {file:"animal_rabbit.png",label:"うさぎ"}
];

function sample(){
 return {
  pets:[
   {id:"moka",name:"モカ",type:"チンチラ",sex:"♀",icon:"animal_chinchilla.png",photo:"",adoptionDate:"2024-03-15"},
   {id:"cocoa",name:"ココア",type:"デグー",sex:"♂",icon:"animal_degu.png",photo:"",adoptionDate:"2023-08-01"},
   {id:"maron",name:"まろん",type:"モルモット",sex:"♀",icon:"animal_guineapig.png",photo:"",adoptionDate:"2022-10-20"}
  ],
  records:{}, hospitals:[], medicines:[]
 };
}
let data=JSON.parse(localStorage.getItem(STORE)||"null")||sample();
if(Object.keys(data.records).length===0){
 const weights=[552,548,551,553,549,546,548,551,550,553,538,532,540,541];
 for(let i=13;i>=0;i--){let d=new Date();d.setDate(d.getDate()-i);let ds=d.toISOString().slice(0,10);data.records["moka_"+ds]={petId:"moka",date:ds,weight:weights[13-i],appetite:"◎",energy:"◎",poop:"普通",sandBath:i%2===0,sandMinutes:i%2===0?10:0,walk:i%3===0,walkMinutes:i%3===0?30:0,temp:23,humidity:45,memo:""};}
 data.records["cocoa_"+today()]={petId:"cocoa",date:today(),weight:525,appetite:"○",energy:"◎",poop:"普通",sandBath:true,sandMinutes:8,walk:false,walkMinutes:0};
 data.records["maron_"+today()]={petId:"maron",date:today(),weight:820,appetite:"◎",energy:"○",poop:"普通",sandBath:false,sandMinutes:0,walk:true,walkMinutes:20};
 data.hospitals=[{petId:"moka",date:"2025-05-10",name:"○○動物病院",reason:"定期健診",cost:3850,memo:"異常なし"}];
 data.medicines=[{petId:"moka",name:"整腸剤",dose:"1日2回",start:"2025-05-10",end:"2025-05-17",memo:""}];
 save();
}
function save(){localStorage.setItem(STORE,JSON.stringify(data));}
function pet(id){return data.pets.find(p=>p.id===id)||data.pets[0];}
function avatar(p){return `<div class="avatar">${p.photo?`<img src="${p.photo}">`:`<img src="${p.icon}">`}</div>`}
function latest(id){return Object.values(data.records).filter(r=>r.petId===id&&r.weight).sort((a,b)=>a.date.localeCompare(b.date)).pop();}
function daysSince(ds){if(!ds)return "-";return Math.floor((new Date()-new Date(ds+"T00:00:00"))/86400000);}

function show(view){document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));$(view).classList.add("active");document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===view)); if(view==="homeView")renderHome(); if(view==="calendarView")renderCalendar(); if(view==="recordView")renderRecord(); if(view==="graphView")renderGraph(); if(view==="profileView")renderProfile(); if(view==="medicalView")renderMedical(); if(view==="moreView")renderMore();}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>show(b.dataset.view));

function renderHome(){
 $("petList").innerHTML=data.pets.map(p=>{let r=latest(p.id)||{};return `<div class="pet-card" onclick="state.selectedPet='${p.id}';show('recordView')"><div class="pet-top">${avatar(p)}<div class="pet-info"><b>${p.name} <span style="color:var(--green)">${p.sex}</span></b><br><small>${p.type}</small><br><small>お迎えから ${daysSince(p.adoptionDate)}日</small></div><div class="weight">${r.weight||"--"}g<br><small>最新</small></div></div><div class="chips"><span class="chip">食欲 ${r.appetite||"○"}</span><span class="chip">元気 ${r.energy||"○"}</span><span class="chip">うんち ${r.poop||"○"}</span>${r.sandBath?'<span class="chip">砂浴び</span>':""}${r.walk?'<span class="chip">部屋んぽ</span>':""}</div></div>`}).join("");
}
$("openPetDialog").onclick=()=>{$("newName").value="";$("newType").value="チンチラ";$("newSex").value="♀";$("petDialog").showModal();}
$("closePet").onclick=()=>$("petDialog").close();
$("addPet").onclick=()=>{
 const name=$("newName").value.trim(); if(!name){alert("名前を入力してください");return;}
 const type=$("newType").value.trim()||"小動物"; const sex=$("newSex").value||"不明";
 let icon="animal_chinchilla.png"; if(type.includes("デグ"))icon="animal_degu.png"; else if(type.includes("モル"))icon="animal_guineapig.png"; else if(type.includes("ハム"))icon="animal_hamster.png"; else if(type.includes("うさ"))icon="animal_rabbit.png";
 const newPet={id:"pet_"+Date.now(),name,type,sex,icon,photo:"",adoptionDate:today()};
 data.pets.push(newPet); save(); $("petDialog").close(); state.selectedPet=newPet.id; renderHome(); alert(name+"を追加しました");
};

function renderRecord(){
 let p=pet(state.selectedPet); $("selectedPetBox").innerHTML=`${avatar(p)}<div><b>${p.name}</b><br><small>${p.type}</small></div>`; $("recordDate").value=state.selectedDate; loadRecord();
}
function loadRecord(){let r=data.records[state.selectedPet+"_"+$("recordDate").value]||{};["weight","sandMinutes","walkMinutes","temp","humidity","memo"].forEach(id=>$(id).value=r[id]||"");["appetite","energy","poop"].forEach(id=>{if(r[id])$(id).value=r[id]});$("sandBath").checked=!!r.sandBath;$("walk").checked=!!r.walk;}
$("recordDate").onchange=loadRecord;
$("recordForm").onsubmit=e=>{e.preventDefault();let ds=$("recordDate").value||today();data.records[state.selectedPet+"_"+ds]={petId:state.selectedPet,date:ds,weight:Number($("weight").value)||0,appetite:$("appetite").value,energy:$("energy").value,poop:$("poop").value,sandBath:$("sandBath").checked,sandMinutes:Number($("sandMinutes").value)||0,walk:$("walk").checked,walkMinutes:Number($("walkMinutes").value)||0,temp:Number($("temp").value)||0,humidity:Number($("humidity").value)||0,memo:$("memo").value};save();alert("保存しました");show("homeView");}

function renderTabs(id, cb){$(id).innerHTML=data.pets.map(p=>`<button class="${p.id===state.selectedPet?'active':''}" data-id="${p.id}">${p.name}</button>`).join("");$(id).querySelectorAll("button").forEach(b=>b.onclick=()=>{state.selectedPet=b.dataset.id;cb();});}
function renderProfile(){renderTabs("profileTabs",renderProfile);let p=pet(state.selectedPet);$("profileCard").innerHTML=`<div class="profile-img">${p.photo?`<img src="${p.photo}">`:`<img src="${p.icon}">`}</div><div class="row"><span>名前</span><b>${p.name}</b></div><div class="row"><span>種類</span><b>${p.type}</b></div><div class="row"><span>性別</span><b>${p.sex}</b></div><div class="row"><span>お迎え</span><b>${p.adoptionDate||"未設定"}</b></div>`;$("adoptionDate").value=p.adoptionDate||"";$("iconGrid").innerHTML=iconChoices.map(i=>`<button class="${p.icon===i.file?'selectedIcon':''}" data-file="${i.file}"><img src="${i.file}">${i.label}</button>`).join("");$("iconGrid").querySelectorAll("button").forEach(b=>b.onclick=()=>{p.icon=b.dataset.file;p.photo="";save();renderProfile();renderHome();});}
$("photoInput").onchange=e=>{let f=e.target.files[0];if(!f)return;let reader=new FileReader();reader.onload=()=>{pet(state.selectedPet).photo=reader.result;save();renderProfile();renderHome();};reader.readAsDataURL(f);}
$("removePhoto").onclick=()=>{pet(state.selectedPet).photo="";save();renderProfile();renderHome();}
$("saveProfile").onclick=()=>{pet(state.selectedPet).adoptionDate=$("adoptionDate").value;save();renderProfile();renderHome();alert("保存しました");}

function renderMedical(){renderTabs("medicalTabs",renderMedical);$("hospitalDate").value=today();$("medicineStart").value=today();renderHospitalList();renderMedicineList();}
$("hospitalForm").onsubmit=e=>{e.preventDefault();data.hospitals.push({petId:state.selectedPet,date:$("hospitalDate").value,name:$("hospitalName").value,reason:$("hospitalReason").value,cost:Number($("hospitalCost").value)||0,memo:$("hospitalMemo").value});save();renderHospitalList();alert("保存しました");}
$("medicineForm").onsubmit=e=>{e.preventDefault();data.medicines.push({petId:state.selectedPet,name:$("medicineName").value,dose:$("medicineDose").value,start:$("medicineStart").value,end:$("medicineEnd").value,memo:$("medicineMemo").value});save();renderMedicineList();alert("保存しました");}
function renderHospitalList(){$("hospitalList").innerHTML=data.hospitals.filter(h=>h.petId===state.selectedPet).map(h=>`<div class="card list"><b>🏥 ${h.date} ${h.name}</b><br>${h.reason}<br><small>${h.cost}円 ${h.memo||""}</small></div>`).join("");}
function renderMedicineList(){$("medicineList").innerHTML=data.medicines.filter(m=>m.petId===state.selectedPet).map(m=>`<div class="card list"><b>💊 ${m.name}</b><br>${m.dose}<br><small>${m.start}〜${m.end||"継続中"}</small></div>`).join("");}

function renderCalendar(){let y=state.viewMonth.getFullYear(),m=state.viewMonth.getMonth();$("monthTitle").textContent=`${y}年${m+1}月`;let start=new Date(y,m,1-new Date(y,m,1).getDay());let html="";for(let i=0;i<42;i++){let d=new Date(start);d.setDate(start.getDate()+i);let ds=d.toISOString().slice(0,10);let icons="";if(Object.values(data.records).some(r=>r.date===ds))icons+="●";if(data.hospitals.some(h=>h.date===ds))icons+="🏥";if(data.medicines.some(md=>md.start<=ds&&(!md.end||md.end>=ds)))icons+="💊";html+=`<div class="day ${d.getMonth()!==m?'other':''} ${ds===today()?'today':''}" onclick="state.selectedDate='${ds}';renderDay('${ds}')">${d.getDate()}<div class="day-icons">${icons}</div></div>`}$("calendar").innerHTML=html;renderDay(state.selectedDate);}
function renderDay(ds){$("dayTitle").textContent=ds+" の記録";let html="";Object.values(data.records).filter(r=>r.date===ds).forEach(r=>{let p=pet(r.petId);html+=`<div class="pet-card">${avatar(p)}<b>${p.name}</b> ${r.weight||"-"}g</div>`});$("dayList").innerHTML=html||'<p class="notice">記録はまだありません。</p>'}
$("prevMonth").onclick=()=>{state.viewMonth.setMonth(state.viewMonth.getMonth()-1);renderCalendar();}
$("nextMonth").onclick=()=>{state.viewMonth.setMonth(state.viewMonth.getMonth()+1);renderCalendar();}

document.querySelectorAll(".switch button").forEach(b=>b.onclick=()=>{state.graph=b.dataset.graph;document.querySelectorAll(".switch button").forEach(x=>x.classList.toggle("active",x===b));renderGraph();});
function renderGraph(){renderTabs("graphTabs",renderGraph);let rows=Object.values(data.records).filter(r=>r.petId===state.selectedPet).sort((a,b)=>a.date.localeCompare(b.date)).slice(-30);let key=state.graph==="sand"?"sandMinutes":state.graph==="walk"?"walkMinutes":"weight";draw(rows.map(r=>Number(r[key])||0));}
function draw(vals){let c=$("graph"),ctx=c.getContext("2d");ctx.clearRect(0,0,c.width,c.height);ctx.strokeStyle="#d9eadf";for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(35,25+i*40);ctx.lineTo(330,25+i*40);ctx.stroke();}if(!vals.length)return;let min=Math.min(...vals)-1,max=Math.max(...vals)+1;ctx.strokeStyle="#78a98b";ctx.fillStyle="#78a98b";ctx.lineWidth=3;ctx.beginPath();vals.forEach((v,i)=>{let x=40+i*(285/Math.max(1,vals.length-1));let y=185-((v-min)/(max-min||1))*150;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});ctx.stroke();}

function renderMore(){let p=pet(state.selectedPet);$("annivBox").innerHTML=`<b>🎂 お迎え記念日</b><p>${p.name}をお迎えして ${daysSince(p.adoptionDate)}日目です</p>`}
$("exportBtn").onclick=()=>{let blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});let a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="mofunote_data.json";a.click();}
$("resetBtn").onclick=()=>{localStorage.removeItem(STORE);location.href=location.pathname+"?v=cleanreset"+Date.now();}

if("serviceWorker" in navigator){navigator.serviceWorker.register("service-worker.js").catch(()=>{});}
renderHome();
