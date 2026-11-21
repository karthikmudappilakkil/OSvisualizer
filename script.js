/**
 * Operating Systems Algorithm Visualizer
 * Supporting:
 * 1. CPU Scheduling: Round Robin (Activity 1 & Activity 2 with Context Switching)
 * 2. CPU Scheduling: First-Come First-Served (FCFS)
 * 3. Disk Scheduling: Shortest Seek Time First (SSTF) & First-Come First-Served (FCFS)
 *
 * Plain Vanilla JavaScript Implementation
 */

// ============================================================================
// 1. DEFAULT DATASETS & CONFIGURATIONS
// ============================================================================

const ACTIVITY_CONFIGS = {
  1: {
    name: "Activity 1: Without Context Switching Overhead",
    scenario: "Smart Municipal Control Centre (Context Switching Overhead = 0 ms)",
    defaultOverhead: 0,
    showOverheadInput: false,
    defaultQuantum: 2,
    compQuantums: [2, 3],
    processes: [
      { id: "P1", task: "Water-quality monitoring", at: 0, bt: 5 },
      { id: "P2", task: "Waste-collection scheduling", at: 1, bt: 3 },
      { id: "P3", task: "Traffic-pollution analysis", at: 2, bt: 4 },
      { id: "P4", task: "Public energy-use monitoring", at: 3, bt: 2 }
    ]
  },
  2: {
    name: "Activity 2: With Context Switching Overhead",
    scenario: "Climate Emergency Response Centre (Context Switching Overhead = 1 ms)",
    defaultOverhead: 1,
    showOverheadInput: true,
    defaultQuantum: 2,
    compQuantums: [2, 4],
    processes: [
      { id: "P1", task: "Flood-warning analysis", at: 0, bt: 5 },
      { id: "P2", task: "Air-quality alert generation", at: 1, bt: 4 },
      { id: "P3", task: "Emergency evacuation-route update", at: 2, bt: 3 },
      { id: "P4", task: "Renewable-grid status monitoring", at: 3, bt: 2 }
    ]
  }
};

const DEFAULT_CPU_FCFS_PROCESSES = [
  { id: "P1", task: "Water-quality monitoring", at: 0, bt: 5 },
  { id: "P2", task: "Waste-collection scheduling", at: 1, bt: 3 },
  { id: "P3", task: "Traffic-pollution analysis", at: 2, bt: 4 },
  { id: "P4", task: "Public energy-use monitoring", at: 3, bt: 2 }
];

const DEFAULT_DISK_CONFIG = {
  initialHead: 53,
  maxTrack: 199,
  requests: [98, 183, 37, 122, 14, 124, 65, 67]
};

const PROCESS_COLORS = {
  P1: "#2563eb", // Blue
  P2: "#059669", // Green
  P3: "#d97706", // Amber
  P4: "#7c3aed", // Purple
  P5: "#0891b2", // Cyan
  P6: "#be185d", // Pink
  P7: "#4f46e5", // Indigo
  P8: "#ca8a04", // Yellow
  CS: "#dc2626", // Red for Context Switch
  IDLE: "#6b7280" // Gray for Idle
};

function getProcessColor(pid) {
  if (PROCESS_COLORS[pid]) return PROCESS_COLORS[pid];
  let hash = 0;
  for (let i = 0; i < pid.length; i++) {
    hash = pid.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 45%)`;
}

function round(val, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

// Current active states
let currentModule = "RR"; // "RR" | "CPUFCFS" | "DISK"
let currentActivity = 1;

// ============================================================================
// 2. CPU SCHEDULING ALGORITHMS
// ============================================================================

/**
 * Executes Round Robin scheduling with optional context switching overhead.
 */
function scheduleRoundRobin(processList, quantum, csOverhead = 0) {
  const processes = processList.map((p, idx) => ({
    id: String(p.id).trim(),
    task: String(p.task).trim(),
    at: Number(p.at),
    bt: Number(p.bt),
    remaining: Number(p.bt),
    initialIndex: idx,
    ct: 0,
    tat: 0,
    wt: 0,
    rt: -1,
    firstStart: -1
  }));

  const incoming = [...processes].sort((a, b) => {
    if (a.at !== b.at) return a.at - b.at;
    return a.initialIndex - b.initialIndex;
  });

  const readyQueue = [];
  const slices = [];
  let currentTime = 0;
  let lastRunningPid = null;
  let contextSwitches = 0;

  function enqueueArrivals(targetTime) {
    while (incoming.length > 0 && incoming[0].at <= targetTime) {
      readyQueue.push(incoming.shift());
    }
  }

  if (incoming.length > 0 && incoming[0].at > currentTime) {
    slices.push({
      pid: "IDLE",
      task: "CPU Idle",
      start: currentTime,
      end: incoming[0].at,
      type: "IDLE"
    });
    currentTime = incoming[0].at;
  }
  enqueueArrivals(currentTime);

  while (readyQueue.length > 0 || incoming.length > 0) {
    if (readyQueue.length === 0) {
      const nextProc = incoming[0];
      slices.push({
        pid: "IDLE",
        task: "CPU Idle",
        start: currentTime,
        end: nextProc.at,
        type: "IDLE"
      });
      currentTime = nextProc.at;
      enqueueArrivals(currentTime);
      lastRunningPid = null;
      continue;
    }

    const current = readyQueue.shift();

    if (lastRunningPid !== null && lastRunningPid !== current.id) {
      contextSwitches++;
      if (csOverhead > 0) {
        const csStart = currentTime;
        currentTime += csOverhead;
        slices.push({
          pid: "CS",
          task: "Context Switch Overhead",
          start: csStart,
          end: currentTime,
          type: "CS"
        });
        enqueueArrivals(currentTime);
      }
    }

    lastRunningPid = current.id;

    if (current.firstStart === -1) {
      current.firstStart = currentTime;
      current.rt = currentTime - current.at;
    }

    const execDuration = Math.min(quantum, current.remaining);
    const start = currentTime;
    currentTime += execDuration;
    current.remaining -= execDuration;

    slices.push({
      pid: current.id,
      task: current.task,
      start: start,
      end: currentTime,
      type: "PROCESS"
    });

    enqueueArrivals(currentTime);

    if (current.remaining > 0) {
      readyQueue.push(current);
    } else {
      current.ct = currentTime;
      current.tat = current.ct - current.at;
      current.wt = current.tat - current.bt;
    }
  }

  const orderedProcesses = processes.map(p => {
    return processes.find(orig => orig.id === p.id);
  });

  const n = orderedProcesses.length;
  const avgTAT = n > 0 ? orderedProcesses.reduce((s, p) => s + p.tat, 0) / n : 0;
  const avgWT = n > 0 ? orderedProcesses.reduce((s, p) => s + p.wt, 0) / n : 0;
  const avgRT = n > 0 ? orderedProcesses.reduce((s, p) => s + p.rt, 0) / n : 0;

  const totalCSOverhead = contextSwitches * csOverhead;
  const totalUsefulBT = orderedProcesses.reduce((s, p) => s + p.bt, 0);
  const cpuEfficiency = currentTime > 0 ? (totalUsefulBT / currentTime) * 100 : 0;

  return {
    processes: orderedProcesses,
    slices,
    avgTAT: round(avgTAT, 2),
    avgWT: round(avgWT, 2),
    avgRT: round(avgRT, 2),
    contextSwitches,
    totalCSOverhead,
    cpuEfficiency: round(cpuEfficiency, 2),
    totalTime: currentTime
  };
}

/**
 * Executes First-Come First-Served (FCFS) CPU Scheduling.
 */
function scheduleCPUFCFS(processList) {
  const processes = processList.map((p, idx) => ({
    id: String(p.id).trim(),
    task: String(p.task).trim(),
    at: Number(p.at),
    bt: Number(p.bt),
    initialIndex: idx,
    ct: 0,
    tat: 0,
    wt: 0,
    rt: -1,
    start: -1
  }));

  // Sort by Arrival Time; break ties by initial index
  const sorted = [...processes].sort((a, b) => {
    if (a.at !== b.at) return a.at - b.at;
    return a.initialIndex - b.initialIndex;
  });

  const slices = [];
  let currentTime = 0;

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];

    if (current.at > currentTime) {
      slices.push({
        pid: "IDLE",
        task: "CPU Idle",
        start: currentTime,
        end: current.at,
        type: "IDLE"
      });
      currentTime = current.at;
    }

    const start = currentTime;
    currentTime += current.bt;

    current.start = start;
    current.ct = currentTime;
    current.tat = current.ct - current.at;
    current.wt = current.tat - current.bt;
    current.rt = start - current.at;

    slices.push({
      pid: current.id,
      task: current.task,
      start: start,
      end: currentTime,
      type: "PROCESS"
    });
  }

  // Restore input order for display in process table
  const orderedProcesses = processes.map(orig => {
    return sorted.find(p => p.id === orig.id);
  });

  const n = orderedProcesses.length;
  const avgTAT = n > 0 ? orderedProcesses.reduce((s, p) => s + p.tat, 0) / n : 0;
  const avgWT = n > 0 ? orderedProcesses.reduce((s, p) => s + p.wt, 0) / n : 0;
  const avgRT = n > 0 ? orderedProcesses.reduce((s, p) => s + p.rt, 0) / n : 0;

  const totalUsefulBT = orderedProcesses.reduce((s, p) => s + p.bt, 0);
  const cpuEfficiency = currentTime > 0 ? (totalUsefulBT / currentTime) * 100 : 0;

  return {
    processes: orderedProcesses,
    slices,
    avgTAT: round(avgTAT, 2),
    avgWT: round(avgWT, 2),
    avgRT: round(avgRT, 2),
    contextSwitches: Math.max(0, processes.length - 1),
    totalCSOverhead: 0,
    cpuEfficiency: round(cpuEfficiency, 2),
    totalTime: currentTime
  };
}

// ============================================================================
// 3. DISK SCHEDULING ALGORITHMS (SSTF & FCFS)
// ============================================================================

/**
 * FCFS Disk Scheduling:
 * Services I/O requests strictly in the order they arrived.
 */
function scheduleDiskFCFS(initialHead, requests) {
  let currentHead = initialHead;
  let totalSeek = 0;
  const sequence = [initialHead];
  const steps = [];

  for (let i = 0; i < requests.length; i++) {
    const to = requests[i];
    const seek = Math.abs(to - currentHead);
    totalSeek += seek;
    steps.push({
      step: i + 1,
      from: currentHead,
      to: to,
      seek: seek,
      cumulative: totalSeek
    });
    sequence.push(to);
    currentHead = to;
  }

  const avgSeek = requests.length > 0 ? totalSeek / requests.length : 0;

  return {
    algo: "FCFS",
    name: "First-Come First-Served (FCFS)",
    initialHead,
    requests: [...requests],
    sequence,
    steps,
    totalSeek,
    avgSeek: round(avgSeek, 2)
  };
}

/**
 * SSTF Disk Scheduling:
 * Services request with the shortest seek time from current head position.
 */
function scheduleDiskSSTF(initialHead, requests) {
  let currentHead = initialHead;
  let totalSeek = 0;
  const sequence = [initialHead];
  const steps = [];
  const remaining = requests.map((track, idx) => ({ track, originalIndex: idx }));

  let stepNum = 1;
  while (remaining.length > 0) {
    let bestIdx = 0;
    let minDistance = Math.abs(remaining[0].track - currentHead);

    for (let i = 1; i < remaining.length; i++) {
      const dist = Math.abs(remaining[i].track - currentHead);
      if (dist < minDistance) {
        minDistance = dist;
        bestIdx = i;
      } else if (dist === minDistance) {
        // Tie-breaker: pick smaller track number or earlier queue arrival
        if (remaining[i].track < remaining[bestIdx].track) {
          bestIdx = i;
        }
      }
    }

    const chosen = remaining.splice(bestIdx, 1)[0];
    const to = chosen.track;
    const seek = minDistance;
    totalSeek += seek;

    steps.push({
      step: stepNum++,
      from: currentHead,
      to: to,
      seek: seek,
      cumulative: totalSeek
    });

    sequence.push(to);
    currentHead = to;
  }

  const avgSeek = requests.length > 0 ? totalSeek / requests.length : 0;

  return {
    algo: "SSTF",
    name: "Shortest Seek Time First (SSTF)",
    initialHead,
    requests: [...requests],
    sequence,
    steps,
    totalSeek,
    avgSeek: round(avgSeek, 2)
  };
}

// ============================================================================
// 4. RENDERING FUNCTIONS: GANTT CHART & COMMON TABLES
// ============================================================================

function renderGanttChart(containerId, slices, totalTime) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  if (!slices || slices.length === 0) return;

  const maxTime = totalTime || slices[slices.length - 1].end;
  if (maxTime <= 0) return;

  const barsContainer = document.createElement("div");
  barsContainer.className = "gantt-bars";

  const timelineContainer = document.createElement("div");
  timelineContainer.className = "gantt-timeline";

  const timestamps = new Set([0]);

  slices.forEach(slice => {
    const duration = slice.end - slice.start;
    const widthPct = (duration / maxTime) * 100;

    const bar = document.createElement("div");
    bar.className = "gantt-bar";
    bar.style.width = `${widthPct}%`;

    if (slice.type === "CS") {
      bar.classList.add("cs-bar");
      bar.textContent = "CS";
      bar.title = `Context Switch: ${slice.start} ms - ${slice.end} ms (${duration} ms)`;
    } else if (slice.type === "IDLE") {
      bar.classList.add("idle-bar");
      bar.textContent = "IDLE";
      bar.title = `CPU Idle: ${slice.start} ms - ${slice.end} ms (${duration} ms)`;
    } else {
      bar.style.backgroundColor = getProcessColor(slice.pid);
      bar.textContent = slice.pid;
      bar.title = `${slice.pid} (${slice.task}): ${slice.start} ms - ${slice.end} ms (${duration} ms)`;
    }

    barsContainer.appendChild(bar);
    timestamps.add(slice.start);
    timestamps.add(slice.end);
  });

  const sortedTimes = Array.from(timestamps).sort((a, b) => a - b);
  sortedTimes.forEach(t => {
    const leftPct = (t / maxTime) * 100;
    const mark = document.createElement("div");
    mark.className = "gantt-mark";
    mark.style.left = `${leftPct}%`;
    mark.textContent = t;
    timelineContainer.appendChild(mark);
  });

  container.appendChild(barsContainer);
  container.appendChild(timelineContainer);
}

function renderLegend(containerId, processes, hasOverhead = false) {
  const legend = document.getElementById(containerId);
  legend.innerHTML = "";

  processes.forEach(p => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `
      <span class="legend-swatch" style="background-color: ${getProcessColor(p.id)};"></span>
      <span><strong>${p.id}:</strong> ${p.task}</span>
    `;
    legend.appendChild(item);
  });

  if (hasOverhead) {
    const csItem = document.createElement("div");
    csItem.className = "legend-item";
    csItem.innerHTML = `
      <span class="legend-swatch" style="background-color: ${PROCESS_COLORS.CS};"></span>
      <span><strong>CS:</strong> Context Switch</span>
    `;
    legend.appendChild(csItem);
  }
}

function renderSummaryMetrics(containerId, results, showEfficiency = true) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  const metrics = [
    { label: "Average Turnaround Time (TAT)", value: results.avgTAT, unit: "ms" },
    { label: "Average Waiting Time (WT)", value: results.avgWT, unit: "ms" },
    { label: "Average Response Time (RT)", value: results.avgRT, unit: "ms" },
    { label: "Total Execution Time", value: results.totalTime, unit: "ms" }
  ];

  if (results.contextSwitches !== undefined && results.totalCSOverhead !== undefined && results.totalCSOverhead > 0) {
    metrics.push(
      { label: "Context Switches", value: results.contextSwitches, unit: "" },
      { label: "CS Overhead", value: results.totalCSOverhead, unit: "ms" }
    );
  }

  if (showEfficiency) {
    metrics.push({
      label: "CPU Efficiency",
      value: `${results.cpuEfficiency}%`,
      unit: ""
    });
  }

  metrics.forEach(m => {
    const box = document.createElement("div");
    box.className = "metric-box";
    box.innerHTML = `
      <div class="metric-label">${m.label}</div>
      <div class="metric-value">${m.value}<span class="metric-unit">${m.unit}</span></div>
    `;
    container.appendChild(box);
  });
}

function renderProcessResultsTable(tbodyId, processes) {
  const tbody = document.getElementById(tbodyId);
  tbody.innerHTML = "";

  processes.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${p.id}</strong></td>
      <td>${p.task}</td>
      <td>${p.at} ms</td>
      <td>${p.bt} ms</td>
      <td><strong>${p.ct} ms</strong></td>
      <td>${p.tat} ms</td>
      <td>${p.wt} ms</td>
      <td>${p.rt} ms</td>
    `;
    tbody.appendChild(tr);
  });
}

// ============================================================================
// 5. RENDERING FUNCTIONS: DISK TRAJECTORY SVG & TABLES
// ============================================================================

/**
 * Renders an SVG disk head movement trajectory diagram.
 * Standard format matching Operating System Concepts (Silberschatz / Galvin).
 */
function renderDiskSvg(containerId, result, maxTrack, themeColor = "#2563eb") {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  const sequence = result.sequence;
  const n = sequence.length;
  if (n === 0) return;

  const width = 760;
  const stepHeight = 36;
  const marginTop = 50;
  const marginBottom = 30;
  const marginLeft = 55;
  const marginRight = 55;
  const height = marginTop + (n - 1) * stepHeight + marginBottom;
  const plotWidth = width - marginLeft - marginRight;

  function trackToX(track) {
    return marginLeft + (track / maxTrack) * plotWidth;
  }

  function stepToY(stepIndex) {
    return marginTop + stepIndex * stepHeight;
  }

  // Build SVG XML
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("class", "disk-svg");

  // Define defs / markers
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.15"/>
    </filter>
  `;
  svg.appendChild(defs);

  // Background cylinder grid lines (at intervals of 20 or 40, plus 0 and maxTrack)
  const gridTicks = new Set([0, maxTrack]);
  const interval = maxTrack <= 100 ? 10 : (maxTrack <= 200 ? 20 : 50);
  for (let t = 0; t <= maxTrack; t += interval) {
    gridTicks.add(t);
  }
  // Also include initial head
  gridTicks.add(result.initialHead);

  const sortedTicks = Array.from(gridTicks).sort((a, b) => a - b);

  // Top Axis Line
  const axisLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  axisLine.setAttribute("x1", marginLeft);
  axisLine.setAttribute("y1", marginTop - 15);
  axisLine.setAttribute("x2", width - marginRight);
  axisLine.setAttribute("y2", marginTop - 15);
  axisLine.setAttribute("stroke", "#9ca3af");
  axisLine.setAttribute("stroke-width", "1.5");
  svg.appendChild(axisLine);

  sortedTicks.forEach(t => {
    const x = trackToX(t);

    // Tick Mark
    const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
    tick.setAttribute("x1", x);
    tick.setAttribute("y1", marginTop - 20);
    tick.setAttribute("x2", x);
    tick.setAttribute("y2", marginTop - 15);
    tick.setAttribute("stroke", "#6b7280");
    tick.setAttribute("stroke-width", "1.2");
    svg.appendChild(tick);

    // Grid vertical dashed line
    const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    gridLine.setAttribute("x1", x);
    gridLine.setAttribute("y1", marginTop - 15);
    gridLine.setAttribute("x2", x);
    gridLine.setAttribute("y2", height - marginBottom);
    gridLine.setAttribute("stroke", t === result.initialHead ? "#bfdbfe" : "#f1f5f9");
    gridLine.setAttribute("stroke-width", t === result.initialHead ? "1.5" : "1");
    if (t !== result.initialHead) {
      gridLine.setAttribute("stroke-dasharray", "3,3");
    }
    svg.appendChild(gridLine);

    // Tick Label
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x);
    text.setAttribute("y", marginTop - 25);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "11");
    text.setAttribute("font-family", "ui-monospace, Menlo, monospace");
    text.setAttribute("fill", t === result.initialHead ? "#1e40af" : "#4b5563");
    text.setAttribute("font-weight", t === result.initialHead || t === 0 || t === maxTrack ? "bold" : "normal");
    text.textContent = t;
    svg.appendChild(text);
  });

  // Polyline for Trajectory Path
  const pointsStr = sequence
    .map((track, idx) => `${trackToX(track)},${stepToY(idx)}`)
    .join(" ");

  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  polyline.setAttribute("points", pointsStr);
  polyline.setAttribute("fill", "none");
  polyline.setAttribute("stroke", themeColor);
  polyline.setAttribute("stroke-width", "2.8");
  polyline.setAttribute("stroke-linejoin", "round");
  polyline.setAttribute("stroke-linecap", "round");
  polyline.setAttribute("filter", "url(#shadow)");
  svg.appendChild(polyline);

  // Dots and labels for each step
  sequence.forEach((track, idx) => {
    const cx = trackToX(track);
    const cy = stepToY(idx);
    const isStart = idx === 0;

    // Step index indicator on the left margin
    const stepLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    stepLabel.setAttribute("x", marginLeft - 12);
    stepLabel.setAttribute("y", cy + 4);
    stepLabel.setAttribute("text-anchor", "end");
    stepLabel.setAttribute("font-size", "11");
    stepLabel.setAttribute("font-family", "ui-monospace, monospace");
    stepLabel.setAttribute("fill", "#6b7280");
    stepLabel.textContent = isStart ? "Start" : `S${idx}`;
    svg.appendChild(stepLabel);

    // Outer circle
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", cx);
    circle.setAttribute("cy", cy);
    circle.setAttribute("r", isStart ? "6" : "5");
    circle.setAttribute("fill", isStart ? "#10b981" : themeColor);
    circle.setAttribute("stroke", "#ffffff");
    circle.setAttribute("stroke-width", "2");
    svg.appendChild(circle);

    // Track Value Label
    const valLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    valLabel.setAttribute("y", cy + 4);
    valLabel.setAttribute("font-size", "11");
    valLabel.setAttribute("font-family", "ui-monospace, monospace");
    valLabel.setAttribute("font-weight", "600");

    let seekInfo = "";
    if (!isStart) {
      const stepData = result.steps[idx - 1];
      seekInfo = ` (seek: ${stepData.seek})`;
    }

    // Place text intelligently to left or right of node depending on position
    if (cx > width - marginRight - 80) {
      valLabel.setAttribute("x", cx - 10);
      valLabel.setAttribute("text-anchor", "end");
    } else {
      valLabel.setAttribute("x", cx + 10);
      valLabel.setAttribute("text-anchor", "start");
    }

    valLabel.setAttribute("fill", isStart ? "#047857" : "#111827");
    valLabel.textContent = `${track}${seekInfo}`;
    svg.appendChild(valLabel);
  });

  container.appendChild(svg);
}

function renderDiskStepsTable(tbodyId, steps) {
  const tbody = document.getElementById(tbodyId);
  tbody.innerHTML = "";

  steps.forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>Step ${s.step}</strong></td>
      <td>${s.from}</td>
      <td><strong>${s.to}</strong></td>
      <td>${s.seek} tracks</td>
      <td>${s.cumulative} tracks</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderDiskMetrics(containerId, result) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  const metrics = [
    { label: "Total Head Movements", value: result.totalSeek, unit: "cylinders" },
    { label: "Average Seek Distance", value: result.avgSeek, unit: "cylinders / req" },
    { label: "Initial Head Position", value: result.initialHead, unit: "" },
    { label: "Total Requests Serviced", value: result.requests.length, unit: "requests" }
  ];

  metrics.forEach(m => {
    const box = document.createElement("div");
    box.className = "metric-box";
    box.innerHTML = `
      <div class="metric-label">${m.label}</div>
      <div class="metric-value">${m.value}<span class="metric-unit">${m.unit}</span></div>
    `;
    container.appendChild(box);
  });
}

// ============================================================================
// 6. MODULE & INPUT MANAGEMENT
// ============================================================================

function switchModule(modName) {
  currentModule = modName;

  document.getElementById("btnNavRR").classList.toggle("active", modName === "RR");
  document.getElementById("btnNavCPUFCFS").classList.toggle("active", modName === "CPUFCFS");
  document.getElementById("btnNavDisk").classList.toggle("active", modName === "DISK");

  document.getElementById("sectionRR").style.display = modName === "RR" ? "block" : "none";
  document.getElementById("sectionCPUFCFS").style.display = modName === "CPUFCFS" ? "block" : "none";
  document.getElementById("sectionDisk").style.display = modName === "DISK" ? "block" : "none";
}

function showModuleError(alertId, msg) {
  const el = document.getElementById(alertId);
  el.textContent = msg;
  el.style.display = "block";
}

function clearModuleError(alertId) {
  const el = document.getElementById(alertId);
  el.textContent = "";
  el.style.display = "none";
}

// ----------------------------------------------------------------------------
// Module 1: Round Robin Handlers
// ----------------------------------------------------------------------------

function populateRRInputTable(processList) {
  const tbody = document.getElementById("inputTableBody");
  tbody.innerHTML = "";

  processList.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${p.id}</strong></td>
      <td>${p.task}</td>
      <td>
        <input type="number" class="table-input at-input" data-id="${p.id}" min="0" step="1" value="${p.at}" aria-label="Arrival Time for ${p.id}">
      </td>
      <td>
        <input type="number" class="table-input bt-input" data-id="${p.id}" min="1" step="1" value="${p.bt}" aria-label="Burst Time for ${p.id}">
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function readRRInputs() {
  clearModuleError("errorAlertRR");
  const rows = document.querySelectorAll("#inputTableBody tr");
  const procs = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const pid = row.cells[0].textContent.trim();
    const task = row.cells[1].textContent.trim();
    const atInput = row.querySelector(".at-input");
    const btInput = row.querySelector(".bt-input");

    const at = parseFloat(atInput.value);
    const bt = parseFloat(btInput.value);

    if (isNaN(at) || at < 0) {
      showModuleError("errorAlertRR", `Validation Error: Process ${pid} Arrival Time must be a non-negative integer (>= 0).`);
      atInput.focus();
      return null;
    }

    if (isNaN(bt) || bt <= 0) {
      showModuleError("errorAlertRR", `Validation Error: Process ${pid} Burst Time must be strictly greater than 0.`);
      btInput.focus();
      return null;
    }

    procs.push({ id: pid, task, at, bt });
  }

  const qInput = document.getElementById("quantumInput");
  const quantum = parseFloat(qInput.value);
  if (isNaN(quantum) || quantum <= 0) {
    showModuleError("errorAlertRR", "Validation Error: Time Quantum must be strictly greater than 0.");
    qInput.focus();
    return null;
  }

  let overhead = 0;
  if (currentActivity === 2) {
    const ohInput = document.getElementById("overheadInput");
    overhead = parseFloat(ohInput.value);
    if (isNaN(overhead) || overhead < 0) {
      showModuleError("errorAlertRR", "Validation Error: Context Switching Overhead must be a non-negative number (>= 0).");
      ohInput.focus();
      return null;
    }
  }

  return { procs, quantum, overhead };
}

function switchActivity(actNum) {
  currentActivity = actNum;
  const config = ACTIVITY_CONFIGS[actNum];

  document.getElementById("tabAct1").classList.toggle("active", actNum === 1);
  document.getElementById("tabAct2").classList.toggle("active", actNum === 2);

  document.getElementById("scenarioText").textContent = config.scenario;
  document.getElementById("overheadGroup").style.display = config.showOverheadInput ? "flex" : "none";
  document.getElementById("overheadInput").value = config.defaultOverhead;
  document.getElementById("quantumInput").value = config.defaultQuantum;

  populateRRInputTable(config.processes);
  document.getElementById("resultsSection").style.display = "none";
  clearModuleError("errorAlertRR");
}

function handleRunRRSimulation() {
  const inputs = readRRInputs();
  if (!inputs) return;

  const { procs, quantum, overhead } = inputs;
  const results = scheduleRoundRobin(procs, quantum, overhead);

  document.getElementById("resultsSection").style.display = "block";
  document.getElementById("singleSimulationView").style.display = "block";
  document.getElementById("comparisonView").style.display = "none";

  document.getElementById("singleGanttHeading").textContent = `Gantt Chart (Time Quantum = ${quantum} ms, Overhead = ${overhead} ms)`;
  renderLegend("singleLegend", results.processes, overhead > 0);
  renderGanttChart("singleGanttChart", results.slices, results.totalTime);

  renderSummaryMetrics("summaryMetricsContainer", results, currentActivity === 2);
  renderProcessResultsTable("resultsTableBody", results.processes);
}

function handleCompareRRQuantums() {
  const inputs = readRRInputs();
  if (!inputs) return;

  const { procs, overhead } = inputs;
  const config = ACTIVITY_CONFIGS[currentActivity];
  const [qA, qB] = config.compQuantums;

  const resA = scheduleRoundRobin(procs, qA, overhead);
  const resB = scheduleRoundRobin(procs, qB, overhead);

  document.getElementById("resultsSection").style.display = "block";
  document.getElementById("singleSimulationView").style.display = "none";
  document.getElementById("comparisonView").style.display = "block";

  const maxTime = Math.max(resA.totalTime, resB.totalTime);

  document.getElementById("labelCompA").textContent = `Time Quantum = ${qA} ms (Total Elapsed Time = ${resA.totalTime} ms)`;
  document.getElementById("labelCompB").textContent = `Time Quantum = ${qB} ms (Total Elapsed Time = ${resB.totalTime} ms)`;

  renderGanttChart("compGanttChartA", resA.slices, maxTime);
  renderGanttChart("compGanttChartB", resB.slices, maxTime);

  document.getElementById("thCompColA").textContent = `Time Quantum = ${qA} ms`;
  document.getElementById("thCompColB").textContent = `Time Quantum = ${qB} ms`;

  const tbody = document.getElementById("comparisonTableBody");
  tbody.innerHTML = "";

  const rows = [
    { label: "Time Quantum", valA: `${qA} ms`, valB: `${qB} ms` },
    { label: "Average Turnaround Time (TAT)", valA: `${resA.avgTAT} ms`, valB: `${resB.avgTAT} ms` },
    { label: "Average Waiting Time (WT)", valA: `${resA.avgWT} ms`, valB: `${resB.avgWT} ms` },
    { label: "Average Response Time (RT)", valA: `${resA.avgRT} ms`, valB: `${resB.avgRT} ms` },
    { label: "Total Context Switches", valA: `${resA.contextSwitches}`, valB: `${resB.contextSwitches}` },
    { label: "Total Context Switching Overhead", valA: `${resA.totalCSOverhead} ms`, valB: `${resB.totalCSOverhead} ms` }
  ];

  if (currentActivity === 2) {
    rows.push({
      label: "CPU Efficiency",
      valA: `${resA.cpuEfficiency}%`,
      valB: `${resB.cpuEfficiency}%`
    });
  }

  rows.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${r.label}</strong></td>
      <td>${r.valA}</td>
      <td>${r.valB}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ----------------------------------------------------------------------------
// Module 2: CPU FCFS Handlers
// ----------------------------------------------------------------------------

function populateCPUFCFSInputTable(processList) {
  const tbody = document.getElementById("fcfsInputTableBody");
  tbody.innerHTML = "";

  processList.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${p.id}</strong></td>
      <td><input type="text" class="table-input task-input" value="${p.task}" style="min-width: 160px;"></td>
      <td>
        <input type="number" class="table-input at-input" min="0" step="1" value="${p.at}">
      </td>
      <td>
        <input type="number" class="table-input bt-input" min="1" step="1" value="${p.bt}">
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function readCPUFCFSInputs() {
  clearModuleError("errorAlertCPUFCFS");
  const rows = document.querySelectorAll("#fcfsInputTableBody tr");
  const procs = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const pid = row.cells[0].textContent.trim();
    const taskInput = row.querySelector(".task-input");
    const atInput = row.querySelector(".at-input");
    const btInput = row.querySelector(".bt-input");

    const task = taskInput.value.trim() || `Process ${pid}`;
    const at = parseFloat(atInput.value);
    const bt = parseFloat(btInput.value);

    if (isNaN(at) || at < 0) {
      showModuleError("errorAlertCPUFCFS", `Validation Error: Process ${pid} Arrival Time must be a non-negative number (>= 0).`);
      atInput.focus();
      return null;
    }

    if (isNaN(bt) || bt <= 0) {
      showModuleError("errorAlertCPUFCFS", `Validation Error: Process ${pid} Burst Time must be strictly greater than 0.`);
      btInput.focus();
      return null;
    }

    procs.push({ id: pid, task, at, bt });
  }

  if (procs.length === 0) {
    showModuleError("errorAlertCPUFCFS", "Validation Error: Please configure at least one process.");
    return null;
  }

  return procs;
}

function handleRunCPUFCFS() {
  const procs = readCPUFCFSInputs();
  if (!procs) return;

  const results = scheduleCPUFCFS(procs);

  document.getElementById("fcfsResultsSection").style.display = "block";
  renderLegend("fcfsLegend", results.processes, false);
  renderGanttChart("fcfsGanttChart", results.slices, results.totalTime);
  renderSummaryMetrics("fcfsSummaryMetricsContainer", results, true);
  renderProcessResultsTable("fcfsResultsTableBody", results.processes);
}

function handleAddCPUFCFSRow() {
  const tbody = document.getElementById("fcfsInputTableBody");
  const nextIdx = tbody.children.length + 1;
  const newPid = `P${nextIdx}`;

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><strong>${newPid}</strong></td>
    <td><input type="text" class="table-input task-input" value="Task ${nextIdx}" style="min-width: 160px;"></td>
    <td><input type="number" class="table-input at-input" min="0" step="1" value="${nextIdx - 1}"></td>
    <td><input type="number" class="table-input bt-input" min="1" step="1" value="3"></td>
  `;
  tbody.appendChild(tr);
}

// ----------------------------------------------------------------------------
// Module 3: Disk Scheduling (SSTF & FCFS) Handlers
// ----------------------------------------------------------------------------

function readDiskInputs() {
  clearModuleError("errorAlertDisk");

  const queueStr = document.getElementById("diskQueueInput").value.trim();
  const headVal = parseInt(document.getElementById("diskHeadInput").value, 10);
  const maxTrackVal = parseInt(document.getElementById("diskMaxTrackInput").value, 10);

  if (isNaN(maxTrackVal) || maxTrackVal <= 0) {
    showModuleError("errorAlertDisk", "Validation Error: Max Cylinder track must be a positive integer greater than 0.");
    document.getElementById("diskMaxTrackInput").focus();
    return null;
  }

  if (isNaN(headVal) || headVal < 0 || headVal > maxTrackVal) {
    showModuleError("errorAlertDisk", `Validation Error: Initial Head Position must be between 0 and ${maxTrackVal}.`);
    document.getElementById("diskHeadInput").focus();
    return null;
  }

  if (!queueStr) {
    showModuleError("errorAlertDisk", "Validation Error: Please enter cylinder requests in the I/O Request Queue.");
    document.getElementById("diskQueueInput").focus();
    return null;
  }

  const rawTokens = queueStr.split(/[\s,]+/);
  const requests = [];

  for (let i = 0; i < rawTokens.length; i++) {
    const tok = rawTokens[i].trim();
    if (tok === "") continue;

    const track = parseInt(tok, 10);
    if (isNaN(track) || track < 0 || track > maxTrackVal) {
      showModuleError("errorAlertDisk", `Validation Error: Invalid track request "${tok}". Must be an integer between 0 and ${maxTrackVal}.`);
      document.getElementById("diskQueueInput").focus();
      return null;
    }
    requests.push(track);
  }

  if (requests.length === 0) {
    showModuleError("errorAlertDisk", "Validation Error: No valid track requests found in input.");
    return null;
  }

  return { initialHead: headVal, maxTrack: maxTrackVal, requests };
}

function handleRunDiskSingle(algorithm) {
  const inputs = readDiskInputs();
  if (!inputs) return;

  const { initialHead, maxTrack, requests } = inputs;
  const result = algorithm === "SSTF"
    ? scheduleDiskSSTF(initialHead, requests)
    : scheduleDiskFCFS(initialHead, requests);

  document.getElementById("diskResultsSection").style.display = "block";
  document.getElementById("diskSingleView").style.display = "block";
  document.getElementById("diskComparisonView").style.display = "none";

  document.getElementById("diskChartHeading").textContent = `${result.name} Head Trajectory (Total Seek: ${result.totalSeek} cylinders)`;
  document.getElementById("diskMetricsHeading").textContent = `${result.name} Seek Performance Metrics`;

  // Seek sequence banner: 53 -> 65 (+12) -> 67 (+2) -> ...
  const seqText = result.sequence.map((track, idx) => {
    if (idx === 0) return `${track} (Start)`;
    const step = result.steps[idx - 1];
    return `${track} (+${step.seek})`;
  }).join(" → ");
  document.getElementById("diskSeekSequence").textContent = `Head Seek Path: ${seqText}`;

  renderDiskSvg("diskSvgContainer", result, maxTrack, algorithm === "SSTF" ? "#2563eb" : "#059669");
  renderDiskMetrics("diskMetricsContainer", result);
  renderDiskStepsTable("diskStepsTableBody", result.steps);
}

function handleCompareDisk() {
  const inputs = readDiskInputs();
  if (!inputs) return;

  const { initialHead, maxTrack, requests } = inputs;
  const resSSTF = scheduleDiskSSTF(initialHead, requests);
  const resFCFS = scheduleDiskFCFS(initialHead, requests);

  document.getElementById("diskResultsSection").style.display = "block";
  document.getElementById("diskSingleView").style.display = "none";
  document.getElementById("diskComparisonView").style.display = "block";

  // Comparison Metrics Cards
  const diffSeek = resFCFS.totalSeek - resSSTF.totalSeek;
  const pctSaved = resFCFS.totalSeek > 0 ? ((diffSeek / resFCFS.totalSeek) * 100) : 0;

  const compContainer = document.getElementById("diskCompMetricsContainer");
  compContainer.innerHTML = "";

  const compMetrics = [
    { label: "SSTF Total Seek", value: resSSTF.totalSeek, unit: "cylinders" },
    { label: "FCFS Total Seek", value: resFCFS.totalSeek, unit: "cylinders" },
    { label: "Seek Distance Saved by SSTF", value: `${diffSeek}`, unit: "cylinders" },
    { label: "Seek Reduction Advantage", value: `${round(pctSaved, 1)}%`, unit: "less movement" }
  ];

  compMetrics.forEach(m => {
    const box = document.createElement("div");
    box.className = "metric-box";
    box.innerHTML = `
      <div class="metric-label">${m.label}</div>
      <div class="metric-value">${m.value}<span class="metric-unit">${m.unit}</span></div>
    `;
    compContainer.appendChild(box);
  });

  // Render comparative SVG charts
  document.getElementById("diskCompLabelSSTF").textContent = `SSTF (Shortest Seek Time First) — Total Seek: ${resSSTF.totalSeek} cylinders`;
  document.getElementById("diskCompLabelFCFS").textContent = `FCFS (First-Come First-Served) — Total Seek: ${resFCFS.totalSeek} cylinders`;

  const sstfSeq = resSSTF.sequence.map((t, i) => i === 0 ? `${t} (Start)` : `${t} (+${resSSTF.steps[i - 1].seek})`).join(" → ");
  const fcfsSeq = resFCFS.sequence.map((t, i) => i === 0 ? `${t} (Start)` : `${t} (+${resFCFS.steps[i - 1].seek})`).join(" → ");

  document.getElementById("diskCompSeqSSTF").textContent = `SSTF Path: ${sstfSeq}`;
  document.getElementById("diskCompSeqFCFS").textContent = `FCFS Path: ${fcfsSeq}`;

  renderDiskSvg("diskCompSvgSSTF", resSSTF, maxTrack, "#2563eb");
  renderDiskSvg("diskCompSvgFCFS", resFCFS, maxTrack, "#059669");

  // Comparison Table
  const tbody = document.getElementById("diskCompTableBody");
  tbody.innerHTML = "";

  const rows = [
    {
      param: "Total Head Movements (Seek Count)",
      sstf: `${resSSTF.totalSeek} cylinders`,
      fcfs: `${resFCFS.totalSeek} cylinders`,
      advantage: diffSeek >= 0 ? `SSTF is ${round(diffSeek, 0)} cyls better (${round(pctSaved, 1)}% reduction)` : `FCFS is ${Math.abs(diffSeek)} cyls better`
    },
    {
      param: "Average Seek Length Per Request",
      sstf: `${resSSTF.avgSeek} cyls / req`,
      fcfs: `${resFCFS.avgSeek} cyls / req`,
      advantage: `SSTF averages ${round(resFCFS.avgSeek - resSSTF.avgSeek, 2)} cyls less per seek`
    },
    {
      param: "Cylinder Trajectory Pattern",
      sstf: "Localized nearest requests serviced first",
      fcfs: "Unordered arrival queue traversal",
      advantage: "SSTF minimizes wild arm oscillations"
    },
    {
      param: "Starvation Vulnerability",
      sstf: "Possible for requests far from current cluster",
      fcfs: "Strictly Fair (Zero starvation risk)",
      advantage: "FCFS guarantees arrival fairness"
    }
  ];

  rows.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${r.param}</strong></td>
      <td>${r.sstf}</td>
      <td>${r.fcfs}</td>
      <td><strong>${r.advantage}</strong></td>
    `;
    tbody.appendChild(tr);
  });
}

function handleGenerateRandomDiskQueue() {
  const maxTrack = parseInt(document.getElementById("diskMaxTrackInput").value, 10) || 199;
  const length = 8;
  const arr = [];
  for (let i = 0; i < length; i++) {
    arr.push(Math.floor(Math.random() * (maxTrack + 1)));
  }
  document.getElementById("diskQueueInput").value = arr.join(", ");
  clearModuleError("errorAlertDisk");
}

function handleLoadDefaultDiskConfig() {
  document.getElementById("diskHeadInput").value = DEFAULT_DISK_CONFIG.initialHead;
  document.getElementById("diskMaxTrackInput").value = DEFAULT_DISK_CONFIG.maxTrack;
  document.getElementById("diskQueueInput").value = DEFAULT_DISK_CONFIG.requests.join(", ");
  clearModuleError("errorAlertDisk");
}

// ============================================================================
// 7. INITIALIZATION
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Top-Level Module Navigation
  document.getElementById("btnNavRR").addEventListener("click", () => switchModule("RR"));
  document.getElementById("btnNavCPUFCFS").addEventListener("click", () => switchModule("CPUFCFS"));
  document.getElementById("btnNavDisk").addEventListener("click", () => switchModule("DISK"));

  // Module 1: Round Robin Listeners
  document.getElementById("tabAct1").addEventListener("click", () => switchActivity(1));
  document.getElementById("tabAct2").addEventListener("click", () => switchActivity(2));
  document.getElementById("loadDefaultBtn").addEventListener("click", () => {
    const config = ACTIVITY_CONFIGS[currentActivity];
    document.getElementById("quantumInput").value = config.defaultQuantum;
    document.getElementById("overheadInput").value = config.defaultOverhead;
    populateRRInputTable(config.processes);
    clearModuleError("errorAlertRR");
  });
  document.getElementById("runSimBtn").addEventListener("click", handleRunRRSimulation);
  document.getElementById("compareBtn").addEventListener("click", handleCompareRRQuantums);

  // Module 2: CPU FCFS Listeners
  document.getElementById("fcfsLoadDefaultBtn").addEventListener("click", () => {
    populateCPUFCFSInputTable(DEFAULT_CPU_FCFS_PROCESSES);
    clearModuleError("errorAlertCPUFCFS");
  });
  document.getElementById("fcfsAddRowBtn").addEventListener("click", handleAddCPUFCFSRow);
  document.getElementById("fcfsRunBtn").addEventListener("click", handleRunCPUFCFS);

  // Module 3: Disk Scheduling Listeners
  document.getElementById("diskDefaultBtn").addEventListener("click", handleLoadDefaultDiskConfig);
  document.getElementById("diskRandomBtn").addEventListener("click", handleGenerateRandomDiskQueue);
  document.getElementById("diskRunSSTFBtn").addEventListener("click", () => handleRunDiskSingle("SSTF"));
  document.getElementById("diskRunFCFSBtn").addEventListener("click", () => handleRunDiskSingle("FCFS"));
  document.getElementById("diskCompareBtn").addEventListener("click", handleCompareDisk);

  // Initial Population
  switchActivity(1);
  populateCPUFCFSInputTable(DEFAULT_CPU_FCFS_PROCESSES);
  handleLoadDefaultDiskConfig();
  switchModule("RR");
});
