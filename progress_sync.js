
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const LS_KEY = "xinhong_rpg_state_v1";
const ID_KEY = "xh_device_id_v1";

function getDeviceId(){
  let id = localStorage.getItem(ID_KEY);
  if(!id){ id = "dev-" + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(ID_KEY, id); }
  return id;
}
function getLocalState(){ try{ return JSON.parse(localStorage.getItem(LS_KEY) || "null"); }catch(e){ return null; } }
function setLocalState(obj){ try{ localStorage.setItem(LS_KEY, JSON.stringify(obj)); }catch(e){} }
function hash(obj){ try{ const s = JSON.stringify(obj); let h=0; for(let i=0;i<s.length;i++){ h = (h*31 + s.charCodeAt(i))|0; } return String(h);}catch(e){return "";} }

async function boot(){
  if(!window.firebaseConfig){ console.warn("[progress_sync] 缺少 config.js"); return; }
  const app = initializeApp(window.firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  await signInAnonymously(auth).catch(()=>{});

  const id = getDeviceId();
  const ref = doc(db, "progress", id);

  try{
    const local = getLocalState();
    const snap = await getDoc(ref);
    if((!local || Object.keys(local||{}).length===0) && snap.exists()){
      const data = snap.data();
      if(data && data.state){ setLocalState(data.state); console.log("[progress_sync] loaded cloud state"); }
    }
  }catch(e){ console.warn("[progress_sync] initial load failed", e); }

  let lastHash = hash(getLocalState());
  async function saveIfChanged(){
    const cur = getLocalState();
    const h = hash(cur);
    if(h !== lastHash){
      lastHash = h;
      try{ await setDoc(ref, { state: cur || {}, updatedAt: serverTimestamp() }, { merge:true }); }catch(e){}
    }
  }
  setInterval(saveIfChanged, 30000);
  document.addEventListener("visibilitychange", ()=>{ if(document.hidden) saveIfChanged(); });
  window.addEventListener("beforeunload", saveIfChanged);
}
boot();
