const STORAGE_KEY = "vilmaOSData";
const MAX_TOP_THREE = 3;
const MAX_QUICK_WINS = 5;
const QUICK_ESTIMATES = [5, 10, 15, 25, 45, 60, 90, 120];

const seedCategories = [
  { id: "cat-home", name: "Home", mode: "private" },
  { id: "cat-work", name: "Work", mode: "work" },
  { id: "cat-health", name: "Health", mode: "private" },
  { id: "cat-admin", name: "Admin", mode: "work" },
  { id: "cat-cat", name: "Cat", mode: "private" },
  { id: "cat-social", name: "Social", mode: "private" },
  { id: "cat-other", name: "Other", mode: "private" },
];

const seedRoutines = [
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
];

const seedData = {
  energyState: "yellow",
  workMode: "all",
  themes: ["Work", "Home", "Health"],
  hoursLogged: 2.5,
  categories: seedCategories,
  routines: seedRoutines,
  timer: {
    remaining: 1500,
    total: 1500,
    running: false,
    linkedTaskId: "",
  },
  tasks: [
    {
      id: "task-1",
      title: "Draft client update email",
      type: "task",
      categoryId: "cat-work",
      status: "planned",
      due_date: new Date().toISOString(),
      preferred_day: new Date().toISOString(),
      estimate_minutes: 15,
      next_step: "Open email draft and list 3 updates",
      definition_of_done: "Email sent to client",
      checklist: ["Status update", "Timeline", "Next steps"],
      created_at: new Date().toISOString(),
      completed_at: null,
      today_top3: true,
      today_quick: false,
    },
    {
      id: "task-2",
      title: "30-min walk",
      type: "task",
      categoryId: "cat-health",
      status: "planned",
      due_date: new Date().toISOString(),
      preferred_day: new Date().toISOString(),
      estimate_minutes: 30,
      next_step: "Put on shoes and grab water bottle",
      definition_of_done: "30 minutes logged on watch",
      checklist: [],
      created_at: new Date().toISOString(),
      completed_at: null,
      today_top3: true,
      today_quick: false,
    },
    {
      id: "task-3",
      title: "Pay internet bill",
      type: "task",
      categoryId: "cat-admin",
      status: "planned",
      due_date: new Date().toISOString(),
      preferred_day: new Date().toISOString(),
      estimate_minutes: 5,
      next_step: "Open billing portal",
      definition_of_done: "Payment confirmation received",
      checklist: [],
      created_at: new Date().toISOString(),
      completed_at: null,
      today_top3: false,
      today_quick: true,
    },
    {
      id: "task-4",
      title: "Idea: Cat toy subscription",
      type: "note",
      categoryId: "cat-cat",
      status: "inbox",
      due_date: null,
      preferred_day: null,
      estimate_minutes: 10,
      next_step: "",
      definition_of_done: "",
      checklist: [],
      created_at: new Date().toISOString(),
      completed_at: null,
      today_top3: false,
      today_quick: false,
    },
    {
      id: "task-5",
      title: "Clear desk surface",
      type: "task",
      categoryId: "cat-home",
      status: "done",
      due_date: null,
      preferred_day: null,
      estimate_minutes: 10,
      next_step: "Move top stack to shelf",
      definition_of_done: "Desk clear except laptop",
      checklist: [],
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      today_top3: false,
      today_quick: false,
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

const estimateLegacyMap = {
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
  const parsed = JSON.parse(stored);
  return migrateState(parsed);
}

function migrateState(data) {
  const migrated = { ...data };
  if (!migrated.categories || migrated.categories.length === 0) {
    migrated.categories = structuredClone(seedCategories);
  }

  if (typeof migrated.categories[0] === "string") {
    migrated.categories = migrated.categories.map((name) => ({
      id: `cat-${name.toLowerCase()}`,
      name,
      mode: name.toLowerCase() === "work" || name.toLowerCase() === "admin" ? "work" : "private",
    }));
  }

  const categoryMap = Object.fromEntries(
    migrated.categories.map((category) => [category.name, category.id])
  );

  migrated.tasks = (migrated.tasks || []).map((task) => {
    const estimateMinutes =
      typeof task.estimate_minutes === "number"
        ? task.estimate_minutes
        : estimateLegacyMap[task.estimate] || 15;
    return {
      ...task,
      categoryId: task.categoryId || categoryMap[task.category] || "cat-other",
      estimate_minutes: estimateMinutes,
      today_top3: task.today_top3 || false,
      today_quick: task.today_quick || false,
    };
  });

  migrated.workMode = migrated.workMode || "all";
  migrated.energyState = migrated.energyState || "yellow";
  migrated.themes = migrated.themes || ["Work", "Home", "Health"];
  migrated.hoursLogged = Number(migrated.hoursLogged || 0);
  migrated.routines = migrated.routines && migrated.routines.length ? migrated.routines : seedRoutines;
  migrated.timer = migrated.timer || {
    remaining: 1500,
    total: 1500,
    running: false,
    linkedTaskId: "",
  };

  return migrated;
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

function setWorkMode(mode) {
  appState.workMode = mode;
  document.querySelectorAll("#modeToggle .chip").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
  saveState();
  renderToday();
  renderInbox();
  renderWeek();
  renderHistory();
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

function getCategoryById(id) {
  return appState.categories.find((category) => category.id === id);
}

function isTaskVisible(task) {
  if (appState.workMode === "all") {
    return true;
  }
  const category = getCategoryById(task.categoryId);
  if (!category) {
    return appState.workMode === "private";
  }
  return category.mode === appState.workMode;
}

function getTopThree() {
  return appState.tasks.filter((task) => task.today_top3 && isTaskVisible(task));
}

function getQuickWins() {
  return appState.tasks.filter((task) => task.today_quick && isTaskVisible(task));
}

function getCategoryLabel(task) {
  const category = getCategoryById(task.categoryId);
  return category ? category.name : "Unknown";
}

function renderTaskCard(task, options = {}) {
  const card = document.createElement("div");
  card.className = "task-card";
  card.draggable = options.draggable || false;
  card.dataset.taskId = task.id;

  card.innerHTML = `
    <strong>${task.title}</strong>
    <small>${getCategoryLabel(task)} · ${task.estimate_minutes} min · ${task.type}</small>
    <div class="task-meta">
      <span>${task.preferred_day ? formatDate(task.preferred_day) : "Flexible"}</span>
      <span>${task.status}</span>
    </div>
  `;

  card.addEventListener("click", (event) => {
    if (event.target.closest("button") || event.target.closest("select")) {
      return;
    }
    openDetailModal(task.id);
  });

  if (options.showActions || options.showPickActions) {
    const actions = document.createElement("div");
    actions.className = "task-actions";

    if (options.showPickActions) {
      const topBtn = document.createElement("button");
      topBtn.className = "ghost";
      topBtn.textContent = task.today_top3 ? "Remove Top 3" : "Pick for Top 3";
      topBtn.addEventListener("click", () => toggleTopThree(task));

      const quickBtn = document.createElement("button");
      quickBtn.className = "ghost";
      quickBtn.textContent = task.today_quick ? "Remove Quick Win" : "Pick for Quick Wins";
      quickBtn.addEventListener("click", () => toggleQuickWin(task));

      actions.append(topBtn, quickBtn);
    }

    if (options.showActions) {
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
        option.value = category.id;
        option.textContent = category.name;
        if (task.categoryId === category.id) {
          option.selected = true;
        }
        categorySelect.appendChild(option);
      });
      categorySelect.addEventListener("change", (event) => {
        task.categoryId = event.target.value;
        saveState();
        renderInbox();
      });

      actions.append(planBtn, convertBtn, categorySelect);
    }

    card.appendChild(actions);
  }

  return card;
}

function toggleTopThree(task) {
  if (!task.today_top3) {
    const currentCount = getTopThree().length;
    if (currentCount >= MAX_TOP_THREE) {
      alert("Top 3 is full. Remove one first.");
      return;
    }
    task.today_top3 = true;
    task.status = task.status === "inbox" ? "planned" : task.status;
    task.preferred_day = new Date().toISOString();
  } else {
    task.today_top3 = false;
  }
  saveState();
  renderToday();
  renderInbox();
  renderWeek();
}

function toggleQuickWin(task) {
  if (!task.today_quick) {
    const currentCount = getQuickWins().length;
    if (currentCount >= MAX_QUICK_WINS) {
      alert("Quick wins list is full. Remove one first.");
      return;
    }
    task.today_quick = true;
    task.status = task.status === "inbox" ? "planned" : task.status;
    task.preferred_day = new Date().toISOString();
  } else {
    task.today_quick = false;
  }
  saveState();
  renderToday();
  renderInbox();
  renderWeek();
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

  let filteredTopThree = getTopThree();
  let filteredQuickWins = getQuickWins();

  if (appState.energyState === "red") {
    filteredTopThree = filteredTopThree.slice(0, 1);
    filteredQuickWins = filteredQuickWins.slice(0, 3);
  }

  if (filteredTopThree.length === 0) {
    topThreeList.innerHTML = "<p class=\"muted\">Pick up to 3 tasks for today.</p>";
  } else {
    filteredTopThree.forEach((task) =>
      topThreeList.appendChild(renderTaskCard(task, { showPickActions: true }))
    );
  }

  if (filteredQuickWins.length === 0) {
    quickWinsList.innerHTML = "<p class=\"muted\">Pick quick wins for today.</p>";
  } else {
    filteredQuickWins.forEach((task) =>
      quickWinsList.appendChild(renderTaskCard(task, { showPickActions: true }))
    );
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
  const visibleDone = doneToday.filter((task) => isTaskVisible(task));
  doneCount.textContent = visibleDone.length.toString();
  if (visibleDone.length === 0) {
    doneList.innerHTML = "<p class=\"muted\">Nothing completed yet.</p>";
  } else {
    visibleDone.forEach((task) => doneList.appendChild(renderTaskCard(task)));
  }
  refreshTimerLinks();
}

function renderInbox() {
  const inboxList = document.getElementById("inboxList");
  inboxList.innerHTML = "";

  const inboxTasks = appState.tasks.filter((task) => task.status === "inbox" && isTaskVisible(task));
  if (inboxTasks.length === 0) {
    inboxList.innerHTML = "<p class=\"muted\">Inbox is clear.</p>";
    return;
  }

  inboxTasks.forEach((task) =>
    inboxList.appendChild(renderTaskCard(task, { showActions: true, showPickActions: true }))
  );
  refreshTimerLinks();
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
      (task) =>
        task.preferred_day &&
        isSameDay(task.preferred_day, date) &&
        task.status !== "done" &&
        isTaskVisible(task)
    );

    dayTasks.forEach((task) => {
      const card = renderTaskCard(task, { draggable: true, showPickActions: true });
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
  refreshTimerLinks();
}

function updateProgressIndicator() {
  const indicator = document.getElementById("progressIndicator");
  const plannedMinutes = appState.tasks
    .filter((task) => task.status === "planned")
    .reduce((total, task) => total + (task.estimate_minutes || 0), 0);
  indicator.textContent = `Planned ${Math.round(plannedMinutes / 60)} hrs • Logged ${appState.hoursLogged} hrs`;
}

function renderRoutines() {
  const routineList = document.getElementById("routineList");
  routineList.innerHTML = "";
  appState.routines.forEach((routine) => {
    const card = document.createElement("div");
    card.className = "routine-card";
    card.innerHTML = `
      <label>
        Name
        <input type="text" value="${routine.name}" data-routine-name="${routine.id}" />
      </label>
      <label>
        Schedule
        <select data-routine-schedule="${routine.id}">
          <option value="daily" ${routine.schedule === "daily" ? "selected" : ""}>Daily</option>
          <option value="weekly" ${routine.schedule === "weekly" ? "selected" : ""}>Weekly</option>
        </select>
      </label>
      <label>
        Day of week (if weekly)
        <select data-routine-day="${routine.id}">
          ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
            .map(
              (name, index) =>
                `<option value="${index}" ${routine.day_of_week === index ? "selected" : ""}>${name}</option>`
            )
            .join("")}
        </select>
      </label>
      <label>
        Green steps (comma separated)
        <textarea data-routine-variant="green" data-routine-id="${routine.id}">${
          routine.variants.green.join(", ")
        }</textarea>
      </label>
      <label>
        Yellow steps (comma separated)
        <textarea data-routine-variant="yellow" data-routine-id="${routine.id}">${
          routine.variants.yellow.join(", ")
        }</textarea>
      </label>
      <label>
        Red steps (comma separated)
        <textarea data-routine-variant="red" data-routine-id="${routine.id}">${
          routine.variants.red.join(", ")
        }</textarea>
      </label>
    `;

    routineList.appendChild(card);
  });

  document.querySelectorAll("[data-routine-name]").forEach((input) => {
    input.addEventListener("change", (event) => {
      const routine = appState.routines.find((item) => item.id === event.target.dataset.routineName);
      if (routine) {
        routine.name = event.target.value;
        saveState();
        renderToday();
      }
    });
  });

  document.querySelectorAll("[data-routine-schedule]").forEach((select) => {
    select.addEventListener("change", (event) => {
      const routine = appState.routines.find(
        (item) => item.id === event.target.dataset.routineSchedule
      );
      if (routine) {
        routine.schedule = event.target.value;
        saveState();
        renderToday();
      }
    });
  });

  document.querySelectorAll("[data-routine-day]").forEach((select) => {
    select.addEventListener("change", (event) => {
      const routine = appState.routines.find((item) => item.id === event.target.dataset.routineDay);
      if (routine) {
        routine.day_of_week = Number(event.target.value);
        saveState();
      }
    });
  });

  document.querySelectorAll("[data-routine-variant]").forEach((textarea) => {
    textarea.addEventListener("change", (event) => {
      const routine = appState.routines.find((item) => item.id === event.target.dataset.routineId);
      if (routine) {
        routine.variants[event.target.dataset.routineVariant] = event.target.value
          .split(",")
          .map((step) => step.trim())
          .filter(Boolean);
        saveState();
        renderToday();
      }
    });
  });
}

function renderHistory() {
  const summary = document.getElementById("historySummary");
  const historyList = document.getElementById("historyList");
  const completed = appState.tasks.filter((task) => task.status === "done" && isTaskVisible(task));
  const completionRate = Math.round((completed.length / appState.tasks.length) * 100) || 0;
  const categoryCounts = completed.reduce((acc, task) => {
    const category = getCategoryById(task.categoryId);
    const name = category ? category.name : "Unknown";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const accuracy = completed.length
    ? Math.round(
        (completed.filter((task) => task.estimate_minutes <= 30).length / completed.length) * 100
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
      <small>${getCategoryLabel(task)} · Completed ${formatDate(task.completed_at)}</small>
    `;
    historyList.appendChild(card);
  });
}

function renderSettings() {
  const categoryList = document.getElementById("categoryList");
  categoryList.innerHTML = "";
  appState.categories.forEach((category) => {
    const row = document.createElement("div");
    row.className = "category-row";
    row.innerHTML = `
      <input type="text" value="${category.name}" data-category-name="${category.id}" />
      <select data-category-mode="${category.id}">
        <option value="work" ${category.mode === "work" ? "selected" : ""}>Work</option>
        <option value="private" ${category.mode === "private" ? "selected" : ""}>Private</option>
      </select>
      <button class="ghost" data-category-delete="${category.id}">Delete</button>
    `;
    categoryList.appendChild(row);
  });

  document.querySelectorAll("[data-category-name]").forEach((input) => {
    input.addEventListener("change", (event) => {
      const category = appState.categories.find(
        (item) => item.id === event.target.dataset.categoryName
      );
      if (category) {
        category.name = event.target.value.trim() || category.name;
        saveState();
        renderSettings();
        renderToday();
        renderInbox();
        renderWeek();
        renderHistory();
      }
    });
  });

  document.querySelectorAll("[data-category-mode]").forEach((select) => {
    select.addEventListener("change", (event) => {
      const category = appState.categories.find(
        (item) => item.id === event.target.dataset.categoryMode
      );
      if (category) {
        category.mode = event.target.value;
        saveState();
        renderToday();
        renderInbox();
        renderWeek();
        renderHistory();
      }
    });
  });

  document.querySelectorAll("[data-category-delete]").forEach((button) => {
    button.addEventListener("click", (event) => {
      const id = event.target.dataset.categoryDelete;
      if (id === "cat-other") {
        alert("Cannot delete the Other category.");
        return;
      }
      appState.categories = appState.categories.filter((category) => category.id !== id);
      appState.tasks.forEach((task) => {
        if (task.categoryId === id) {
          task.categoryId = "cat-other";
        }
      });
      saveState();
      renderSettings();
      renderToday();
      renderInbox();
      renderWeek();
      renderHistory();
    });
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
      <span>${task.estimate_minutes} min</span>
      <span>${task.definition_of_done}</span>
    </div>
  `;

  modal.classList.add("show");

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

function openShutdown() {
  const modal = document.getElementById("shutdownModal");
  const doneList = document.getElementById("shutdownDone");
  const tomorrowSelect = document.getElementById("tomorrowSelect");
  const doneToday = appState.tasks.filter((task) =>
    task.status === "done" && task.completed_at && isSameDay(task.completed_at, new Date())
  );

  doneList.innerHTML = "";
  doneToday
    .filter((task) => isTaskVisible(task))
    .forEach((task) => doneList.appendChild(renderTaskCard(task)));

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
      <p class="muted">${getCategoryLabel(task)} · ${task.estimate_minutes} min</p>
    </div>
    <label>
      Category
      <select id="detailCategory">
        ${appState.categories
          .map(
            (category) =>
              `<option value="${category.id}" ${task.categoryId === category.id ? "selected" : ""}>
                ${category.name}
              </option>`
          )
          .join("")}
      </select>
    </label>
    <label>
      Next step (required)
      <textarea id="detailNext">${task.next_step || ""}</textarea>
    </label>
    <label>
      Definition of done (required)
      <textarea id="detailDone">${task.definition_of_done || ""}</textarea>
    </label>
    <label>
      Estimate (minutes)
      <div class="estimate-buttons">
        ${QUICK_ESTIMATES.map(
          (value) => `<button type="button" data-estimate="${value}">${value}</button>`
        ).join("")}
      </div>
      <input type="number" min="1" id="detailEstimate" value="${task.estimate_minutes}" />
    </label>
  `;

  body.querySelectorAll("[data-estimate]").forEach((button) => {
    button.addEventListener("click", () => {
      document.getElementById("detailEstimate").value = button.dataset.estimate;
    });
  });

  modal.classList.add("show");
  document.getElementById("detailStart").onclick = () => {
    const nextStep = document.getElementById("detailNext").value.trim();
    const done = document.getElementById("detailDone").value.trim();
    const estimate = Number(document.getElementById("detailEstimate").value);
    const categoryId = document.getElementById("detailCategory").value;
    if (!nextStep || !done) {
      alert("Next step and definition of done are required.");
      return;
    }
    task.next_step = nextStep;
    task.definition_of_done = done;
    task.estimate_minutes = estimate || task.estimate_minutes;
    task.categoryId = categoryId;
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
    categoryId: "cat-other",
    status: "inbox",
    due_date: null,
    preferred_day: null,
    estimate_minutes: 15,
    next_step: "",
    definition_of_done: "",
    checklist: [],
    created_at: new Date().toISOString(),
    completed_at: null,
    today_top3: false,
    today_quick: false,
  });
  input.value = "";
  saveState();
  renderInbox();
}

function addTodayQuickWin() {
  const input = document.getElementById("todayQuickInput");
  const value = input.value.trim();
  if (!value) {
    return;
  }
  if (getQuickWins().length >= MAX_QUICK_WINS) {
    alert("Quick wins list is full. Remove one first.");
    return;
  }
  appState.tasks.unshift({
    id: `task-${Date.now()}`,
    title: value,
    type: "task",
    categoryId: "cat-other",
    status: "planned",
    due_date: new Date().toISOString(),
    preferred_day: new Date().toISOString(),
    estimate_minutes: 10,
    next_step: "",
    definition_of_done: "",
    checklist: [],
    created_at: new Date().toISOString(),
    completed_at: null,
    today_top3: false,
    today_quick: true,
  });
  input.value = "";
  saveState();
  renderToday();
  renderWeek();
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
    appState = migrateState(data);
    saveState();
    initialize();
  };
  reader.readAsText(file);
}

function initializeTimer() {
  const display = document.getElementById("timerDisplay");
  const preset = document.getElementById("timerPreset");
  const startBtn = document.getElementById("timerStart");
  const pauseBtn = document.getElementById("timerPause");
  const resetBtn = document.getElementById("timerReset");
  timerLinkSelect = document.getElementById("timerLink");

  updateTimerDisplay();
  refreshTimerLinks();

  preset.addEventListener("change", () => {
    if (appState.timer.running) {
      return;
    }
    appState.timer.total = Number(preset.value) * 60;
    appState.timer.remaining = appState.timer.total;
    updateTimerDisplay();
    saveState();
  });

  startBtn.addEventListener("click", () => {
    if (appState.timer.running) {
      return;
    }
    appState.timer.running = true;
    startTimerInterval();
    saveState();
  });

  pauseBtn.addEventListener("click", () => {
    appState.timer.running = false;
    stopTimerInterval();
    saveState();
  });

  resetBtn.addEventListener("click", () => {
    appState.timer.running = false;
    stopTimerInterval();
    appState.timer.remaining = appState.timer.total;
    updateTimerDisplay();
    saveState();
  });

  timerLinkSelect.addEventListener("change", (event) => {
    appState.timer.linkedTaskId = event.target.value;
    saveState();
  });

  function updateTimerDisplay() {
    const minutes = Math.floor(appState.timer.remaining / 60);
    const seconds = appState.timer.remaining % 60;
    display.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  function startTimerInterval() {
    stopTimerInterval();
    timerInterval = setInterval(() => {
      if (!appState.timer.running) {
        return;
      }
      if (appState.timer.remaining <= 0) {
        appState.timer.running = false;
        stopTimerInterval();
        alert("Timer complete. Consider marking done or taking a break.");
        return;
      }
      appState.timer.remaining -= 1;
      updateTimerDisplay();
    }, 1000);
  }

  function stopTimerInterval() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  if (appState.timer.running) {
    startTimerInterval();
  }
}

let timerInterval = null;
let timerLinkSelect = null;

function refreshTimerLinks() {
  if (!timerLinkSelect) {
    return;
  }
  const current = timerLinkSelect.value;
  timerLinkSelect.innerHTML = "";
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "None";
  timerLinkSelect.appendChild(empty);
  appState.tasks
    .filter((task) => task.status !== "done")
    .forEach((task) => {
      const option = document.createElement("option");
      option.value = task.id;
      option.textContent = task.title;
      if (task.id === current || task.id === appState.timer.linkedTaskId) {
        option.selected = true;
      }
      timerLinkSelect.appendChild(option);
    });
}

function initialize() {
  setEnergyState(appState.energyState || "yellow");
  setWorkMode(appState.workMode || "all");
  renderToday();
  renderInbox();
  renderWeek();
  renderRoutines();
  renderHistory();
  renderSettings();
  initializeTimer();
}

initialize();

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "n") {
    setView("inbox");
    document.getElementById("inboxInput").focus();
  }
  if (event.key.toLowerCase() === "f") {
    const candidate = getTopThree()[0] || getQuickWins()[0];
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

// mode toggle

document.querySelectorAll("#modeToggle .chip").forEach((button) => {
  button.addEventListener("click", () => setWorkMode(button.dataset.mode));
});

// inbox

document.getElementById("inboxAddBtn").addEventListener("click", addInboxTask);
document.getElementById("inboxInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addInboxTask();
  }
});

// today quick add

document.getElementById("todayQuickAddBtn").addEventListener("click", addTodayQuickWin);
document.getElementById("todayQuickInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addTodayQuickWin();
  }
});

// focus modal

document.getElementById("startNowBtn").addEventListener("click", () => {
  const candidate = getTopThree()[0] || getQuickWins()[0];
  if (candidate) {
    openFocus(candidate.id);
  }
});

document.getElementById("focusClose").addEventListener("click", () => {
  document.getElementById("focusModal").classList.remove("show");
});

document.getElementById("focusPause").addEventListener("click", () => {
  document.getElementById("focusModal").classList.remove("show");
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

// routines

document.getElementById("resetRoutines").addEventListener("click", () => {
  appState.routines = structuredClone(seedRoutines);
  saveState();
  renderRoutines();
  renderToday();
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

document.getElementById("addCategoryBtn").addEventListener("click", () => {
  const nameInput = document.getElementById("newCategoryName");
  const modeSelect = document.getElementById("newCategoryMode");
  const name = nameInput.value.trim();
  if (!name) {
    return;
  }
  const id = `cat-${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
  appState.categories.push({ id, name, mode: modeSelect.value });
  nameInput.value = "";
  saveState();
  renderSettings();
  renderInbox();
});


document.getElementById("settingsExport").addEventListener("click", exportData);

document.getElementById("settingsImport").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    importData(file);
  }
});
