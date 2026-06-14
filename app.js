const $=id=>document.getElementById(id);
const today=()=>new Date().toISOString().slice(0,10);
let state={viewMonth:new Date(),selectedPet:"moka",selectedDate:today(),graph:"weight"};
const iconChoices=[
  {icon:"animal_chinchilla.png",label:"チンチラ",kind:"image"},
  {icon:"animal_degu.png",label:"デグー",kind:"image"},
  {icon:"animal_guineapig.png",label:"モルモット",kind:"image"},
  {icon:"animal_hamster.png",label:"ハムスター",kind:"image"},
  {icon:"animal_rabbit.png",label:"うさぎ",kind:"image"},
  {icon:"animal_chinchilla.png",label:"チンチラ絵文字",kind:"emoji"},
  {icon:"animal_degu.png",label:"小動物絵文字",kind:"emoji"}
];
const samplePets=[
{id:"moka",name:"モカ",type:"チンチラ",sex:"♀",icon:"🐭",adoptionDate:"2024-03-15",photo:""},
{id:"cocoa",name:"ココア",type:"デグー",sex:"♂",icon:"animal_guineapig.png",adoptionDate:"2023-08-01",photo:""},
{id:"maron",name:"まろん",type:"モルモット",sex:"♀",icon:"🐹",adoptionDate:"2022-10-20",photo:""}
];
function makeSamples(){
 const rec={}; const weights=[552,548,551,553,549,546,548,551,550,553,538,532,540,541];
 for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toISOString().slice(0,10);rec["moka_"+ds]={petId:"moka",date:ds,weight:weights[13-i],pellet:18,hay:"よく食べた",appetite:"◎",energy:"◎",poop:"普通",sandBath:i%2===0,sandMinutes:i%2===0?10+i%5:0,walk:i%3===0,walkMinutes:i%3===0?30+i:0,temp:22.5,humidity:55,memo:i===0?"砂浴びたくさんしてた😊":""};}
 rec["cocoa_"+today()]={petId:"cocoa",date:today(),weight:525,appetite:"○",energy:"◎",poop:"普通",sandBath:true,sandMinutes:8,walk:false};
 rec["maron_"+today()]={petId:"maron",date:today(),weight:820,appetite:"◎",energy:"○",poop:"普通",walk:true,walkMinutes:20};
 return rec;
}
let pets=JSON.parse(localStorage.getItem("mofunote_pets_v11")||"null")||samplePets;
let records=JSON.parse(localStorage.getItem("mofunote_records_v11")||"null")||makeSamples();
let hospitals=JSON.parse(localStorage.getItem("mofunote_hospitals_v11")||"null")||[{petId:"moka",date:"2025-05-10",name:"○○動物病院",reason:"定期健診",cost:3850,memo:"特に異常なし"}];
let medicines=JSON.parse(localStorage.getItem("mofunote_medicines_v11")||"null")||[{petId:"moka",name:"整腸剤",dose:"1日2回",start:"2025-05-10",end:"2025-05-17",memo:"食欲が戻るまで"}];

function save(){localStorage.setItem("mofunote_pets_v11",JSON.stringify(pets));localStorage.setItem("mofunote_records_v11",JSON.stringify(records));localStorage.setItem("mofunote_hospitals_v11",JSON.stringify(hospitals));localStorage.setItem("mofunote_medicines_v11",JSON.stringify(medicines));}
function key(p,d){return p+"_"+d}
function latest(petId){return Object.values(records).filter(r=>r.petId===petId&&r.weight).sort((a,b)=>a.date.localeCompare(b.date)).pop()}
function pet(id){return pets.find(p=>p.id===id)||pets[0]}
function petAvatar(p, cls="avatar"){
  const isImage = p.icon && (p.icon.endsWith(".png") || p.icon.endsWith(".jpg") || p.icon.endsWith(".jpeg") || p.icon.endsWith(".webp"));
  return `<div class="${cls}">${p.photo?`<img src="${p.photo}">`:(isImage?`<img src="${p.icon}">`:p.icon)}</div>`
}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>show(b.dataset.view));

function renderHome(){
 const box=$("petList");box.innerHTML="";
 pets.forEach(p=>{const r=latest(p.id)||{};const activeMed=medicines.find(m=>m.petId===p.id && (!m.end || m.end>=today()));
 const div=document.createElement("div");div.className="petCard";div.innerHTML=`<div class="petTop">${petAvatar(p)}<div class="petInfo"><b>${p.name} <span style="color:var(--green)">${p.sex}</span></b><br><small>${p.type}</small><br><small>お迎えから ${daysSince(p.adoptionDate)}日</small></div><div class="weightBox">${r.weight?r.weight+"g":"--"}<br><small>最新</small></div></div><div class="chips"><span class="chip">食欲 ${r.appetite||"○"}</span><span class="chip">元気 ${r.energy||"○"}</span><span class="chip">うんち ${r.poop?"○":"○"}</span>${r.sandBath?'<span class="chip">砂浴び</span>':""}${r.walk?'<span class="chip">部屋んぽ</span>':""}${activeMed?'<span class="chip">💊 投薬中</span>':""}</div>`;
 div.onclick=()=>{state.selectedPet=p.id;show("recordView")}; box.appendChild(div);});
}

function renderRecordForm(){const p=pet(state.selectedPet);$("recordPetMini").innerHTML=`${petAvatar(p)}<div><b>${p.name} ${p.sex}</b><br><small>${p.type}</small></div>`;$("date").value=state.selectedDate;loadRecord();}
function loadRecord(){const r=records[key(state.selectedPet,$("date").value)]||{};["weight","pellet","sandMinutes","walkMinutes","temp","humidity","memo"].forEach(id=>$(id).value=r[id]||"");["hay","appetite","energy","poop"].forEach(id=>{if(r[id])$(id).value=r[id]});$("sandBath").checked=!!r.sandBath;$("walk").checked=!!r.walk;}
$("date").onchange=loadRecord;
$("recordForm").onsubmit=e=>{e.preventDefault();const ds=$("date").value||today();records[key(state.selectedPet,ds)]={petId:state.selectedPet,date:ds,weight:Number($("weight").value)||0,pellet:Number($("pellet").value)||0,hay:$("hay").value,appetite:$("appetite").value,energy:$("energy").value,poop:$("poop").value,sandBath:$("sandBath").checked,sandMinutes:Number($("sandMinutes").value)||0,walk:$("walk").checked,walkMinutes:Number($("walkMinutes").value)||0,temp:Number($("temp").value)||0,humidity:Number($("humidity").value)||0,memo:$("memo").value};save();renderHome();alert("保存しました");show("homeView");}

function renderCalendar(){const y=state.viewMonth.getFullYear(),m=state.viewMonth.getMonth();$("monthTitle").textContent=`${y}年${m+1}月`;const first=new Date(y,m,1),start=new Date(y,m,1-first.getDay());$("calendar").innerHTML="";for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const ds=d.toISOString().slice(0,10);const recs=Object.values(records).filter(r=>r.date===ds);const hos=hospitals.some(h=>h.date===ds);const med=medicines.some(md=>md.start<=ds && (!md.end || md.end>=ds));const ann=pets.some(p=>p.adoptionDate && p.adoptionDate.slice(5)===ds.slice(5));const el=document.createElement("div");el.className="day "+(d.getMonth()!==m?"other ":"")+(ds===today()?"today":"");el.innerHTML=`<div>${d.getDate()}</div><div class="dayIcons">${recs.length?'<i class="dot"></i>':""}${hos?"🏥":""}${med?"💊":""}${ann?"🎂":""}</div>`;el.onclick=()=>{state.selectedDate=ds;renderDay(ds)};$("calendar").appendChild(el);}renderDay(state.selectedDate);}
function renderDay(ds){$("dayTitle").textContent=ds.replaceAll("-","/")+" の記録";let html="";Object.values(records).filter(r=>r.date===ds).forEach(r=>{const p=pet(r.petId);html+=`<div class="dayRecord">${petAvatar(p)}<div><b>${p.name}</b><br><small>${r.weight||"-"}g 食欲${r.appetite||"-"} ${r.sandBath?"砂浴び"+(r.sandMinutes||"")+"分":""} ${r.walk?"部屋んぽ"+(r.walkMinutes||"")+"分":""}</small></div></div>`});hospitals.filter(h=>h.date===ds).forEach(h=>{const p=pet(h.petId);html+=`<div class="dayRecord">${petAvatar(p)}<div><b>🏥 ${p.name} 通院</b><br><small>${h.name||""} ${h.reason||""}</small></div></div>`});medicines.filter(m=>m.start<=ds && (!m.end || m.end>=ds)).forEach(m=>{const p=pet(m.petId);html+=`<div class="dayRecord">${petAvatar(p)}<div><b>💊 ${p.name} 投薬</b><br><small>${m.name} ${m.dose}</small></div></div>`});$("dayRecords").innerHTML=html||'<p class="notice">記録はまだありません。</p>';}
$("prevMonth").onclick=()=>{state.viewMonth.setMonth(state.viewMonth.getMonth()-1);renderCalendar();}
$("nextMonth").onclick=()=>{state.viewMonth.setMonth(state.viewMonth.getMonth()+1);renderCalendar();}

function renderProfile(){renderPetTabs("profilePetTabs",()=>renderProfile());const p=pet(state.selectedPet);$("profileCard").innerHTML=`<div class="profilePhoto">${p.photo?`<img src="${p.photo}">`:(p.icon&&p.icon.endsWith(".png")?`<img src="${p.icon}">`:p.icon)}</div><div class="profileRows"><div><span>名前</span><b>${p.name}</b></div><div><span>種類</span><b>${p.type}</b></div><div><span>性別</span><b>${p.sex}</b></div><div><span>お迎え</span><b>${p.adoptionDate||"未設定"}</b></div><div><span>お迎えから</span><b>${daysSince(p.adoptionDate)}日</b></div></div>`;
 $("adoptionDate").value=p.adoptionDate||"";
 $("iconGrid").innerHTML=iconChoices.map(i=>`<button class="iconChoice ${p.icon===i.icon?'active':''}" data-icon="${i.icon}"><span>${i.kind==="image"?`<img src="${i.icon}">`:i.icon}</span>${i.label}</button>`).join("");
 $("iconGrid").querySelectorAll("button").forEach(b=>b.onclick=()=>{p.icon=b.dataset.icon;p.photo="";save();renderProfile();renderHome();});
}
function renderPetTabs(id, cb){const box=$(id);box.innerHTML=pets.map(p=>`<button class="${p.id===state.selectedPet?'active':''}" data-pet="${p.id}">${p.name}</button>`).join("");box.querySelectorAll("button").forEach(b=>b.onclick=()=>{state.selectedPet=b.dataset.pet;cb&&cb();});}
$("photoInput").onchange=e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{pet(state.selectedPet).photo=reader.result;save();renderProfile();renderHome();};reader.readAsDataURL(file);}
$("removePhotoBtn").onclick=()=>{pet(state.selectedPet).photo="";save();renderProfile();renderHome();}
$("saveProfileBtn").onclick=()=>{pet(state.selectedPet).adoptionDate=$("adoptionDate").value;save();renderProfile();renderHome();alert("保存しました");}

function renderMedical(){renderPetTabs("medicalPetTabs",()=>renderMedical());$("hospitalDate").value=today();$("medicineStart").value=today();renderHospitalList();renderMedicineList();}
$("hospitalForm").onsubmit=e=>{e.preventDefault();hospitals.push({petId:state.selectedPet,date:$("hospitalDate").value,name:$("hospitalName").value,reason:$("hospitalReason").value,cost:Number($("hospitalCost").value)||0,memo:$("hospitalMemo").value});save();renderHospitalList();alert("通院記録を保存しました");}
$("medicineForm").onsubmit=e=>{e.preventDefault();medicines.push({petId:state.selectedPet,name:$("medicineName").value,dose:$("medicineDose").value,start:$("medicineStart").value,end:$("medicineEnd").value,memo:$("medicineMemo").value});save();renderMedicineList();alert("投薬記録を保存しました");}
function renderHospitalList(){const rows=hospitals.filter(h=>h.petId===state.selectedPet).sort((a,b)=>b.date.localeCompare(a.date));$("hospitalList").innerHTML=rows.map(h=>`<div class="listCard"><b>${h.date} 🏥 ${h.name||""}</b><br>${h.reason||""}<br><small>費用：${h.cost||0}円 ${h.memo||""}</small></div>`).join("");}
function renderMedicineList(){const rows=medicines.filter(m=>m.petId===state.selectedPet).sort((a,b)=>b.start.localeCompare(a.start));$("medicineList").innerHTML=rows.map(m=>`<div class="listCard"><b>💊 ${m.name||""}</b><br>${m.dose||""}<br><small>${m.start||""} ～ ${m.end||"継続中"} ${m.memo||""}</small></div>`).join("");}

function renderGraph(){renderPetTabs("graphPetTabs",()=>renderGraph());document.querySelectorAll(".graphSwitch button").forEach(b=>{b.classList.toggle("active",b.dataset.graph===state.graph);b.onclick=()=>{state.graph=b.dataset.graph;renderGraph();}});const rows=Object.values(records).filter(r=>r.petId===state.selectedPet).sort((a,b)=>a.date.localeCompare(b.date)).slice(-30);let field="weight", unit="g"; if(state.graph==="sand"){field="sandMinutes";unit="分"} if(state.graph==="walk"){field="walkMinutes";unit="分"};const vals=rows.map(r=>({date:r.date,value:Number(r[field])||0}));drawGraph(vals, unit);const nums=vals.map(r=>r.value);$("maxValue").textContent=nums.length?Math.max(...nums)+unit:"-";$("minValue").textContent=nums.length?Math.min(...nums)+unit:"-";$("diffValue").textContent=nums.length>1?(nums.at(-1)-nums[0])+unit:"-";}
function drawGraph(rows, unit){const c=$("graph"),ctx=c.getContext("2d");ctx.clearRect(0,0,c.width,c.height);ctx.strokeStyle="#d9eadf";ctx.lineWidth=1;for(let i=0;i<5;i++){let y=25+i*40;ctx.beginPath();ctx.moveTo(35,y);ctx.lineTo(330,y);ctx.stroke();}if(!rows.length)return;const vals=rows.map(r=>r.value),min=Math.min(...vals)-1,max=Math.max(...vals)+1;ctx.strokeStyle="#78a98b";ctx.fillStyle="#78a98b";ctx.lineWidth=3;ctx.beginPath();rows.forEach((r,i)=>{const x=40+i*(285/Math.max(1,rows.length-1));const y=185-((r.value-min)/(max-min||1))*150;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.stroke();rows.forEach((r,i)=>{const x=40+i*(285/Math.max(1,rows.length-1));const y=185-((r.value-min)/(max-min||1))*150;ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();});ctx.fillStyle="#607469";ctx.font="12px sans-serif";ctx.fillText(max+unit,2,28);ctx.fillText(min+unit,2,185);}

function renderMore(){const p=pet(state.selectedPet);$("annivBox").innerHTML=`<div><b>🎂 お迎え記念日</b><p>${p.name}をお迎えして<br><strong>${daysSince(p.adoptionDate)}日目です</strong></p></div><span>${p.photo?`<img src="${p.photo}" style="width:64px;height:64px;border-radius:22px;object-fit:cover">`:p.icon}</span>`;}

$("addPetBtn").onclick=()=>{
  $("newName").value="";
  $("newType").value="チンチラ";
  $("newSex").value="♀";
  $("petDialog").showModal();
};

$("closePet").onclick=()=>{
  document.activeElement && document.activeElement.blur();
  $("petDialog").close();
};

$("savePet").onclick=(e)=>{
  e.preventDefault();
  document.activeElement && document.activeElement.blur();

  const name=$("newName").value.trim();
  if(!name){
    alert("名前を入力してください");
    $("newName").focus();
    return;
  }

  const type=$("newType").value.trim()||"小動物";
  const sex=$("newSex").value||"不明";
  let icon="animal_chinchilla.png";
  if(type.includes("デグ")) icon="animal_degu.png";
  else if(type.includes("モル")) icon="animal_guineapig.png";
  else if(type.includes("ハム")) icon="animal_hamster.png";
  else if(type.includes("うさ")) icon="animal_rabbit.png";
  else if(type.includes("チン")) icon="animal_chinchilla.png";

  pets.push({
    id:String(Date.now()),
    name,
    type,
    sex,
    icon,
    adoptionDate:today(),
    photo:""
  });

  save();
  $("petDialog").close();
  renderHome();
  alert("ペットを追加しました");
};
$("exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify({pets,records,hospitals,medicines},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="mofunote_data.json";a.click();}
$("resetBtn").onclick=()=>{localStorage.removeItem("mofunote_pets_v11");localStorage.removeItem("mofunote_records_v11");localStorage.removeItem("mofunote_hospitals_v11");localStorage.removeItem("mofunote_medicines_v11");location.reload();}
if("serviceWorker" in navigator){navigator.serviceWorker.register("service-worker.js").catch(()=>{});}
renderHome();renderCalendar();renderGraph();renderRecordForm();



// add button fix v2
function addPetFromDialog(){
  const nameEl = document.getElementById("newName");
  const typeEl = document.getElementById("newType");
  const sexEl = document.getElementById("newSex");
  if(!nameEl || !typeEl || !sexEl){ alert("入力欄が見つかりません"); return; }

  const name = nameEl.value.trim();
  if(!name){
    alert("名前を入力してください");
    nameEl.focus();
    return;
  }

  const type = typeEl.value.trim() || "小動物";
  const sex = sexEl.value || "不明";

  let icon = "animal_chinchilla.png";
  if(type.includes("デグ")) icon = "animal_degu.png";
  else if(type.includes("モル")) icon = "animal_guineapig.png";
  else if(type.includes("ハム")) icon = "animal_hamster.png";
  else if(type.includes("うさ")) icon = "animal_rabbit.png";
  else if(type.includes("チン")) icon = "animal_chinchilla.png";

  pets.push({
    id: String(Date.now()),
    name: name,
    type: type,
    sex: sex,
    icon: icon,
    adoptionDate: today(),
    photo: ""
  });

  save();
  const dialog = document.getElementById("petDialog");
  if(dialog && dialog.open) dialog.close();
  renderHome();
  alert("ペットを追加しました");
}

setTimeout(() => {
  const addBtn = document.getElementById("savePet");
  const closeBtn = document.getElementById("closePet");
  const plusBtn = document.getElementById("addPetBtn");

  if(plusBtn){
    plusBtn.onclick = () => {
      document.getElementById("newName").value = "";
      document.getElementById("newType").value = "チンチラ";
      document.getElementById("newSex").value = "♀";
      document.getElementById("petDialog").showModal();
    };
  }

  if(closeBtn){
    closeBtn.onclick = () => {
      document.activeElement && document.activeElement.blur();
      document.getElementById("petDialog").close();
    };
  }

  if(addBtn){
    addBtn.disabled = false;
    addBtn.removeAttribute("disabled");
    addBtn.style.opacity = "1";
    addBtn.style.pointerEvents = "auto";
    addBtn.onclick = (e) => { e.preventDefault(); addPetFromDialog(); };
    addBtn.ontouchend = (e) => { e.preventDefault(); addPetFromDialog(); };
  }
}, 300);



// pet add reload fix v3
function chooseAnimalIconByType(type){
  if(type.includes("デグ")) return "animal_degu.png";
  if(type.includes("モル")) return "animal_guineapig.png";
  if(type.includes("ハム")) return "animal_hamster.png";
  if(type.includes("うさ")) return "animal_rabbit.png";
  if(type.includes("チン")) return "animal_chinchilla.png";
  return "animal_chinchilla.png";
}

function forceAddPet(){
  const nameEl = document.getElementById("newName");
  const typeEl = document.getElementById("newType");
  const sexEl = document.getElementById("newSex");

  const name = nameEl ? nameEl.value.trim() : "";
  const type = typeEl ? (typeEl.value.trim() || "小動物") : "小動物";
  const sex = sexEl ? (sexEl.value || "不明") : "不明";

  if(!name){
    alert("名前を入力してください");
    if(nameEl) nameEl.focus();
    return false;
  }

  const newPet = {
    id: "pet_" + Date.now(),
    name: name,
    type: type,
    sex: sex,
    icon: chooseAnimalIconByType(type),
    adoptionDate: today(),
    photo: ""
  };

  pets.push(newPet);
  localStorage.setItem("mofunote_pets_v11", JSON.stringify(pets));
  localStorage.setItem("mofunote_records_v11", JSON.stringify(records));
  localStorage.setItem("mofunote_hospitals_v11", JSON.stringify(hospitals));
  localStorage.setItem("mofunote_medicines_v11", JSON.stringify(medicines));
  alert(name + "を追加しました");

  const dialog = document.getElementById("petDialog");
  if(dialog && dialog.open) dialog.close();

  location.href = location.pathname + "?v=petaddfix3&t=" + Date.now();
  return true;
}

window.addEventListener("load", () => {
  const btn = document.getElementById("savePet");
  if(btn){
    btn.disabled = false;
    btn.removeAttribute("disabled");
    btn.classList.add("addPetSubmit");
    btn.textContent = "追加する";
    btn.style.opacity = "1";
    btn.style.pointerEvents = "auto";
    btn.style.background = "linear-gradient(135deg,#91c7a5,#5e9976)";
    btn.style.color = "#fff";
    btn.onclick = (e) => { e.preventDefault(); forceAddPet(); };
    btn.ontouchend = (e) => { e.preventDefault(); forceAddPet(); };
  }
});



// icon migration + add visible fix v4
function normalizeAnimalIconForPet(p){
  if(!p) return p;
  const type = p.type || "";
  const icon = p.icon || "";

  if(icon.endsWith && icon.endsWith(".png")) return p;

  if(type.includes("チン")) p.icon = "animal_chinchilla.png";
  else if(type.includes("デグ")) p.icon = "animal_degu.png";
  else if(type.includes("モル")) p.icon = "animal_guineapig.png";
  else if(type.includes("ハム")) p.icon = "animal_hamster.png";
  else if(type.includes("うさ")) p.icon = "animal_rabbit.png";
  else p.icon = "animal_chinchilla.png";

  return p;
}

function migrateOldPetIcons(){
  pets = pets.map(normalizeAnimalIconForPet);
  localStorage.setItem("mofunote_pets_v11", JSON.stringify(pets));
}

function addPetFixedV4(){
  const nameEl = document.getElementById("newName");
  const typeEl = document.getElementById("newType");
  const sexEl = document.getElementById("newSex");

  const name = nameEl ? nameEl.value.trim() : "";
  const type = typeEl ? (typeEl.value.trim() || "小動物") : "小動物";
  const sex = sexEl ? (sexEl.value || "不明") : "不明";

  if(!name){
    alert("名前を入力してください");
    if(nameEl) nameEl.focus();
    return;
  }

  const newPet = normalizeAnimalIconForPet({
    id: "pet_" + Date.now(),
    name: name,
    type: type,
    sex: sex,
    adoptionDate: today(),
    photo: ""
  });

  pets.push(newPet);
  state.selectedPet = newPet.id;

  localStorage.setItem("mofunote_pets_v11", JSON.stringify(pets));
  localStorage.setItem("mofunote_records_v11", JSON.stringify(records));
  localStorage.setItem("mofunote_hospitals_v11", JSON.stringify(hospitals));
  localStorage.setItem("mofunote_medicines_v11", JSON.stringify(medicines));

  const dialog = document.getElementById("petDialog");
  if(dialog && dialog.open) dialog.close();

  renderHome();
  alert(name + "を追加しました。ホームの一番下に追加されています。");
}

window.addEventListener("load", () => {
  migrateOldPetIcons();
  renderHome();

  const btn = document.getElementById("savePet");
  if(btn){
    btn.disabled = false;
    btn.removeAttribute("disabled");
    btn.textContent = "追加する";
    btn.style.opacity = "1";
    btn.style.pointerEvents = "auto";
    btn.style.background = "linear-gradient(135deg,#91c7a5,#5e9976)";
    btn.style.color = "#fff";
    btn.onclick = (e) => { e.preventDefault(); addPetFixedV4(); };
    btn.ontouchend = (e) => { e.preventDefault(); addPetFixedV4(); };
  }
});
