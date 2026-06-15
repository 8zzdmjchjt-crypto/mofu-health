const $=id=>document.getElementById(id);
function localDateString(d=new Date()){
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
const today=()=>localDateString(new Date());
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
 if(view==="albumView")renderAlbum(); if(view==="graphView")renderGraph();
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
showToast(name+"を追加しました🐾");
};


function compressRecordPhoto(file, callback){
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxSize = 520;
      let w = img.width;
      let h = img.height;
      if(w > h && w > maxSize){
        h = Math.round(h * maxSize / w);
        w = maxSize;
      }else if(h >= w && h > maxSize){
        w = Math.round(w * maxSize / h);
        h = maxSize;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

let currentRecordPhoto = "";

function updateRecordPhotoPreview(){
  const box = $("recordPhotoPreview");
  if(!box) return;
  if(currentRecordPhoto){
    box.innerHTML = `<img src="${currentRecordPhoto}">`;
  }else{
    box.textContent = "写真なし";
  }
}

function renderRecord(){
 let p=pet(state.selectedPet);
 if(!p){show("homeView");return;}
 $("selectedPetBox").innerHTML=`${avatar(p)}<div><b>${p.name}</b><br><small>${p.type}</small></div>`;
 $("recordDate").value=state.selectedDate;
 loadRecord();
}
function loadRecord(){let r=data.records[state.selectedPet+"_"+$("recordDate").value]||{};["weight","sandMinutes","walkMinutes","temp","humidity","memo"].forEach(id=>$(id).value=r[id]||"");["appetite","energy","poop"].forEach(id=>{if(r[id])$(id).value=r[id]});$("sandBath").checked=!!r.sandBath;$("walk").checked=!!r.walk;currentRecordPhoto=r.photo||"";updateRecordPhotoPreview();}
$("recordDate").onchange=loadRecord;
$("recordPhotoInput").onchange=(e)=>{
  const file=e.target.files&&e.target.files[0];
  if(!file)return;
  compressRecordPhoto(file,(dataUrl)=>{
    currentRecordPhoto=dataUrl;
    updateRecordPhotoPreview();
    showToast("写真を追加しました📷");
  });
};
$("removeRecordPhoto").onclick=()=>{
  currentRecordPhoto="";
  updateRecordPhotoPreview();
  showToast("今日の写真を削除しました");
};
$("recordForm").onsubmit=e=>{e.preventDefault();let ds=$("recordDate").value||today();data.records[state.selectedPet+"_"+ds]={petId:state.selectedPet,date:ds,weight:Number($("weight").value)||0,appetite:$("appetite").value,energy:$("energy").value,poop:$("poop").value,sandBath:$("sandBath").checked,sandMinutes:Number($("sandMinutes").value)||0,walk:$("walk").checked,walkMinutes:Number($("walkMinutes").value)||0,temp:Number($("temp").value)||0,humidity:Number($("humidity").value)||0,memo:$("memo").value,photo:currentRecordPhoto};save();showToast("保存しました");show("homeView");}

function renderTabs(id, cb){$(id).innerHTML=data.pets.map(p=>`<button class="${p.id===state.selectedPet?'active':''}" data-id="${p.id}">${p.name}</button>`).join("");$(id).querySelectorAll("button").forEach(b=>b.onclick=()=>{state.selectedPet=b.dataset.id;cb();});}
function renderProfile(){renderTabs("profileTabs",renderProfile);let p=pet(state.selectedPet);$("profileCard").innerHTML=`<div class="profile-img">${p.photo?`<img src="${p.photo}">`:`<img src="${p.icon}">`}</div><div class="row"><span>名前</span><b>${p.name}</b></div><div class="row"><span>種類</span><b>${p.type}</b></div><div class="row"><span>性別</span><b>${p.sex}</b></div><div class="row"><span>誕生日</span><b>${p.birthday||"未設定"}</b></div><div class="row"><span>年齢</span><b>${ageText(p.birthday)}</b></div><div class="row"><span>お迎え</span><b>${p.adoptionDate||"未設定"}</b></div><button class="danger" onclick="deleteSelectedPet()">このペットを削除</button>`;$("birthday").value=p.birthday||"";$("adoptionDate").value=p.adoptionDate||"";$("iconGrid").innerHTML=iconChoices.map(i=>`<button class="${p.icon===i.file?'selectedIcon':''}" data-file="${i.file}"><img src="${i.file}">${i.label}</button>`).join("");$("iconGrid").querySelectorAll("button").forEach(b=>b.onclick=()=>{p.icon=b.dataset.file;p.photo="";save();renderProfile();renderHome();});}
$("photoInput").onchange=e=>{let f=e.target.files[0];if(!f)return;let reader=new FileReader();reader.onload=()=>{pet(state.selectedPet).photo=reader.result;save();renderProfile();renderHome();};reader.readAsDataURL(f);}
$("removePhoto").onclick=()=>{pet(state.selectedPet).photo="";save();renderProfile();renderHome();}
$("saveProfile").onclick=()=>{pet(state.selectedPet).birthday=$("birthday").value;pet(state.selectedPet).adoptionDate=$("adoptionDate").value;save();renderProfile();renderHome();showToast("保存しました");}

function renderMedical(){renderTabs("medicalTabs",renderMedical);$("hospitalDate").value=today();$("medicineStart").value=today();renderHospitalList();renderMedicineList();}
$("hospitalForm").onsubmit=e=>{e.preventDefault();data.hospitals.push({petId:state.selectedPet,date:$("hospitalDate").value,name:$("hospitalName").value,reason:$("hospitalReason").value,cost:Number($("hospitalCost").value)||0,memo:$("hospitalMemo").value});save();renderHospitalList();showToast("保存しました");}
$("medicineForm").onsubmit=e=>{e.preventDefault();data.medicines.push({petId:state.selectedPet,name:$("medicineName").value,dose:$("medicineDose").value,start:$("medicineStart").value,end:$("medicineEnd").value,memo:$("medicineMemo").value});save();renderMedicineList();showToast("保存しました");}
function renderHospitalList(){$("hospitalList").innerHTML=data.hospitals.filter(h=>h.petId===state.selectedPet).map(h=>`<div class="card list"><b>🏥 ${h.date} ${h.name}</b><br>${h.reason}<br><small>${h.cost}円 ${h.memo||""}</small></div>`).join("");}
function renderMedicineList(){$("medicineList").innerHTML=data.medicines.filter(m=>m.petId===state.selectedPet).map(m=>`<div class="card list"><b>💊 ${m.name}</b><br>${m.dose}<br><small>${m.start}〜${m.end||"継続中"}</small></div>`).join("");}

function renderCalendar(){let y=state.viewMonth.getFullYear(),m=state.viewMonth.getMonth();$("monthTitle").textContent=`${y}年${m+1}月`;let start=new Date(y,m,1-new Date(y,m,1).getDay());let html="";for(let i=0;i<42;i++){let d=new Date(start);d.setDate(start.getDate()+i);let ds=localDateString(d);let icons="";if(Object.values(data.records).some(r=>r.date===ds))icons+="●";if(data.hospitals.some(h=>h.date===ds))icons+="🏥";if(data.medicines.some(md=>md.start<=ds&&(!md.end||md.end>=ds)))icons+="💊";html+=`<div class="day ${d.getMonth()!==m?'other':''} ${ds===today()?'today':''}" onclick="state.selectedDate='${ds}';renderDay('${ds}')">${d.getDate()}<div class="day-icons">${icons}</div></div>`}$("calendar").innerHTML=html;renderDay(state.selectedDate);}
function renderDay(ds){$("dayTitle").textContent=ds+" の記録";let html="";Object.values(data.records).filter(r=>r.date===ds).forEach(r=>{let p=pet(r.petId);html+=`<div class="pet-card">${avatar(p)}<b>${p.name}</b> ${r.weight||"-"}g${r.photo?`<br><img class="day-photo" src="${r.photo}">`:""}</div>`});$("dayList").innerHTML=html||'<p class="notice">記録はまだありません。</p>'}
$("prevMonth").onclick=()=>{state.viewMonth.setMonth(state.viewMonth.getMonth()-1);renderCalendar();}
$("nextMonth").onclick=()=>{state.viewMonth.setMonth(state.viewMonth.getMonth()+1);renderCalendar();}

document.querySelectorAll(".switch button").forEach(b=>b.onclick=()=>{state.graph=b.dataset.graph;document.querySelectorAll(".switch button").forEach(x=>x.classList.toggle("active",x===b));renderGraph();});



function renderAlbum(){
  renderTabs("albumTabs", renderAlbum);
  const p = pet(state.selectedPet);
  if(!p){ return; }

  const photos = Object.values(data.records)
    .filter(r => r.petId === state.selectedPet && r.photo)
    .sort((a,b) => b.date.localeCompare(a.date));

  if(!photos.length){
    $("albumList").innerHTML = `<div class="card empty"><h2>📷 写真はまだありません</h2><p>記録画面で「今日の写真」を追加すると、ここに表示されます。</p></div>`;
    return;
  }

  $("albumList").innerHTML = photos.map(r => `
    <div class="album-card">
      <img src="${r.photo}">
      <div><b>${r.date}</b><br><small>${r.weight? r.weight+"g" : ""} ${r.memo||""}</small></div>
    </div>
  `).join("");
}

function renderGraph(){
  renderTabs("graphTabs", renderGraph);
  let p = pet(state.selectedPet);
  if(!p){ return; }

  let rows = Object.values(data.records)
    .filter(r => r.petId === state.selectedPet)
    .sort((a,b) => a.date.localeCompare(b.date))
    .slice(-30);

  let key = "weight";
  let unit = "g";
  if(state.graph === "sand"){ key = "sandMinutes"; unit = "分"; }
  if(state.graph === "walk"){ key = "walkMinutes"; unit = "分"; }

  drawSimpleGraphV17(rows.map(r => ({date:r.date,value:Number(r[key])||0})), unit);
}

function drawSimpleGraphV17(rows, unit){
  const c = $("graph");
  const rect = c.getBoundingClientRect();
  const cssW = Math.max(320, rect.width || 350);
  const cssH = 260;
  const dpr = window.devicePixelRatio || 1;

  c.style.height = cssH + "px";
  c.width = Math.floor(cssW * dpr);
  c.height = Math.floor(cssH * dpr);

  const ctx = c.getContext("2d");
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,cssW,cssH);

  const left=48,right=28,top=28,bottom=38;
  const chartW=cssW-left-right;
  const chartH=cssH-top-bottom;

  if(!rows.length){
    ctx.fillStyle="#75877b";
    ctx.font="15px sans-serif";
    ctx.textAlign="center";
    ctx.fillText("記録がまだありません", cssW/2, cssH/2);
    return;
  }

  const vals=rows.map(r=>r.value);
  let min=Math.min(...vals), max=Math.max(...vals);
  if(min===max){ min=Math.max(0,min-5); max=max+5; }
  else{
    const pad=Math.max(1,(max-min)*0.15);
    min=Math.max(0,Math.floor(min-pad));
    max=Math.ceil(max+pad);
  }

  ctx.font="13px sans-serif";
  ctx.textAlign="right";
  ctx.textBaseline="middle";
  for(let i=0;i<=4;i++){
    const y=top+chartH*i/4;
    const val=Math.round(max-(max-min)*i/4);
    ctx.strokeStyle="#d9eadf";
    ctx.lineWidth=1.3;
    ctx.beginPath();
    ctx.moveTo(left,y);
    ctx.lineTo(cssW-right,y);
    ctx.stroke();
    ctx.fillStyle="#6f8378";
    ctx.fillText(val+unit,left-8,y);
  }

  ctx.textAlign="center";
  ctx.textBaseline="top";
  ctx.fillStyle="#6f8378";
  ctx.font="13px sans-serif";
  const first=rows[0].date ? rows[0].date.slice(5).replace("-","/") : "";
  const last=rows[rows.length-1].date ? rows[rows.length-1].date.slice(5).replace("-","/") : "";
  ctx.fillText(first,left,top+chartH+12);
  ctx.fillText(last,cssW-right,top+chartH+12);

  ctx.strokeStyle="#78a98b";
  ctx.lineWidth=4;
  ctx.lineCap="round";
  ctx.lineJoin="round";
  ctx.beginPath();
  rows.forEach((r,i)=>{
    const x=left+chartW*(rows.length===1 ? 0.5 : i/(rows.length-1));
    const y=top+chartH*(1-(r.value-min)/(max-min));
    if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();

  rows.forEach((r,i)=>{
    const x=left+chartW*(rows.length===1 ? 0.5 : i/(rows.length-1));
    const y=top+chartH*(1-(r.value-min)/(max-min));
    ctx.fillStyle="#78a98b";
    ctx.beginPath();
    ctx.arc(x,y,4.5,0,Math.PI*2);
    ctx.fill();
  });

  const latest=rows[rows.length-1];
  const latestX=left+chartW;
  const latestY=top+chartH*(1-(latest.value-min)/(max-min));
  const text=latest.value+unit;
  ctx.font="bold 13px sans-serif";
  const badgeW=Math.max(48,ctx.measureText(text).width+18);
  const bx=Math.min(cssW-right-badgeW/2,latestX);
  const by=Math.max(top+15,Math.min(top+chartH-15,latestY));

  ctx.fillStyle="#78a98b";
  roundRect(ctx,bx-badgeW/2,by-14,badgeW,28,14);
  ctx.fill();
  ctx.fillStyle="#fff";
  ctx.textAlign="center";
  ctx.textBaseline="middle";
  ctx.fillText(text,bx,by);
}

function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}


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
  showToast(p.name+"を削除しました🗑️");
  show("homeView");
}

// expose for inline onclick
window.deleteSelectedPet = deleteSelectedPet;

function showToast(msg){
 let t=document.getElementById('toast');
 if(!t){t=document.createElement('div');t.id='toast';document.body.appendChild(t);}
 t.style.cssText='position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#5f9f7b;color:#fff;padding:10px 18px;border-radius:20px;z-index:9999';
 t.textContent=msg;
 setTimeout(()=>t.remove(),1500);
}



// v1.7.1 save feedback fix
function showToast(message){
  let t = document.getElementById("toast");
  if(!t){
    t = document.createElement("div");
    t.id = "toast";
    document.body.appendChild(t);
  }
  t.textContent = message;
  t.className = "show";
  setTimeout(() => { t.className = ""; }, 1800);
}

function wrapFormFeedback(){
  const recordForm = document.getElementById("recordForm");
  if(recordForm && !recordForm.dataset.feedbackFixed){
    recordForm.dataset.feedbackFixed = "1";
    recordForm.addEventListener("submit", () => {
      setTimeout(() => showToast("記録を保存しました✅"), 120);
    });
  }

  const hospitalForm = document.getElementById("hospitalForm");
  if(hospitalForm && !hospitalForm.dataset.feedbackFixed){
    hospitalForm.dataset.feedbackFixed = "1";
    hospitalForm.addEventListener("submit", () => {
      setTimeout(() => showToast("通院記録を保存しました✅"), 120);
    });
  }

  const medicineForm = document.getElementById("medicineForm");
  if(medicineForm && !medicineForm.dataset.feedbackFixed){
    medicineForm.dataset.feedbackFixed = "1";
    medicineForm.addEventListener("submit", () => {
      setTimeout(() => showToast("投薬記録を保存しました✅"), 120);
    });
  }

  const saveProfile = document.getElementById("saveProfile");
  if(saveProfile && !saveProfile.dataset.feedbackFixed){
    saveProfile.dataset.feedbackFixed = "1";
    saveProfile.addEventListener("click", () => {
      setTimeout(() => showToast("プロフィールを保存しました✅"), 120);
    });
  }

  const addPet = document.getElementById("addPet");
  if(addPet && !addPet.dataset.feedbackFixed){
    addPet.dataset.feedbackFixed = "1";
    addPet.addEventListener("click", () => {
      const name = document.getElementById("newName")?.value?.trim() || "ペット";
      setTimeout(() => showToast(name + "を追加しました🐾"), 120);
    });
  }
}

window.addEventListener("load", wrapFormFeedback);
setTimeout(wrapFormFeedback, 500);

if(typeof show === "function"){
  const originalShowForFeedback = show;
  show = function(view){
    originalShowForFeedback(view);
    setTimeout(wrapFormFeedback, 100);
  };
}

if(typeof deleteSelectedPet === "function"){
  const originalDeleteSelectedPet = deleteSelectedPet;
  deleteSelectedPet = function(){
    const p = typeof pet === "function" ? pet(state.selectedPet) : null;
    originalDeleteSelectedPet();
    setTimeout(() => {
      if(p) showToast(p.name + "を削除しました🗑️");
    }, 200);
  };
  window.deleteSelectedPet = deleteSelectedPet;
}



// v1.7.2 profile save fix
function saveProfileFixedV172(){
  const p = pet(state.selectedPet);
  if(!p){
    showToast("ペットが選択されていません");
    return;
  }

  const birthdayEl = document.getElementById("birthday");
  const adoptionEl = document.getElementById("adoptionDate");

  if(birthdayEl){
    p.birthday = birthdayEl.value || "";
  }
  if(adoptionEl){
    p.adoptionDate = adoptionEl.value || "";
  }

  // 念のため、pets配列へ明示的に反映
  const idx = data.pets.findIndex(x => x.id === p.id);
  if(idx >= 0){
    data.pets[idx] = p;
  }

  save();
  localStorage.setItem(STORE, JSON.stringify(data));

  renderProfile();
  renderHome();
  renderMore();

  showToast("プロフィールを保存しました✅");
}

function applyProfileSaveFixV172(){
  const btn = document.getElementById("saveProfile");
  if(btn){
    btn.onclick = (e) => {
      e.preventDefault();
      saveProfileFixedV172();
    };
    btn.ontouchend = (e) => {
      e.preventDefault();
      saveProfileFixedV172();
    };
  }
}

window.addEventListener("load", applyProfileSaveFixV172);
setTimeout(applyProfileSaveFixV172, 500);

// 画面切替後にプロフィール保存ボタンが再生成される場合にも適用
if(typeof show === "function" && !window.__profileSaveFixWrappedV172){
  window.__profileSaveFixWrappedV172 = true;
  const originalShowV172 = show;
  show = function(view){
    originalShowV172(view);
    setTimeout(applyProfileSaveFixV172, 100);
  };
}



// v1.7.3 photo save fix
function saveDataSafelyV173(){
  try{
    localStorage.setItem(STORE, JSON.stringify(data));
    return true;
  }catch(e){
    console.error(e);
    showToast("保存容量が不足しています。写真を小さくしてください");
    return false;
  }
}

function compressImageFileV173(file, callback){
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxSize = 420;
      let w = img.width;
      let h = img.height;

      if(w > h && w > maxSize){
        h = Math.round(h * maxSize / w);
        w = maxSize;
      }else if(h >= w && h > maxSize){
        w = Math.round(w * maxSize / h);
        h = maxSize;
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function applyPhotoSaveFixV173(){
  const photoInput = document.getElementById("photoInput");
  if(photoInput && !photoInput.dataset.photoFixV173){
    photoInput.dataset.photoFixV173 = "1";
    photoInput.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if(!file) return;

      compressImageFileV173(file, (dataUrl) => {
        const p = pet(state.selectedPet);
        if(!p){
          showToast("ペットが選択されていません");
          return;
        }

        p.photo = dataUrl;

        const idx = data.pets.findIndex(x => x.id === p.id);
        if(idx >= 0){
          data.pets[idx] = p;
        }

        if(saveDataSafelyV173()){
          renderProfile();
          renderHome();
          showToast("写真を保存しました📷");
        }
      });
    };
  }

  const removePhoto = document.getElementById("removePhoto");
  if(removePhoto && !removePhoto.dataset.photoFixV173){
    removePhoto.dataset.photoFixV173 = "1";
    removePhoto.onclick = (e) => {
      e.preventDefault();
      const p = pet(state.selectedPet);
      if(!p) return;
      p.photo = "";
      const idx = data.pets.findIndex(x => x.id === p.id);
      if(idx >= 0) data.pets[idx] = p;
      saveDataSafelyV173();
      renderProfile();
      renderHome();
      showToast("写真を削除しました");
    };
  }

  const saveProfile = document.getElementById("saveProfile");
  if(saveProfile){
    saveProfile.onclick = (e) => {
      e.preventDefault();

      const p = pet(state.selectedPet);
      if(!p){
        showToast("ペットが選択されていません");
        return;
      }

      const idx = data.pets.findIndex(x => x.id === p.id);
      const oldPet = idx >= 0 ? data.pets[idx] : p;

      p.birthday = document.getElementById("birthday")?.value || "";
      p.adoptionDate = document.getElementById("adoptionDate")?.value || "";

      // 写真とアイコンは必ず保持
      p.photo = oldPet.photo || p.photo || "";
      p.icon = oldPet.icon || p.icon || "animal_chinchilla.png";

      if(idx >= 0){
        data.pets[idx] = p;
      }

      if(saveDataSafelyV173()){
        renderProfile();
        renderHome();
        renderMore();
        showToast("プロフィールを保存しました✅");
      }
    };
  }
}

window.addEventListener("load", applyPhotoSaveFixV173);
setTimeout(applyPhotoSaveFixV173, 500);

if(typeof show === "function" && !window.__photoSaveFixWrappedV173){
  window.__photoSaveFixWrappedV173 = true;
  const originalShowV173 = show;
  show = function(view){
    originalShowV173(view);
    setTimeout(applyPhotoSaveFixV173, 100);
  };
}



// v1.8.1 calendar local date fix
function renderCalendar(){
  const y = state.viewMonth.getFullYear();
  const m = state.viewMonth.getMonth();
  $("monthTitle").textContent = `${y}年${m+1}月`;

  const firstDay = new Date(y, m, 1);
  const start = new Date(y, m, 1 - firstDay.getDay());

  let html = "";
  for(let i=0; i<42; i++){
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const ds = localDateString(d);
    let icons = "";

    if(Object.values(data.records).some(r => r.date === ds)) icons += "●";
    if(data.hospitals.some(h => h.date === ds)) icons += "🏥";
    if(data.medicines.some(md => md.start <= ds && (!md.end || md.end >= ds))) icons += "💊";

    html += `<div class="day ${d.getMonth()!==m?'other':''} ${ds===today()?'today':''}" onclick="state.selectedDate='${ds}';renderDay('${ds}')">${d.getDate()}<div class="day-icons">${icons}</div></div>`;
  }

  $("calendar").innerHTML = html;

  // 表示中の月に選択日がない場合だけ今日へ戻す
  if(!state.selectedDate) state.selectedDate = today();
  renderDay(state.selectedDate);
}

function renderDay(ds){
  state.selectedDate = ds;
  $("dayTitle").textContent = ds + " の記録";

  let html = "";
  Object.values(data.records)
    .filter(r => r.date === ds)
    .forEach(r => {
      let p = pet(r.petId);
      html += `<div class="pet-card">${avatar(p)}<b>${p.name}</b> ${r.weight||"-"}g${r.photo?`<br><img class="day-photo" src="${r.photo}">`:""}</div>`;
    });

  $("dayList").innerHTML = html || '<p class="notice">記録はまだありません。</p>';
}



// v1.8.3 calendar selected day color fix
function renderCalendar(){
  const y = state.viewMonth.getFullYear();
  const m = state.viewMonth.getMonth();
  $("monthTitle").textContent = `${y}年${m+1}月`;

  const firstDay = new Date(y, m, 1);
  const start = new Date(y, m, 1 - firstDay.getDay());

  let html = "";
  for(let i=0; i<42; i++){
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const ds = localDateString(d);
    let icons = "";

    if(Object.values(data.records).some(r => r.date === ds)) icons += "●";
    if(data.hospitals.some(h => h.date === ds)) icons += "🏥";
    if(data.medicines.some(md => md.start <= ds && (!md.end || md.end >= ds))) icons += "💊";

    const isToday = ds === today();
    const isSelected = ds === state.selectedDate;

    html += `<div class="day ${d.getMonth()!==m?'other':''} ${isToday?'todayMark':''} ${isSelected?'selectedDay':''}" onclick="state.selectedDate='${ds}';renderCalendar();renderDay('${ds}')">${d.getDate()}<div class="day-icons">${icons}</div></div>`;
  }

  $("calendar").innerHTML = html;

  if(!state.selectedDate) state.selectedDate = today();
  renderDay(state.selectedDate);
}

function renderDay(ds){
  state.selectedDate = ds;
  $("dayTitle").textContent = ds + " の記録";

  let html = "";
  Object.values(data.records)
    .filter(r => r.date === ds)
    .forEach(r => {
      let p = pet(r.petId);
      html += `<div class="pet-card">${avatar(p)}<b>${p.name}</b> ${r.weight||"-"}g${r.photo?`<br><img class="day-photo" src="${r.photo}">`:""}</div>`;
    });

  $("dayList").innerHTML = html || '<p class="notice">記録はまだありません。</p>';
}



// v1.8.5 profile layout class helper
function applyProfileLayoutV185(){
  const photoInput = document.getElementById("photoInput");
  if(photoInput){
    const parent = photoInput.closest(".card");
    if(parent) parent.classList.add("photo-register-box-clean");
  }
}
window.addEventListener("load", applyProfileLayoutV185);
setTimeout(applyProfileLayoutV185, 500);
if(typeof show === "function" && !window.__profileLayoutWrappedV185){
  window.__profileLayoutWrappedV185 = true;
  const originalShowV185 = show;
  show = function(view){
    originalShowV185(view);
    setTimeout(applyProfileLayoutV185, 100);
  };
}



// v1.8.6 photo UI balance helper
function applyPhotoUIBalanceV186(){
  const input = document.getElementById("photoInput");
  const remove = document.getElementById("removePhoto");
  if(input){
    input.classList.add("photo-input-balanced");
    const wrap = input.closest(".card") || input.parentElement;
    if(wrap) wrap.classList.add("photo-ui-balanced");
  }
  if(remove){
    remove.classList.add("photo-remove-subtle");
    remove.textContent = "写真を削除";
  }
}
window.addEventListener("load", applyPhotoUIBalanceV186);
setTimeout(applyPhotoUIBalanceV186, 500);
if(typeof show === "function" && !window.__photoUIBalanceWrappedV186){
  window.__photoUIBalanceWrappedV186 = true;
  const originalShowV186 = show;
  show = function(view){
    originalShowV186(view);
    setTimeout(applyPhotoUIBalanceV186, 100);
  };
}
