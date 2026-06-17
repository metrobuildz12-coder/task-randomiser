import { useState, useEffect, useCallback, useRef } from "react";

const BG = "#0f0f1a";
const SURFACE = "#16162a";
const SURFACE2 = "#1e1e35";
const SURFACE3 = "#252540";
const ACCENT = "#7c3aed";
const ACCENT2 = "#a855f7";
const ACCENT3 = "#c084fc";
const TEXT = "#e2e8f0";
const MUTED = "#64748b";
const SUCCESS = "#10b981";
const GOLD = "#f59e0b";
const DANGER = "#ef4444";
const BORDER = "rgba(124,58,237,0.2)";

const LEVEL_NAMES = [
  "Beginner", "Building", "Focused", "Locked In",
  "Disciplined", "Dedicated", "Elite", "Unstoppable", "Legendary"
];

const LEVEL_UP_MSGS = [
  "Level up! Keep the momentum going 🔥",
  "XP secured. You're getting stronger 💪",
  "Another step closer to greatness ⚡",
  "Nice. Future you is proud already 😎",
  "Locked in and leveling up 🚀",
  "Discipline > Motivation. XP gained 🧠",
  "Small wins become big victories 🏆",
  "You're building a beast one task at a time 🦾",
  "Progress saved. Continue your streak 🔥",
  "Main character development detected 🎬",
  "The grind pays off. Keep moving ⚔️",
  "Your stats just increased 📈",
  "One more task conquered. Huge W 👑",
  "Level complete. On to the next challenge 🌟",
  "Bro touched grass. XP awarded 🌱",
  "Your procrastination took critical damage 💀",
  "Lock-in levels approaching dangerous heights ⚠️",
  "The dopamine goblin has been defeated 👹",
  "Productivity rizz +10 ✨",
  "Congratulations. You're officially cooking 🍳🔥"
];

const DEFAULT_TASKS = {
  physical: [
    { name: "Gym", priority: 10 },
    { name: "Football", priority: 8 },
    { name: "Basketball", priority: 4 },
    { name: "Volleyball", priority: 4 }
  ],
  creativity: [
    { name: "Guitar", priority: 5 },
    { name: "Arts", priority: 6 }
  ],
  extra: [
    { name: "Vocabulary", priority: 3 },
    { name: "Fluency", priority: 6 },
    { name: "Debate", priority: 4 }
  ],
  entertainment: [
    { name: "VideoGames", priority: 5 },
    { name: "Netflix", priority: 7 },
    { name: "Youtube", priority: 4 }
  ],
  mandatory: [
    { name: "Reading", priority: 1 },
    { name: "Drink 2 Litres of Water", priority: 1 },
    { name: "Go For A Run", priority: 1 },
    { name: "Wake Up At 8AM", priority: 1 }
  ]
};

const CATEGORIES = ["physical", "creativity", "extra", "entertainment"];
const WEEKLY_GOAL = 300;

function weightedRandom(pool) {
  const total = pool.reduce((s, t) => s + t.priority, 0);
  let r = Math.random() * total;
  for (const t of pool) {
    r -= t.priority;
    if (r <= 0) return t.name;
  }
  return pool[pool.length - 1].name;
}

function pickTasks(userTasks) {
  const chosen = [];
  for (const cat of CATEGORIES) {
    const pool = userTasks[cat] || [];
    if (pool.length > 0) chosen.push(weightedRandom(pool));
  }
  const mandatory = (userTasks.mandatory || []).map(t => t.name);
  return [...chosen, ...mandatory];
}

function getOrdinal() {
  const d = new Date();
  return Math.floor(d.getTime() / 86400000);
}

const CAT_ICONS = {
  physical: "⚔️",
  creativity: "🎨",
  extra: "📚",
  entertainment: "🎮",
  mandatory: "🛡️"
};

const CAT_COLORS = {
  physical: ACCENT,
  creativity: "#ec4899",
  extra: "#3b82f6",
  entertainment: "#10b981",
  mandatory: GOLD
};

function XPBar({ value, max, color = ACCENT2 }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ background: SURFACE3, borderRadius: 999, height: 8, overflow: "hidden", width: "100%" }}>
      <div style={{
        height: "100%", width: `${pct}%`, borderRadius: 999,
        background: `linear-gradient(90deg, ${color}, ${color}cc)`,
        transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: `0 0 8px ${color}88`
      }} />
    </div>
  );
}

function StatPill({ label, value, color = ACCENT2 }) {
  return (
    <div style={{
      background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 12,
      padding: "8px 16px", textAlign: "center", minWidth: 90
    }}>
      <div style={{ color, fontSize: 18, fontWeight: 700, letterSpacing: "-0.5px" }}>{value}</div>
      <div style={{ color: MUTED, fontSize: 11, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function CheckRow({ name, checked, onChange, animating }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      display: "flex", alignItems: "center", gap: 14,
      background: checked ? "rgba(124,58,237,0.12)" : SURFACE2,
      border: `1px solid ${checked ? ACCENT : BORDER}`,
      borderRadius: 12, padding: "14px 18px", cursor: "pointer",
      transition: "all 0.25s ease",
      transform: animating ? "scale(1.02)" : "scale(1)"
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
        border: `2px solid ${checked ? ACCENT : MUTED}`,
        background: checked ? ACCENT : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s ease"
      }}>
        {checked && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
      </div>
      <span style={{
        color: checked ? TEXT : MUTED, fontSize: 15, fontWeight: checked ? 500 : 400,
        textDecoration: checked ? "none" : "none", transition: "color 0.2s"
      }}>{name}</span>
      {checked && <span style={{ marginLeft: "auto", color: SUCCESS, fontSize: 12, fontWeight: 600 }}>+10 XP</span>}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("today");
  const [userTasks, setUserTasks] = useState(DEFAULT_TASKS);
  const [todaysTasks, setTodaysTasks] = useState([]);
  const [completed, setCompleted] = useState({});
  const [xp, setXp] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastCheckIn, setLastCheckIn] = useState(0);
  const [weekStart, setWeekStart] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [levelMsg, setLevelMsg] = useState("you're built different 🎯");
  const [rolledToday, setRolledToday] = useState(false);
  const [animating, setAnimating] = useState({});
  const [notification, setNotification] = useState(null);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskCat, setNewTaskCat] = useState("physical");
  const [newTaskPriority, setNewTaskPriority] = useState(5);
  const [loaded, setLoaded] = useState(false);
  const notifTimer = useRef(null);

  const showNotif = (msg, color = SUCCESS) => {
    if (notifTimer.current) clearTimeout(notifTimer.current);
    setNotification({ msg, color });
    notifTimer.current = setTimeout(() => setNotification(null), 3000);
  };

  const saveData = useCallback((state) => {
    try {
      const payload = JSON.stringify(state);
      localStorage.setItem("taskrandomiser_v1", payload);
    } catch (e) {}
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const raw = localStorage.getItem("taskrandomiser_v1");
        if (raw) {
          const d = JSON.parse(raw);
          const today = getOrdinal();
          let ws = d.weekStart || today;
          let weekXp = d.xp || 0;
          if ((today - ws) >= 7) { ws = today; weekXp = 0; }

          setUserTasks(d.userTasks || DEFAULT_TASKS);
          setXp(weekXp);
          setTotalXp(d.totalXp || 0);
          setStreak(d.streak || 0);
          setLastCheckIn(d.lastCheckIn || 0);
          setWeekStart(ws);
          setCurrentLevel(d.currentLevel || 0);
          setCompleted(d.completed || {});
          setTodaysTasks(d.todaysTasks || []);
          setRolledToday(d.lastCheckIn === today);
          if (d.levelMsg) setLevelMsg(d.levelMsg);
        }
      } catch (e) {}
      setLoaded(true);
    };
    init();
  }, []);

  const computedLevel = Math.max(0, Math.floor(totalXp / 50));
  const levelXpStart = computedLevel * 50;
  const levelXpEnd = (computedLevel + 1) * 50;
  const levelProgress = totalXp - levelXpStart;
  const completedCount = Object.keys(completed).length;

  useEffect(() => {
    if (!loaded) return;
    const state = {
      userTasks, xp, totalXp, streak, lastCheckIn, weekStart,
      currentLevel, completed, todaysTasks, levelMsg
    };
    saveData(state);
  }, [userTasks, xp, totalXp, streak, lastCheckIn, weekStart, currentLevel, completed, todaysTasks, levelMsg, loaded, saveData]);

  const rollTasks = () => {
    const today = getOrdinal();
    let newStreak = streak;
    if (lastCheckIn === 0) newStreak = 1;
    else if (today === lastCheckIn + 1) newStreak = streak + 1;
    else newStreak = 1;

    const tasks = pickTasks(userTasks);
    setTodaysTasks(tasks);
    setCompleted({});
    setXp(prev => {
      const earned = 0;
      return earned;
    });
    setStreak(newStreak);
    setLastCheckIn(today);
    setRolledToday(true);
    if (newStreak > streak) showNotif(`🔥 ${newStreak} day streak!`, GOLD);
  };

  const toggleTask = (name) => {
    setAnimating(a => ({ ...a, [name]: true }));
    setTimeout(() => setAnimating(a => ({ ...a, [name]: false })), 300);

    setCompleted(prev => {
      const next = { ...prev };
      const isCompleting = !next[name];
      if (isCompleting) next[name] = true;
      else delete next[name];

      setXp(x => {
        const nx = isCompleting ? x + 10 : Math.max(0, x - 10);
        return nx;
      });
      setTotalXp(tx => {
        const ntx = isCompleting ? tx + 10 : Math.max(0, tx - 10);
        const newLvl = Math.max(0, Math.floor(ntx / 50));
        if (newLvl > currentLevel) {
          setCurrentLevel(newLvl);
          const msg = LEVEL_UP_MSGS[Math.floor(Math.random() * LEVEL_UP_MSGS.length)];
          setLevelMsg(msg);
          showNotif(`⚡ Level ${newLvl} reached! ${LEVEL_NAMES[Math.min(newLvl, LEVEL_NAMES.length - 1)]}`, ACCENT2);
        }
        return ntx;
      });
      return next;
    });
  };

  const addTask = () => {
    const name = newTaskName.trim();
    if (!name) return;
    setUserTasks(prev => ({
      ...prev,
      [newTaskCat]: [...(prev[newTaskCat] || []), { name, priority: newTaskPriority }]
    }));
    setNewTaskName("");
    showNotif(`✓ "${name}" added to ${newTaskCat}`);
  };

  const removeTask = (cat, idx) => {
    setUserTasks(prev => ({
      ...prev,
      [cat]: prev[cat].filter((_, i) => i !== idx)
    }));
  };

  const levelName = LEVEL_NAMES[Math.min(computedLevel, LEVEL_NAMES.length - 1)];
  const weekPct = Math.min(100, (xp / WEEKLY_GOAL) * 100);

  const tabStyle = (id) => ({
    flex: 1, padding: "12px 0", fontSize: 13, fontWeight: 600,
    color: tab === id ? TEXT : MUTED,
    background: tab === id ? ACCENT : "transparent",
    border: "none", cursor: "pointer", borderRadius: 10,
    transition: "all 0.2s ease", letterSpacing: "0.02em"
  });

  if (!loaded) return (
    <div style={{ background: BG, color: TEXT, fontFamily: "'Segoe UI', system-ui, sans-serif", maxWidth: 480, margin: "0 auto", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, overflowY: "auto", overscrollBehavior: "none", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div style={{ color: ACCENT2, fontSize: 16 }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ background: BG, color: TEXT, fontFamily: "'Segoe UI', system-ui, sans-serif", maxWidth: 480, margin: "0 auto", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, overflowY: "auto", overscrollBehavior: "none", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>

      {notification && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: SURFACE2, border: `1px solid ${notification.color}44`,
          borderLeft: `3px solid ${notification.color}`,
          borderRadius: 12, padding: "12px 20px", zIndex: 999,
          color: notification.color, fontSize: 14, fontWeight: 600,
          boxShadow: `0 4px 24px rgba(0,0,0,0.4)`,
          animation: "slideDown 0.3s ease", whiteSpace: "nowrap"
        }}>
          {notification.msg}
        </div>
      )}

      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateX(-50%) translateY(-10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: ${ACCENT}44; border-radius: 99px; }
        * { box-sizing: border-box; }
        input, select { background: ${SURFACE2} !important; color: ${TEXT} !important; border: 1px solid ${BORDER} !important; border-radius: 10px !important; padding: 10px 14px !important; font-size: 14px !important; outline: none !important; }
        input:focus, select:focus { border-color: ${ACCENT} !important; box-shadow: 0 0 0 3px ${ACCENT}22 !important; }
        select option { background: ${SURFACE2}; }
      `}</style>

      <div style={{ padding: "24px 20px 0" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", color: MUTED, textTransform: "uppercase", marginBottom: 8 }}>Task Randomiser</div>
          <div style={{ fontSize: 32, fontWeight: 800, background: `linear-gradient(135deg, ${ACCENT3}, ${ACCENT2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-1px" }}>
            Level {computedLevel}
          </div>
          <div style={{ color: ACCENT3, fontSize: 13, marginTop: 2, fontStyle: "italic" }}>{levelName}</div>
          <div style={{ color: MUTED, fontSize: 12, marginTop: 6, minHeight: 18 }}>{levelMsg}</div>

          <div style={{ marginTop: 14, padding: "0 8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: MUTED, fontSize: 11 }}>Level XP</span>
              <span style={{ color: ACCENT3, fontSize: 11, fontWeight: 600 }}>{levelProgress} / 50</span>
            </div>
            <XPBar value={levelProgress} max={50} color={ACCENT2} />
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
            <StatPill label="Total XP" value={totalXp} color={ACCENT2} />
            <StatPill label="Streak" value={`🔥 ${streak}d`} color={GOLD} />
            <StatPill label="Done" value={`${completedCount}/${todaysTasks.length}`} color={SUCCESS} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, background: SURFACE2, borderRadius: 12, padding: 4, marginBottom: 20, border: `1px solid ${BORDER}` }}>
          <button onClick={() => setTab("today")} style={tabStyle("today")}>Today</button>
          <button onClick={() => setTab("tasks")} style={tabStyle("tasks")}>My Tasks</button>
          <button onClick={() => setTab("guide")} style={tabStyle("guide")}>Guide</button>
        </div>
      </div>

      <div style={{ padding: "0 20px 100px" }}>

        {tab === "today" && (
          <div>
            <button
              onClick={rolledToday ? undefined : rollTasks}
              disabled={rolledToday}
              style={{
                width: "100%", padding: "16px", borderRadius: 14, border: "none",
                background: rolledToday ? SURFACE3 : `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
                color: rolledToday ? MUTED : TEXT, fontSize: 16, fontWeight: 700,
                cursor: rolledToday ? "default" : "pointer",
                boxShadow: rolledToday ? "none" : `0 4px 24px ${ACCENT}55`,
                transition: "all 0.3s ease", marginBottom: 20, letterSpacing: "0.02em"

              }}
            >
              {rolledToday ? "✓ Tasks Set for Today" : "🎲 Roll Today's Tasks"}
            </button>

            {todaysTasks.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 0", color: MUTED }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎲</div>
                <div style={{ fontSize: 15 }}>Roll your tasks to get started</div>
              </div>
            )}

            {todaysTasks.length > 0 && (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                  {todaysTasks.map(name => (
                    <CheckRow
                      key={name} name={name}
                      checked={!!completed[name]}
                      onChange={() => toggleTask(name)}
                      animating={!!animating[name]}
                    />
                  ))}
                </div>

                <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 11, letterSpacing: "0.15em", color: MUTED, textTransform: "uppercase", fontWeight: 600 }}>Weekly Goal</span>
                    <span style={{ fontSize: 12, color: xp >= WEEKLY_GOAL ? SUCCESS : MUTED, fontWeight: 600 }}>
                      {xp >= WEEKLY_GOAL ? "✅ Complete!" : `${xp} / ${WEEKLY_GOAL} XP`}
                    </span>
                  </div>
                  <XPBar value={xp} max={WEEKLY_GOAL} color={xp >= WEEKLY_GOAL ? SUCCESS : ACCENT2} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: MUTED }}>0</span>
                    <span style={{ fontSize: 11, color: MUTED }}>{WEEKLY_GOAL} XP</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "tasks" && (
          <div>
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: ACCENT3, fontWeight: 600, marginBottom: 14, letterSpacing: "0.1em", textTransform: "uppercase" }}>Add New Task</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  type="text" placeholder="Task name..."
                  value={newTaskName} onChange={e => setNewTaskName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addTask()}
                  style={{ width: "100%" }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <select value={newTaskCat} onChange={e => setNewTaskCat(e.target.value)} style={{ flex: 2 }}>
                    {[...CATEGORIES, "mandatory"].map(c => (
                      <option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                    <input
                      type="number" min={1} max={10} value={newTaskPriority}
                      onChange={e => setNewTaskPriority(Number(e.target.value))}
                      style={{ width: "100%", textAlign: "center" }}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: MUTED }}>Priority: {newTaskPriority}/10 — higher = appears more often</span>
                </div>
                <button
                  onClick={addTask}
                  style={{
                    padding: "12px", borderRadius: 10, border: "none",
                    background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
                    color: TEXT, fontSize: 14, fontWeight: 700, cursor: "pointer",
                    boxShadow: `0 2px 12px ${ACCENT}44`
                  }}
                >
                  + Add Task
                </button>
              </div>
            </div>

            {[...CATEGORIES, "mandatory"].map(cat => {
              const tasks = userTasks[cat] || [];
              return (
                <div key={cat} style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 16 }}>{CAT_ICONS[cat]}</span>
                    <span style={{ fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, color: CAT_COLORS[cat] || ACCENT2 }}>
                      {cat}
                    </span>
                    <span style={{ marginLeft: "auto", background: SURFACE3, borderRadius: 99, padding: "2px 10px", fontSize: 11, color: MUTED }}>
                      {tasks.length} tasks
                    </span>
                  </div>
                  {tasks.length === 0 && (
                    <div style={{ padding: "16px", background: SURFACE2, border: `1px dashed ${BORDER}`, borderRadius: 12, textAlign: "center", color: MUTED, fontSize: 13 }}>
                      No tasks yet
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {tasks.map((task, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        background: SURFACE2, border: `1px solid ${BORDER}`,
                        borderRadius: 12, padding: "12px 16px"
                      }}>
                        <span style={{ flex: 1, fontSize: 14, color: TEXT }}>{task.name}</span>
                        <div style={{
                          background: SURFACE3, borderRadius: 99, padding: "3px 10px",
                          fontSize: 11, color: CAT_COLORS[cat] || ACCENT2, fontWeight: 600
                        }}>
                          P{task.priority}
                        </div>
                          <button
                            onClick={() => removeTask(cat, i)}
                            style={{
                              background: "transparent", border: "none", color: DANGER,
                              fontSize: 18, cursor: "pointer", padding: "0 4px", lineHeight: 1
                            }}
                          >×</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "guide" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ textAlign: "center", padding: "20px 0 10px" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🎲</div>
              <div style={{ fontSize: 22, fontWeight: 800, background: `linear-gradient(135deg, ${ACCENT3}, ${ACCENT2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Task Randomiser</div>
              <div style={{ color: MUTED, fontSize: 13, marginTop: 4, fontStyle: "italic" }}>Stop planning. Start doing.</div>
            </div>

            {[
              {
                icon: "⚙️", title: "How It Works",
                body: "Every day you get a fresh task list built from your own habits, weighted by priority. High priority tasks appear more often. Low priority ones still show up — just less frequently. No fixed schedule. No decision fatigue."
              },
              {
                icon: "📈", title: "Levels", body: null,
                levels: [
                  [0, "Beginner", "Just getting started"],
                  [1, "Building", "Showing up matters"],
                  [2, "Focused", "Habits are forming"],
                  [3, "Locked In", "Goals are getting serious"],
                  [4, "Disciplined", "Consistency feels normal"],
                  [5, "Dedicated", "Rarely miss a day"],
                  [6, "Elite", "High effort, high output"],
                  [7, "Unstoppable", "Peak version of yourself"],
                  [8, "Legendary", "You actually did it"]
                ]
              },
              {
                icon: "🧠", title: "Why It Works",
                body: "Most people lose hours deciding what to do. This app removes that. Your tasks are ready the moment you open it. Weighted randomness keeps things fresh without losing focus on what matters most.\n\nLess thinking. Less procrastinating. More done."
              }
            ].map(({ icon, title, body, levels }) => (
              <div key={title} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 20 }}>{icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", color: ACCENT3, textTransform: "uppercase" }}>{title}</span>
                </div>
                {body && <p style={{ margin: 0, color: TEXT, fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-line" }}>{body}</p>}
                {levels && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {levels.map(([n, name, desc]) => (
                      <div key={n} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 14px", borderRadius: 10,
                        background: computedLevel === n ? `${ACCENT}22` : SURFACE2,
                        border: `1px solid ${computedLevel === n ? ACCENT : BORDER}`
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 99, flexShrink: 0,
                          background: computedLevel >= n ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` : SURFACE3,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 700, color: computedLevel >= n ? TEXT : MUTED
                        }}>{n}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: computedLevel >= n ? TEXT : MUTED }}>{name}</div>
                          <div style={{ fontSize: 11, color: MUTED }}>{desc}</div>
                        </div>
                        {computedLevel === n && <span style={{ marginLeft: "auto", fontSize: 10, color: ACCENT3, fontWeight: 700 }}>YOU ARE HERE</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div style={{ textAlign: "center", padding: "12px 0 8px", color: MUTED, fontSize: 12 }}>
              Made by <span style={{ color: ACCENT3, fontWeight: 600 }}>MetroBuildz</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
