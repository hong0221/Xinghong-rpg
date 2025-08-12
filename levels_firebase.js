
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore, doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

if(!window.firebaseConfig){
  console.warn("尚未設定 firebaseConfig（請確認 config.js 存在）。");
}
const app = initializeApp(window.firebaseConfig || {});
const db = getFirestore(app);

const LEVELS_CACHE_KEY = "xh_levels_cache_v2";

function todayStr(){ return new Date().toISOString().slice(0,10); }

async function getTodayPackDocId(){
  const date = todayStr();
  const dailyId = `daily-${date}`;
  const dailyDoc = await getDoc(doc(db, "packs", dailyId));
  if(dailyDoc.exists()) return dailyDoc.id;
  const starter = await getDoc(doc(db, "packs", "starter-pack"));
  if(starter.exists()) return "starter-pack";
  const snap = await getDocs(collection(db, "packs"));
  if(!snap.empty) return snap.docs[0].id;
  return null;
}

async function loadPackLevels(packId){
  const packRef = doc(db, "packs", packId);
  const packSnap = await getDoc(packRef);
  if(!packSnap.exists()) return [];
  const ids = (packSnap.data().levels || []);
  const out = [];
  for(const id of ids){
    const s = await getDoc(doc(db, "levels", id));
    if(s.exists()) out.push({ id, ...s.data() });
  }
  return out;
}

function renderLevels(list){
  const el = document.getElementById("levels");
  el.innerHTML = "";
  if(!list.length){ el.innerHTML = "<div class='tiny'>今天沒有關卡資料（請到 Firebase 新增 packs / levels）。</div>"; return; }
  list.forEach(l => {
    const card = document.createElement("div");
    card.className = "level-card";
    const h = document.createElement("h3");
    h.className = "level-title";
    h.textContent = `${l.title || l.name || l.id}（★${l.difficulty ?? 0}）`;
    const sub = document.createElement("div");
    sub.className = "level-sub";
    const goals = (l.goals || []).map(g => `• ${g.desc || g.id} x${g.count || 1}`).join("<br>");
    sub.innerHTML = goals || "—";
    card.appendChild(h); card.appendChild(sub);
    el.appendChild(card);
  });
}

async function boot(){
  const cached = JSON.parse(localStorage.getItem(LEVELS_CACHE_KEY) || "null");
  if(cached && cached.date === todayStr()){
    renderLevels(cached.levels || []);
    getTodayPackDocId().then(loadPackLevels).then(list => {
      renderLevels(list);
      localStorage.setItem(LEVELS_CACHE_KEY, JSON.stringify({ date: todayStr(), levels: list }));
    });
    return;
  }
  const packId = await getTodayPackDocId();
  const list = packId ? await loadPackLevels(packId) : [];
  renderLevels(list);
  localStorage.setItem(LEVELS_CACHE_KEY, JSON.stringify({ date: todayStr(), levels: list }));
}
boot();
