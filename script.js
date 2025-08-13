const VERSION = "2.1.0";
const KEY = "xinhong_rpg_state_v1";
const XP_PER_LEVEL = 100;
const TODAY = new Date().toISOString().slice(0,10);

const DAILY_TASKS = [
  { id:"d1", title:"蛋白質補充一次（或睡前牛奶/高蛋白）", xp:5, attr:"strength" },
  { id:"d2", title:"與佩珊互動一次且自然收尾（無壓力）", xp:7, attr:"charisma" },
  { id:"d3", title:"記錄當日支出（30秒）", xp:3, attr:"wealth" },
  { id:"d4", title:"多鄰國日語 1 小單元", xp:5, attr:"wisdom" },
  { id:"d5", title:"5 分鐘伸展/放鬆", xp:3, attr:"strength" },
];

const WEEKLY_TASKS = [
  { id:"w1", title:"完成 3 次徒手/彈力帶訓練", xp:20, attr:"strength" },
  { id:"w2", title:"多鄰國日語 3 次", xp:15, attr:"wisdom" },
  { id:"w3", title:"一週穿搭檢查與維護", xp:10, attr:"charisma" },
  { id:"w4", title:"週度收支盤點", xp:15, attr:"wealth" },
];

function defaultState(){
  return {
    version: VERSION,
    level: 20,
    xp: 0,
    attrs: { strength:6, wisdom:6, charisma:7, wealth:5 },
    completedDaily: {},
    completedWeekly: {},
  };
}

let state = loadState();
render();

function loadState(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw) return defaultState();
    return JSON.parse(raw);
  }catch(e){ return defaultState(); }
}

function saveState(){ localStorage.setItem(KEY, JSON.stringify(state)); }

function addXP(amount){
  state.xp += amount;
  while(state.xp >= XP_PER_LEVEL){
    state.xp -= XP_PER_LEVEL;
    state.level += 1;
  }
  saveState();
  render();
}

function toggleTask(id, isDaily){
  if(isDaily){
    state.completedDaily[id] = !state.completedDaily[id];
    if(state.completedDaily[id]){
      const task = DAILY_TASKS.find(t => t.id === id);
      state.attrs[task.attr]++;
      addXP(task.xp);
    }
  } else {
    state.completedWeekly[id] = !state.completedWeekly[id];
    if(state.completedWeekly[id]){
      const task = WEEKLY_TASKS.find(t => t.id === id);
      state.attrs[task.attr]++;
      addXP(task.xp);
    }
  }
  saveState();
  render();
}

function render(){
  document.getElementById("level").textContent = "Lv." + state.level;
  document.getElementById("xp-label").textContent = state.xp + " / " + XP_PER_LEVEL + " XP";
  document.getElementById("xp-fill").style.width = (state.xp / XP_PER_LEVEL * 100) + "%";
  document.getElementById("stats").innerHTML = Object.entries(state.attrs).map(([k,v]) => `<div>${k}: ${v}</div>`).join("");
  document.getElementById("daily-tasks").innerHTML = DAILY_TASKS.map(t => `<div class="task ${state.completedDaily[t.id]?'completed':''}" onclick="toggleTask('${t.id}',true)">${t.title}</div>`).join("");
  document.getElementById("weekly-tasks").innerHTML = WEEKLY_TASKS.map(t => `<div class="task ${state.completedWeekly[t.id]?'completed':''}" onclick="toggleTask('${t.id}',false)">${t.title}</div>`).join("");
}