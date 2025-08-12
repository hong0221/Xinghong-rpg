
const VERSION = "2.1.0";
const KEY = "xinhong_rpg_state_v1";
const XP_PER_LEVEL = 100;
const AUTO_POINTS_PER_LEVEL = 3;
const TODAY = new Date().toISOString().slice(0,10);

const DAILY_TASKS = [
  { id:"d1", title:"蛋白質補充一次（或睡前牛奶/高蛋白）", sub:"+1 力量", xp:5, attr:"strength" },
  { id:"d2", title:"與佩珊互動一次且自然收尾（無壓力）", sub:"+1 魅力", xp:7, attr:"charisma" },
  { id:"d3", title:"記錄當日支出（30秒）", sub:"+1 財富", xp:3, attr:"wealth" },
  { id:"d4", title:"多鄰國日語 1 小單元", sub:"+1 智慧", xp:5, attr:"wisdom" },
  { id:"d5", title:"5 分鐘伸展/放鬆", sub:"+1 力量", xp:3, attr:"strength" },
];

const WEEKLY_TASKS = [
  { id:"w1", title:"完成 3 次徒手/彈力帶訓練（15–20 分/次）", sub:"+2 力量", xp:20, attr:"strength" },
  { id:"w2", title:"多鄰國日語 3 次（可分散）", sub:"+2 智慧", xp:15, attr:"wisdom" },
  { id:"w3", title:"一週穿搭檢查與維護（髮、鞋、配件）", sub:"+2 魅力", xp:10, attr:"charisma" },
  { id:"w4", title:"週度收支盤點（必要/彈性/投資自己）", sub:"+2 財富", xp:15, attr:"wealth" },
];

function getISOWeek(dateStr){
  const d = new Date(dateStr + "T00:00:00");
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
  }
  const week = 1 + Math.ceil((firstThursday - target) / (7 * 24 * 3600 * 1000));
  return `${d.getUTCFullYear()}-W${String(week).padStart(2,"0")}`;
}

const THIS_WEEK = getISOWeek(TODAY);

function defaultState(){
  return {
    version: VERSION,
    level: 20,
    xp: 0,
    attrs: { strength:6, wisdom:6, charisma:7, wealth:5 },
    completedDaily: {},
    dailyBonusApplied: {},
    completedWeekly: {},
    badges: [],
    history: [],
  };
}

function loadState(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw) return defaultState();
    const s = JSON.parse(raw);
    if(!s.version) return defaultState();
    return s;
  }catch(e){
    return defaultState();
  }
}

function saveState(){ localStorage.setItem(KEY, JSON.stringify(state)); }

function addXP(amount){
  state.xp += amount;
  while(state.xp >= XP_PER_LEVEL){
    state.xp -= XP_PER_LEVEL;
    state.level += 1;
    for(let i=0;i<AUTO_POINTS_PER_LEVEL;i++){
      const keys = Object.keys(state.attrs).sort((a,b)=> state.attrs[a]-state.attrs[b]);
      state.attrs[keys[0]] += 1;
    }
    pushBadgeIfNeeded();
  }
  saveState();
  renderHeader(); renderStats();
}

function pushBadgeIfNeeded(){
  for(const [k,v] of Object.entries(state.attrs)){
    if(v >= 10){
      const key = `attr10_${k}`;
      if(!state.badges.includes(key)){
        state.badges.push(key);
        state.history.push({t:Date.now(), type:"badge", detail:key});
      }
    }
  }
}

function completeDailyTask(task){
  const arr = state.completedDaily[TODAY] || [];
  if(arr.includes(task.id)) return;
  arr.push(task.id);
  state.completedDaily[TODAY] = arr;
  state.attrs[task.attr] = (state.attrs[task.attr]||0) + 1;
  addXP(task.xp);
  state.history.push({t:Date.now(), type:"daily", id:task.id});
  saveState();
  if(arr.length >= 3 && !state.dailyBonusApplied[TODAY]){
    state.dailyBonusApplied[TODAY] = true;
    addXP(5);
  }
  renderDaily(); renderStats(); renderBadges();
}

function completeWeeklyTask(task){
  const arr = state.completedWeekly[THIS_WEEK] || [];
  if(arr.includes(task.id)) return;
  arr.push(task.id);
  state.completedWeekly[THIS_WEEK] = arr;
  state.attrs[task.attr] = (state.attrs[task.attr]||0) + 2;
  addXP(task.xp);
  state.history.push({t:Date.now(), type:"weekly", id:task.id});
  saveState();
  renderWeekly(); renderStats(); renderBadges();
}

function renderHeader(){
  document.getElementById("level").textContent = `Lv.${state.level}`;
  document.getElementById("xp-label").textContent = `${state.xp} / 100 XP`;
  document.getElementById("xp-fill").style.width = `${(state.xp/100*100).toFixed(1)}%`;
}
function renderStats(){
  document.getElementById("stat-strength").textContent = state.attrs.strength;
  document.getElementById("stat-wisdom").textContent = state.attrs.wisdom;
  document.getElementById("stat-charisma").textContent = state.attrs.charisma;
  document.getElementById("stat-wealth").textContent = state.attrs.wealth;
}

function renderTaskList(el, tpl, tasks, checkedSet, onToggle){
  el.innerHTML = "";
  tasks.forEach(task => {
    const node = tpl.content.cloneNode(true);
    const li = node.querySelector(".task");
    const input = node.querySelector("input");
    const title = node.querySelector(".task-title");
    const sub = node.querySelector(".task-sub");
    const reward = node.querySelector(".task-reward");
    title.textContent = task.title; sub.textContent = task.sub; reward.textContent = `+${task.xp} XP`;
    const isDone = checkedSet.has(task.id);
    input.checked = isDone; if(isDone) li.classList.add("done");
    input.addEventListener("change", () => { if(input.checked){ onToggle(task); } });
    el.appendChild(node);
  });
}
function renderDaily(){
  const el = document.getElementById("daily-list");
  const tpl = document.getElementById("task-item");
  const done = new Set(state.completedDaily[TODAY] || []);
  renderTaskList(el, tpl, DAILY_TASKS, done, completeDailyTask);
}
function renderWeekly(){
  const el = document.getElementById("weekly-list");
  const tpl = document.getElementById("task-item");
  const done = new Set(state.completedWeekly[THIS_WEEK] || []);
  renderTaskList(el, tpl, WEEKLY_TASKS, done, completeWeeklyTask);
}
function renderBadges(){
  const el = document.getElementById("badges");
  const tpl = document.getElementById("badge-item");
  el.innerHTML = "";
  const map = {
    "attr10_strength": "力量 10 達成",
    "attr10_wisdom": "智慧 10 達成",
    "attr10_charisma": "魅力 10 達成",
    "attr10_wealth": "財富 10 達成",
  };
  state.badges.forEach(key => {
    const node = tpl.content.cloneNode(true);
    node.querySelector(".b-text").textContent = map[key] || key;
    el.appendChild(node);
  });
}

function manualDistribute(){
  const keys = Object.keys(state.attrs).sort((a,b)=> state.attrs[a]-state.attrs[b]);
  state.attrs[keys[0]] += 1; saveState(); renderStats();
}
function resetAll(){
  if(!confirm("確定要重置所有資料？此動作無法復原。")) return;
  state = defaultState(); saveState();
  renderHeader(); renderStats(); renderDaily(); renderWeekly(); renderBadges();
}

let state = loadState();
window.addEventListener("DOMContentLoaded", () => {
  renderHeader(); renderStats(); renderDaily(); renderWeekly(); renderBadges();
  document.getElementById("btn-distribute").addEventListener("click", manualDistribute);
  document.getElementById("btn-reset").addEventListener("click", resetAll);
  setTimeout(()=>{const w=document.getElementById("welcome-overlay"); if(w){w.classList.add("hide"); setTimeout(()=>w.remove(),500);} },800);
});
