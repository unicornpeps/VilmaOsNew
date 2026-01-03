const STORAGE_KEY = "vilmaOSData";
const defaultCategories = ["Home", "Work", "Health", "Admin", "Cat", "Social", "Other"];

const seedData = {
  energyState: "yellow",
  themes: ["Work", "Home", "Health"],
  hoursLogged: 2.5,
  categories: defaultCategories,
  tasks: [
    {
      id: "task-1",
      title: "Draft client update email",
      type: "task",
      category: "Work",
      status: "planned",
      due_date: new Date().toISOString(),
      preferred_day: new Date().toISOString(),
      estimate: "S",
      next_step: "Open email draft and list 3 updates",
      definition_of_done: "Email sent to client",
      checklist: ["Status update", "Timeline", "Next steps"],
      created_at: new Date().toISOString(),
      completed_at: null,
    },
    {
      id: "task-2",
      title: "30-min walk",
      type: "task",
      category: "Health",
      status: "planned",
      due_date: new Date().toISOString(),
      preferred_day: new Date().toISOString(),
      estimate: "M",
      next_step: "Put on shoes and grab water bottle",
      definition_of_done: "30 minutes logged on watch",
      checklist: [],
      created_at: new Date().toISOString(),
      completed_at: null,
    },
    {
      id: "task-3",
      title: "Pay internet bill",
      type: "task",
      category: "Admin",
      status: "planned",
      due_date: new Date().toISOString(),
      preferred_day: new Date().toISOString(),
      estimate: "XS",
      next_step: "Open billing portal",
      definition_of_done: "Payment confirmation received",
      checklist: [],
      created_at: new Date().toISOString(),
      completed_at: null,
    },
    {
      id: "task-4",
      title: "Idea: Cat toy subscription",
      type: "note",
      category: "Cat",
      status: "inbox",
      due_date: null,
      preferred_day: null,
      estimate: "XS",
      next_step: "",
      definition_of_done: "",
      checklist: [],
      created_at: new Date().toISOString(),
      completed_at: null,
    },
    {
      id: "task-5",
      title: "Clear desk surface",
      type: "task",
      category: "Home",
      status: "done",
      due_date: null,
      preferred_day: null,
      estimate: "XS",
      next_step: "Move top stack to shelf",
      definition_of_done: "Desk clear except laptop",
      checklist: [],
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    },
  ],
  routines: [
    {
      id: "routine-1",
      name: "Morning Start",
      schedule: "daily",
      day_of_week: null,
      variants: {
        green: ["Water", "Light stretch", "Top 3 review"],
        yellow: ["Water", "Review Top 3"],
        red: ["Water", "1 deep breath"],
      },
    },
    {
      id: "routine-2",
      name: "Work Start (2 min)",
      schedule: "daily",
      day_of_week: null,
      variants: {
        green: ["Open priority doc", "Check calendar"],
        yellow: ["Open priority doc"],
        red: ["Open laptop"],
      },
    },
    {
      id: "routine-3",
      name: "Evening Shutdown",
      schedule: "daily",
      day_of_week: null,
      variants: {
        green: ["Review done list", "Plan tomorrow", "Lights out"],
        yellow: ["Review done list", "Plan tomorrow"],
        red: ["Lights out"],
      },
    },
    {
      id: "routine-4",
      name: "Friday Laundry Reset",
      schedule: "weekly",
      day_of_week: 5,
      variants: {
        green: ["Sort laundry", "Start wash", "Fold"],
        yellow: ["Sort laundry", "Start wash"],
        red: ["Start wash"],
      },
    },
  ],
};

let appState = loadState();

const viewTitle = document.getElementById("viewTitle");
const viewSubtitle = document.getElementById("viewSubtitle");
const energyChip = document.getElementById("energyChip");

const viewMap = {
  today: {
    title: "Today",
    subtitle: "Know what to do in 10 seconds.",
  },
  inbox: {
    title: "Inbox",
    subtitle: "Brain dump with fast triage.",
  },
  week: {
    title: "Week",
    subtitle: "Flexible planning without time blocks.",
  },
  routines: {
    title: "Routines",
    subtitle: "Gentle defaults that guide your day.",
  },
  history: {
    title: "History & Insights",
    subtitle: "See your progress without guilt.",
  },
  settings: {
    title: "Settings",
    subtitle: "Minimal controls, zero clutter.",
  },
};

const estimateMap = {
  XS: 5,
  S: 15,
  M: 30,
  L: 60,
  XL: 120,
};

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return structuredClone(seedData);
  }
  return JSON.parse(stored);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function setEnergyState(state) {
  appState.energyState = state;
  energyChip.textContent = `Energy: ${capitalize(state)}`;
  document.querySelectorAll(".energy-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.energy === state);
  });
  saveState();
  renderToday();
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(date) {
  const dateValue = new Date(date);
  return dateValue.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function isSameDay(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getTodayTasks() {
  const today = new Date();
  return appState.tasks.filter((task) =>
    ["planned", "doing"].includes(task.status) &&
    (task.preferred_day ? isSameDay(task.preferred_day, today) : true)
  );
}

function getQuickWins() {
  return appState.tasks.filter((task) =>
    task.status === "planned" && estimateMap[task.estimate] <= 15
  );
}

function renderTaskCard(task, options = {}) {
  const card = document.createElement("div");
  card.className = "task-card";
  card.draggable = options.draggable || false;
  card.dataset.taskId = task.id;

  card.innerHTML = `
    <strong>${task.title}</strong>
    <small>${task.category} · ${task.estimate} · ${task.type}</small>
    <div class="task-meta">
      <span>${task.preferred_day ? formatDate(task.preferred_day) : "Flexible"}</span>
      <span>${task.status}</span>
    </div>
  `;

  card.addEventListener("click", (event) => {
    if (event.target.closest("button")) {
      return;
    }
    openDetailModal(task.id);
  });

  if (options.showActions) {
    const actions = document.createElement("div");
    actions.className = "task-actions";
    const planBtn = document.createElement("button");
    planBtn.className = "ghost";
    planBtn.textContent = "Plan to week";
    planBtn.addEventListener("click", () => {
      task.status = "planned";
      task.preferred_day = new Date().toISOString();
      saveState();
      renderInbox();
      renderWeek();
      renderToday();
    });

    const convertBtn = document.createElement("button");
    convertBtn.className = "ghost";
    convertBtn.textContent = task.type === "note" ? "Convert to task" : "Convert to note";
    convertBtn.addEventListener("click", () => {
      task.type = task.type === "note" ? "task" : "note";
      saveState();
      renderInbox();
    });

    const categorySelect = document.createElement("select");
    appState.categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      if (task.category === category) {
        option.selected = true;
      }
      categorySelect.appendChild(option);
    });
    categorySelect.addEventListener("change", (event) => {
      task.category = event.target.value;
      saveState();
      renderInbox();
    });

    actions.append(planBtn, convertBtn, categorySelect);
    card.appendChild(actions);
  }

  return card;
}

function renderToday() {
  const topThreeList = document.getElementById("topThreeList");
  const quickWinsList = document.getElementById("quickWinsList");
  const routinesList = document.getElementById("todayRoutines");
  const doneList = document.getElementById("doneList");
  const doneCount = document.getElementById("doneCount");

  topThreeList.innerHTML = "";
  quickWinsList.innerHTML = "";
  routinesList.innerHTML = "";
  doneList.innerHTML = "";

  const todayTasks = getTodayTasks().slice(0, 3);
  const quickWins = getQuickWins();

  let filteredTopThree = todayTasks;
  let filteredQuickWins = quickWins;

  if (appState.energyState === "red") {
    filteredTopThree = todayTasks.slice(0, 1);
    filteredQuickWins = quickWins.slice(0, 3);
  }

  if (appState.energyState === "yellow") {
    filteredTopThree = todayTasks;
  }

  if (appState.energyState === "green") {
    filteredTopThree = todayTasks;
    filteredQuickWins = quickWins;
  }

  if (filteredTopThree.length === 0) {
    topThreeList.innerHTML = "<p class=\"muted\">No planned tasks yet.</p>";
  } else {
    filteredTopThree.forEach((task) => topThreeList.appendChild(renderTaskCard(task)));
  }

  if (filteredQuickWins.length === 0) {
    quickWinsList.innerHTML = "<p class=\"muted\">No quick wins available.</p>";
  } else {
    filteredQuickWins.forEach((task) => quickWinsList.appendChild(renderTaskCard(task)));
  }

  const routines = appState.routines.filter((routine) => routine.schedule === "daily");
  routines.forEach((routine) => {
    const card = document.createElement("div");
    card.className = "routine-card";
    const steps = routine.variants[appState.energyState].join(", ");
    card.innerHTML = `
      <strong>${routine.name}</strong>
      <small>${steps}</small>
    `;
    routinesList.appendChild(card);
  });

  const doneToday = appState.tasks.filter((task) =>
    task.status === "done" && task.completed_at && isSameDay(task.completed_at, new Date())
  );
  doneCount.textContent = doneToday.length.toString();
  if (doneToday.length === 0) {
    doneList.innerHTML = "<p class=\"muted\">Nothing completed yet.</p>";
  } else {
    doneToday.forEach((task) => doneList.appendChild(renderTaskCard(task)));
  }
}

function renderInbox() {
  const inboxList = document.getElementById("inboxList");
  inboxList.innerHTML = "";

  const inboxTasks = appState.tasks.filter((task) => task.status === "inbox");
  if (inboxTasks.length === 0) {
    inboxList.innerHTML = "<p class=\"muted\">Inbox is clear.</p>";
    return;
  }

  inboxTasks.forEach((task) => inboxList.appendChild(renderTaskCard(task, { showActions: true })));
}

function renderWeek() {
  const weekGrid = document.getElementById("weekGrid");
  weekGrid.innerHTML = "";
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay());
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });

  days.forEach((date) => {
    const dayContainer = document.createElement("div");
    dayContainer.className = "week-day";
    dayContainer.dataset.date = date.toISOString();
    dayContainer.innerHTML = `<h4>${formatDate(date)}</h4>`;

    dayContainer.addEventListener("dragover", (event) => event.preventDefault());
    dayContainer.addEventListener("drop", (event) => {
      event.preventDefault();
      const taskId = event.dataTransfer.getData("text/plain");
      const task = appState.tasks.find((item) => item.id === taskId);
      if (task) {
        task.preferred_day = date.toISOString();
        task.status = "planned";
        saveState();
        renderWeek();
        renderToday();
      }
    });

    const dayTasks = appState.tasks.filter(
      (task) => task.preferred_day && isSameDay(task.preferred_day, date) && task.status !== "done"
    );

    dayTasks.forEach((task) => {
      const card = renderTaskCard(task, { draggable: true });
      card.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", task.id);
      });
      dayContainer.appendChild(card);
    });

    weekGrid.appendChild(dayContainer);
  });

  document.querySelectorAll(".theme-input").forEach((input) => {
    const index = Number(input.dataset.theme);
    input.value = appState.themes[index] || "";
    input.addEventListener("change", (event) => {
      appState.themes[index] = event.target.value;
      saveState();
    });
  });

  const hoursLogged = document.getElementById("hoursLogged");
  hoursLogged.value = appState.hoursLogged;
  hoursLogged.addEventListener("change", (event) => {
    appState.hoursLogged = Number(event.target.value);
    saveState();
    updateProgressIndicator();
  });

  updateProgressIndicator();
}

function updateProgressIndicator() {
  const indicator = document.getElementById("progressIndicator");
  const plannedMinutes = appState.tasks
    .filter((task) => task.status === "planned")
    .reduce((total, task) => total + (estimateMap[task.estimate] || 0), 0);
  indicator.textContent = `Planned ${Math.round(plannedMinutes / 60)} hrs • Logged ${appState.hoursLogged} hrs`;
}

function renderRoutines() {
  const routineList = document.getElementById("routineList");
  routineList.innerHTML = "";
  appState.routines.forEach((routine) => {
    const card = document.createElement("div");
    card.className = "routine-card";
    card.innerHTML = `
      <strong>${routine.name}</strong>
      <small>${routine.schedule === "daily" ? "Daily" : `Weekly · ${dayName(routine.day_of_week)}`}</small>
      <div><em>Green:</em> ${routine.variants.green.join(", ")}</div>
      <div><em>Yellow:</em> ${routine.variants.yellow.join(", ")}</div>
      <div><em>Red:</em> ${routine.variants.red.join(", ")}</div>
    `;
    routineList.appendChild(card);
  });
}

function dayName(index) {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return names[index] || "";
}

function renderHistory() {
  const summary = document.getElementById("historySummary");
  const historyList = document.getElementById("historyList");
  const completed = appState.tasks.filter((task) => task.status === "done");
  const completionRate = Math.round((completed.length / appState.tasks.length) * 100) || 0;
  const categoryCounts = completed.reduce((acc, task) => {
    acc[task.category] = (acc[task.category] || 0) + 1;
    return acc;
  }, {});

  const accuracy = completed.length
    ? Math.round(
        (completed.filter((task) => estimateMap[task.estimate] <= 30).length / completed.length) * 100
      )
    : 0;

  summary.innerHTML = `
    <div><strong>Completion rate:</strong> ${completionRate}%</div>
    <div><strong>Average estimate accuracy:</strong> ${accuracy}%</div>
    <div><strong>Top categories:</strong> ${Object.keys(categoryCounts)
      .slice(0, 3)
      .join(", ") || "No data"}</div>
  `;

  historyList.innerHTML = "";
  completed.slice(0, 10).forEach((task) => {
    const card = document.createElement("div");
    card.className = "task-card";
    card.innerHTML = `
      <strong>${task.title}</strong>
      <small>${task.category} · Completed ${formatDate(task.completed_at)}</small>
    `;
    historyList.appendChild(card);
  });
}

function renderSettings() {
  const categoryList = document.getElementById("categoryList");
  categoryList.innerHTML = "";
  appState.categories.forEach((category) => {
    const pill = document.createElement("div");
    pill.className = "pill";
    pill.textContent = category;
    categoryList.appendChild(pill);
  });
}

function openFocus(taskId) {
  const modal = document.getElementById("focusModal");
  const focusTask = document.getElementById("focusTask");
  const task = appState.tasks.find((item) => item.id === taskId);
  if (!task) {
    return;
  }

  if (!task.next_step || !task.definition_of_done) {
    alert("Add a next step and definition of done before starting.");
    openDetailModal(task.id);
    return;
  }

  focusTask.innerHTML = `
    <strong>${task.title}</strong>
    <small>${task.next_step}</small>
    <div class="task-meta">
      <span>${task.estimate}</span>
      <span>${task.definition_of_done}</span>
    </div>
  `;

  modal.classList.add("show");
  startTimer();

  document.getElementById("focusDone").onclick = () => {
    task.status = "done";
    task.completed_at = new Date().toISOString();
    saveState();
    modal.classList.remove("show");
    renderToday();
    renderHistory();
  };

  document.getElementById("focusStuck").onclick = () => {
    alert("If stuck: break it down, do a 2-minute start, or switch to a quick win.");
  };

  document.getElementById("focusSwitch").onclick = () => {
    const quickWin = getQuickWins()[0];
    if (quickWin) {
      openFocus(quickWin.id);
    } else {
      alert("No quick wins available.");
    }
  };
}

let timerInterval = null;
let timerRemaining = 1500;

function startTimer() {
  const select = document.getElementById("timerSelect");
  const display = document.getElementById("timerDisplay");
  timerRemaining = Number(select.value) * 60;
  updateTimerDisplay();
  clearInterval(timerInterval);
  timerInterval = null;
  document.getElementById("timerStart").onclick = () => {
    if (timerRemaining === 0) {
      return;
    }
    if (timerInterval) {
      return;
    }
    timerInterval = setInterval(() => {
      timerRemaining -= 1;
      updateTimerDisplay();
      if (timerRemaining <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        alert("Timer complete. Consider marking done or taking a break.");
      }
    }, 1000);
  };

  document.getElementById("timerPause").onclick = () => {
    clearInterval(timerInterval);
    timerInterval = null;
  };

  select.onchange = () => {
    timerRemaining = Number(select.value) * 60;
    updateTimerDisplay();
  };

  function updateTimerDisplay() {
    const minutes = Math.floor(timerRemaining / 60);
    const seconds = timerRemaining % 60;
    display.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
}

function openShutdown() {
  const modal = document.getElementById("shutdownModal");
  const doneList = document.getElementById("shutdownDone");
  const tomorrowSelect = document.getElementById("tomorrowSelect");
  const doneToday = appState.tasks.filter((task) =>
    task.status === "done" && task.completed_at && isSameDay(task.completed_at, new Date())
  );

  doneList.innerHTML = "";
  doneToday.forEach((task) => doneList.appendChild(renderTaskCard(task)));

  tomorrowSelect.innerHTML = "";
  const candidates = appState.tasks.filter((task) => task.status === "planned");
  candidates.forEach((task) => {
    const option = document.createElement("option");
    option.value = task.id;
    option.textContent = task.title;
    tomorrowSelect.appendChild(option);
  });

  modal.classList.add("show");

  document.getElementById("shutdownConfirm").onclick = () => {
    const selectedId = tomorrowSelect.value;
    const selectedTask = appState.tasks.find((task) => task.id === selectedId);
    if (selectedTask) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      selectedTask.preferred_day = tomorrow.toISOString();
    }
    modal.classList.remove("show");
    saveState();
    renderWeek();
  };
}

function openDetailModal(taskId) {
  const modal = document.getElementById("detailModal");
  const body = document.getElementById("detailBody");
  const task = appState.tasks.find((item) => item.id === taskId);
  if (!task) {
    return;
  }

  body.innerHTML = `
    <div>
      <strong>${task.title}</strong>
      <p class="muted">${task.category} · ${task.estimate}</p>
    </div>
    <label>
      Next step (required)
      <textarea id="detailNext">${task.next_step || ""}</textarea>
    </label>
    <label>
      Definition of done (required)
      <textarea id="detailDone">${task.definition_of_done || ""}</textarea>
    </label>
    <label>
      Estimate
      <select id="detailEstimate">
        ${Object.keys(estimateMap)
          .map(
            (key) => `<option value="${key}" ${task.estimate === key ? "selected" : ""}>${key}</option>`
          )
          .join("")}
      </select>
    </label>
  `;

  modal.classList.add("show");
  document.getElementById("detailStart").onclick = () => {
    const nextStep = document.getElementById("detailNext").value.trim();
    const done = document.getElementById("detailDone").value.trim();
    const estimate = document.getElementById("detailEstimate").value;
    if (!nextStep || !done) {
      alert("Next step and definition of done are required.");
      return;
    }
    task.next_step = nextStep;
    task.definition_of_done = done;
    task.estimate = estimate;
    saveState();
    modal.classList.remove("show");
    openFocus(task.id);
  };
}

function addInboxTask() {
  const input = document.getElementById("inboxInput");
  const value = input.value.trim();
  if (!value) {
    return;
  }
  appState.tasks.unshift({
    id: `task-${Date.now()}`,
    title: value,
    type: "task",
    category: "Other",
    status: "inbox",
    due_date: null,
    preferred_day: null,
    estimate: "S",
    next_step: "",
    definition_of_done: "",
    checklist: [],
    created_at: new Date().toISOString(),
    completed_at: null,
  });
  input.value = "";
  saveState();
  renderInbox();
}

function setView(view) {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === view);
  });
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("active", section.id === `view${capitalize(view)}`);
  });
  viewTitle.textContent = viewMap[view].title;
  viewSubtitle.textContent = viewMap[view].subtitle;
}

function exportData() {
  const blob = new Blob([JSON.stringify(appState, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "vilma-os-data.json";
  link.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const data = JSON.parse(reader.result);
    appState = data;
    saveState();
    initialize();
  };
  reader.readAsText(file);
}

function initialize() {
  setEnergyState(appState.energyState || "yellow");
  renderToday();
  renderInbox();
  renderWeek();
  renderRoutines();
  renderHistory();
  renderSettings();
}

initialize();

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "n") {
    setView("inbox");
    document.getElementById("inboxInput").focus();
  }
  if (event.key.toLowerCase() === "f") {
    const candidate = getTodayTasks()[0] || getQuickWins()[0];
    if (candidate) {
      openFocus(candidate.id);
    }
  }
});

// nav

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    setView(button.dataset.view);
  });
});

// energy buttons

document.querySelectorAll(".energy-button").forEach((button) => {
  button.addEventListener("click", () => setEnergyState(button.dataset.energy));
});

// inbox

document.getElementById("inboxAddBtn").addEventListener("click", addInboxTask);
document.getElementById("inboxInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addInboxTask();
  }
});

// focus modal

document.getElementById("startNowBtn").addEventListener("click", () => {
  const candidate = getTodayTasks()[0] || getQuickWins()[0];
  if (candidate) {
    openFocus(candidate.id);
  }
});

document.getElementById("focusClose").addEventListener("click", () => {
  document.getElementById("focusModal").classList.remove("show");
  clearInterval(timerInterval);
  timerInterval = null;
});

// shutdown

document.getElementById("shutdownBtn").addEventListener("click", openShutdown);
document.getElementById("shutdownClose").addEventListener("click", () => {
  document.getElementById("shutdownModal").classList.remove("show");
});

// detail

document.getElementById("detailClose").addEventListener("click", () => {
  document.getElementById("detailModal").classList.remove("show");
});

// import/export

document.getElementById("exportBtn").addEventListener("click", exportData);
document.getElementById("importBtn").addEventListener("click", () => {
  document.getElementById("importFile").click();
});

document.getElementById("importFile").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    importData(file);
  }
});

// settings

document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});


document.getElementById("settingsExport").addEventListener("click", exportData);

document.getElementById("settingsImport").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    importData(file);
  }
});
