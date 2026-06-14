const $=id=>document.getElementById(id);
const today=()=>new Date().toISOString().slice(0,10);
const STORE="mofunote_v13_empty_delete";
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
  pets:[],
  records:{},
  hospitals:[],
  medicines:[]
 };
}
let data=JSON.parse(localStorage.getItem(STORE)||"null")||sample();
// v1.3: 初回は空の状態で開始します。
function save(){localStorage.setItem(STORE,JSON.stringify(data));}
function pet(id){return data.pets.find(p=>p.id===id)||data.pets[0]||null;}
function avatar(p){return `<div class="avatar">${p.photo?`<img src="${p.photo}">`:`<img src="${p.icon}">`}</div>`}
function latest(id){return Object.values(data.records).filter(r=>r.petId===id&&r.weight).sort((a,b)=>a.date.localeCompare(b.date)).pop();}
function daysSince(ds){if(!ds)return "-";return Math.floor((new Date()-new Date(ds+"T00:00:00"))/86400000);}

function ageText(birthday){
 if(!birthday)return "誕生日未設定";
 const birth=new Date(birthday+"T00:00:00");
 const now=new Date();
 let years=now.getFullYear()-birth.getFullYear();
 let months=now.getMonth()-birth.getMonth();
 if(now.getDate()<birth.getDate()) months--;
 if(months<0){years--;months+=12;}
 if(years<0)return "誕生日未設定";
 if(years===0 && months===0){
   const days=Math.floor((now-birth)/86400000);
   return "生後"+Math.max(0,days)+"日";
 }
 if(years===0)return months+"ヶ月";
 return years+"歳"+months+"ヶ月";
}

function nextBirthdayText(birthday){
 if(!birthday)return "誕生日未設定";
 const now=new Date();
 const b=new Date(birthday+"T00:00:00");
 let next=new Date(now.getFullYear(), b.getMonth(), b.getDate());
 if(next < new Date(now.getFullYear(), now.getMonth(), now.getDate())){
   next=new Date(now.getFullYear()+1, b.getMonth(), b.getDate());
 }
 const days=Math.ceil((next-new Date(now.getFullYear(),now.getMonth(),now.getDate()))/86400000);
 return days===0 ? "今日が誕生日です🎉" : "誕生日まであと"+days+"日";
}

function show(view){
 if(data.pets.length===0 && !["homeView","moreView"].includes(view)){
   alert("先にペットを追加してください");
   view="homeView";
 }
 document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
 $(view).classList.add("active");
 document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
 if(view==="homeView")renderHome();
 if(view==="calendarView")renderCalendar();
 if(view==="recordView")renderRecord();
 if(view==="graphView")renderGraph();
 if(view==="profileView")renderProfile();
 if(view==="medicalView")renderMedical();
 if(view==="moreView")renderMore();
}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>show(b.dataset.view));

function renderHome(){
 if(data.pets.length===0){
   $("petList").innerHTML = `<div class="card empty">
     <h2>🐾 ペットが登録されていません</h2>
     <p>右上の＋ボタンから、最初のペットを追加してください。</p>
   </div>`;
   return;
 }
 $("petList").innerHTML=data.pets.map(p=>{let r=latest(p.id)||{};return `<div class="pet-card" onclick="state.selectedPet='${p.id}';show('recordView')"><div class="pet-top">${avatar(p)}<div class="pet-info"><b>${p.name} <span style="color:var(--green)">${p.sex}</span></b><br><small>${p.type}</small><br><small>🎂 ${ageText(p.birthday)}</small></div><div class="weight">${r.weight||"--"}g<br><small>最新</small></div></div><div class="chips"><span class="chip">食欲 ${r.appetite||"-"}</span><span class="chip">元気 ${r.energy||"-"}</span><span class="chip">うんち ${r.poop||"-"}</span>${r.sandBath?'<span class="chip">砂浴び</span>':""}${r.walk?'<span class="chip">部屋んぽ</span>':""}</div></div>`}).join("");
}
$("openPetDialog").onclick=()=>{$("newName").value="";$("newType").value="チンチラ";$("newSex").value="♀";$("petDialog").showModal();}
$("closePet").onclick=()=>$("petDialog").close();
$("addPet").onclick=()=>{
 const name=$("newName").value.trim(); if(!name){alert("名前を入力してください");return;}
 const type=$("newType").value.trim()||"小動物"; const sex=$("newSex").value||"不明";
 let icon="animal_chinchilla.png"; if(type.includes("デグ"))icon="animal_degu.png"; else if(type.includes("モル"))icon="animal_guineapig.png"; else if(type.includes("ハム"))icon="animal_hamster.png"; else if(type.includes("うさ"))icon="animal_rabbit.png";
 const newPet={id:"pet_"+Date.now(),name,type,sex,icon,photo:"",birthday:"",adoptionDate:today()};
 data.pets.push(newPet);
save();
$("petDialog").close();
state.selectedPet=newPet.id;
show("homeView");
alert(name+"を追加しました");
};

function renderRecord(){
 let p=pet(state.selectedPet);
 if(!p){show("homeView");return;}
 $("selectedPetBox").innerHTML=`${avatar(p)}<div><b>${p.name}</b><br><small>${p.type}</small></div>`;
 $("recordDate").value=state.selectedDate;
 loadRecord();
}
function loadRecord(){let r=data.records[state.selectedPet+"_"+$("recordDate").value]||{};["weight","sandMinutes","walkMinutes","temp","humidity","memo"].forEach(id=>$(id).value=r[id]||"");["appetite","energy","poop"].forEach(id=>{if(r[id])$(id).value=r[id]});$("sandBath").checked=!!r.sandBath;$("walk").checked=!!r.walk;}
$("recordDate").onchange=loadRecord;
$("recordForm").onsubmit=e=>{e.preventDefault();let ds=$("recordDate").value||today();data.records[state.selectedPet+"_"+ds]={petId:state.selectedPet,date:ds,weight:Number($("weight").value)||0,appetite:$("appetite").value,energy:$("energy").value,poop:$("poop").value,sandBath:$("sandBath").checked,sandMinutes:Number($("sandMinutes").value)||0,walk:$("walk").checked,walkMinutes:Number($("walkMinutes").value)||0,temp:Number($("temp").value)||0,humidity:Number($("humidity").value)||0,memo:$("memo").value};save();alert("保存しました");show("homeView");}

function renderTabs(id, cb){$(id).innerHTML=data.pets.map(p=>`<button class="${p.id===state.selectedPet?'active':''}" data-id="${p.id}">${p.name}</button>`).join("");$(id).querySelectorAll("button").forEach(b=>b.onclick=()=>{state.selectedPet=b.dataset.id;cb();});}
function renderProfile(){renderTabs("profileTabs",renderProfile);let p=pet(state.selectedPet);$("profileCard").innerHTML=`<div class="profile-img">${p.photo?`<img src="${p.photo}">`:`<img src="${p.icon}">`}</div><div class="row"><span>名前</span><b>${p.name}</b></div><div class="row"><span>種類</span><b>${p.type}</b></div><div class="row"><span>性別</span><b>${p.sex}</b></div><div class="row"><span>誕生日</span><b>${p.birthday||"未設定"}</b></div><div class="row"><span>年齢</span><b>${ageText(p.birthday)}</b></div><div class="row"><span>お迎え</span><b>${p.adoptionDate||"未設定"}</b></div><button class="danger" onclick="deleteSelectedPet()">このペットを削除</button>`;$("birthday").value=p.birthday||"";$("adoptionDate").value=p.adoptionDate||"";$("iconGrid").innerHTML=iconChoices.map(i=>`<button class="${p.icon===i.file?'selectedIcon':''}" data-file="${i.file}"><img src="${i.file}">${i.label}</button>`).join("");$("iconGrid").querySelectorAll("button").forEach(b=>b.onclick=()=>{p.icon=b.dataset.file;p.photo="";save();renderProfile();renderHome();});}
$("photoInput").onchange=e=>{let f=e.target.files[0];if(!f)return;let reader=new FileReader();reader.onload=()=>{pet(state.selectedPet).photo=reader.result;save();renderProfile();renderHome();};reader.readAsDataURL(f);}
$("removePhoto").onclick=()=>{pet(state.selectedPet).photo="";save();renderProfile();renderHome();}
$("saveProfile").onclick=()=>{pet(state.selectedPet).birthday=$("birthday").value;pet(state.selectedPet).adoptionDate=$("adoptionDate").value;save();renderProfile();renderHome();alert("保存しました");}

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




function renderMore(){
 let p=pet(state.selectedPet);
 if(!p){
   $("annivBox").innerHTML=`<b>🐾 ペット未登録</b><p>＋ボタンからペットを追加してください。</p>`;
   return;
 }
 $("annivBox").innerHTML=`<b>🎂 誕生日</b><p>${p.name}は ${ageText(p.birthday)}<br>${nextBirthdayText(p.birthday)}</p><p>お迎えから ${daysSince(p.adoptionDate)}日</p>`;
}
$("exportBtn").onclick=()=>{let blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});let a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="mofunote_data.json";a.click();}
$("resetBtn").onclick=()=>{if(confirm("すべてのデータを削除して空の状態に戻しますか？")){localStorage.removeItem(STORE);location.href=location.pathname+"?v=reset13"+Date.now();}}

if("serviceWorker" in navigator){navigator.serviceWorker.register("service-worker.js").catch(()=>{});}
renderHome();



// v1.3.1 delete UI fix
function deleteSelectedPet(){
  const p = pet(state.selectedPet);
  if(!p){
    alert("削除するペットがいません");
    return;
  }
  if(!confirm(p.name + "を削除しますか？\nこのペットの記録・通院・投薬も削除されます。")){
    return;
  }

  data.pets = data.pets.filter(x => x.id !== p.id);
  Object.keys(data.records).forEach(k => {
    if(data.records[k].petId === p.id) delete data.records[k];
  });
  data.hospitals = data.hospitals.filter(x => x.petId !== p.id);
  data.medicines = data.medicines.filter(x => x.petId !== p.id);

  state.selectedPet = data.pets[0]?.id || "";
  save();
  alert("削除しました");
  show("homeView");
}

// expose for inline onclick
window.deleteSelectedPet = deleteSelectedPet;
