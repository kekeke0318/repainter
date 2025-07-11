const imageLoader = document.getElementById("imageLoader");
const motif = document.getElementById("motif");
const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
const penColor = document.getElementById("penColor");
const penAlpha = document.getElementById("penAlpha");
const motifAlpha = document.getElementById("motifAlpha");
const penWidth = document.getElementById("penWidth");
const alphaValue = document.getElementById("alphaValue");
const motifAlphaValue = document.getElementById("motifAlphaValue");
const widthValue = document.getElementById("widthValue");
const stabilizeValue = document.getElementById("stabilizeValue");
const clearBtn = document.getElementById("clearBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const saveBtn = document.getElementById("saveBtn");
const antialiasToggle = document.getElementById("antialiasToggle");
const stabilizeRange = document.getElementById("stabilizeRange");
const centerBtn = document.getElementById("centerBtn");
const importJson = document.getElementById("importJson");
const exportJsonBtn = document.getElementById("exportJsonBtn");
const playBtn = document.getElementById("playBtn");
const playbackRange = document.getElementById("playbackRange");
const prevFrameBtn = document.getElementById("prevFrameBtn");
const nextFrameBtn = document.getElementById("nextFrameBtn");
const playUseCurrent = document.getElementById("playUseCurrent");
const gridSizeInput = document.getElementById("gridSize");
let GRID_SIZE = parseInt(gridSizeInput.value, 10);
const container = document.getElementById("canvasContainer");
let drawing = false;
let strokes = 0;
let scale = 1;
let panX = 0;
let panY = 0;
let panning = false;
let startPanX = 0;
let startPanY = 0;
let antialias = true;
let stabilizeAmount = 0;
let lastPos = null;

let history = [];
let historyIndex = -1;

let recordedStrokes = [];
let currentStroke = null;
let playbackStrokes = [];
let playTimer = null;
let lastCell = null;

function saveHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(canvas.toDataURL());
  historyIndex = history.length - 1;
}

function restoreHistory(index) {
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
  img.src = history[index];
}

function toCell(pos) {
  return {
    x: Math.floor(pos.x / GRID_SIZE),
    y: Math.floor(pos.y / GRID_SIZE),
  };
}

function cellToPos(cell) {
  return {
    x: cell.x * GRID_SIZE + GRID_SIZE / 2,
    y: cell.y * GRID_SIZE + GRID_SIZE / 2,
  };
}

function getStrokeColor() {
  const hex = penColor.value.replace("#", "");
  const alpha = Math.round(parseFloat(penAlpha.value) * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${hex}${alpha}`;
}

function drawStroke(stroke) {
  const cells = stroke.cells || stroke;
  if (!cells.length) return;
  if (playUseCurrent.checked) {
    ctx.strokeStyle = getStrokeColor();
    ctx.lineWidth = penWidth.value;
    ctx.imageSmoothingEnabled = antialias;
  } else {
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.imageSmoothingEnabled = stroke.antialias;
  }
  const pts = cells.map(cellToPos);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.stroke();
}

function renderFrame(n) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < n; i++) {
    drawStroke(playbackStrokes[i]);
  }
}

function setCanvasSize(width, height) {
  container.style.width = width + "px";
  container.style.height = height + "px";
  canvas.width = width;
  canvas.height = height;
}

function resizeCanvas() {
  if (motif.style.display === "block") {
    setCanvasSize(motif.clientWidth, motif.clientHeight);
  }
  updateTransform();
}

// initialize default canvas size
setCanvasSize(640, 480);
updateTransform();
saveHistory();
alphaValue.textContent = parseFloat(penAlpha.value).toFixed(2);
motifAlphaValue.textContent = parseFloat(motifAlpha.value).toFixed(2);
motif.style.opacity = motifAlpha.value;
widthValue.textContent = penWidth.value;
stabilizeValue.textContent = stabilizeRange.value;

imageLoader.addEventListener("change", function (e) {
  const reader = new FileReader();
  reader.onload = function (event) {
    motif.src = event.target.result;
    motif.style.display = "block";
    motif.onload = () => {
      resizeCanvas();
    };
  };
  reader.readAsDataURL(e.target.files[0]);
});

window.addEventListener("resize", resizeCanvas);

function updateTransform() {
  container.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

function getCanvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  };
}

canvas.addEventListener("pointerdown", (e) => {
  if (e.button === 0) {
    drawing = true;
    canvas.setPointerCapture(e.pointerId);
    ctx.strokeStyle = getStrokeColor();
    ctx.lineWidth = penWidth.value;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.imageSmoothingEnabled = antialias;
    ctx.beginPath();
    const pos = getCanvasCoords(e);
    let startPos = pos;
    if (!antialias) {
      startPos = { x: Math.round(pos.x) + 0.5, y: Math.round(pos.y) + 0.5 };
    }
    lastPos = startPos;
    ctx.moveTo(startPos.x, startPos.y);
    motif.style.visibility = "hidden";

    currentStroke = {
      cells: [],
      color: getStrokeColor(),
      width: parseFloat(penWidth.value),
      antialias,
    };
    const cell = toCell(startPos);
    currentStroke.cells.push(cell);
    lastCell = cell;
  }
});

container.addEventListener("pointerdown", (e) => {
  if (e.button === 1) {
    e.preventDefault();
    panning = true;
    container.setPointerCapture(e.pointerId);
    startPanX = e.clientX - panX;
    startPanY = e.clientY - panY;
  }
});

container.addEventListener("pointermove", (e) => {
  if (panning) {
    panX = e.clientX - startPanX;
    panY = e.clientY - startPanY;
    updateTransform();
  }
});

container.addEventListener("pointerup", (e) => {
  if (panning && e.button === 1) {
    panning = false;
    container.releasePointerCapture(e.pointerId);
  }
});

container.addEventListener("pointerleave", (e) => {
  if (panning) {
    panning = false;
    container.releasePointerCapture(e.pointerId);
  }
});

function handleWheel(e) {
  e.preventDefault();
  const zoomFactor = 1.1;
  const rect = container.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;
  const oldScale = scale;
  if (e.deltaY < 0) {
    scale *= zoomFactor;
  } else {
    scale /= zoomFactor;
  }
  scale = Math.min(Math.max(scale, 0.1), 10);
  panX = offsetX - (offsetX - panX) * (scale / oldScale);
  panY = offsetY - (offsetY - panY) * (scale / oldScale);
  updateTransform();
}

document.addEventListener("wheel", handleWheel, { passive: false });

canvas.addEventListener("pointermove", (e) => {
  if (!drawing) return;
  const pos = getCanvasCoords(e);
  let drawPos = pos;
  if (stabilizeAmount > 0 && lastPos) {
    lastPos = {
      x: lastPos.x * stabilizeAmount + pos.x * (1 - stabilizeAmount),
      y: lastPos.y * stabilizeAmount + pos.y * (1 - stabilizeAmount),
    };
    drawPos = lastPos;
  }
  const cell = toCell(pos);
  if (!lastCell || cell.x !== lastCell.x || cell.y !== lastCell.y) {
    currentStroke.cells.push(cell);
    lastCell = cell;
  }
  if (!antialias) {
    drawPos = {
      x: Math.round(drawPos.x) + 0.5,
      y: Math.round(drawPos.y) + 0.5,
    };
  }
  ctx.lineTo(drawPos.x, drawPos.y);
  ctx.stroke();
});

canvas.addEventListener("pointerup", (e) => {
  if (!drawing) return;
  drawing = false;
  canvas.releasePointerCapture(e.pointerId);
  strokes++;
  motif.style.visibility = "visible";
  saveHistory();

  if (currentStroke && currentStroke.cells.length) {
    recordedStrokes.push(currentStroke);
    playbackStrokes = recordedStrokes.slice();
    playbackRange.max = playbackStrokes.length;
    playbackRange.value = playbackRange.max;
  }
  currentStroke = null;
  lastCell = null;
});

canvas.addEventListener("pointerleave", () => {
  if (drawing) {
    drawing = false;
    motif.style.visibility = "visible";
    saveHistory();
    if (currentStroke && currentStroke.cells.length) {
      recordedStrokes.push(currentStroke);
      playbackStrokes = recordedStrokes.slice();
      playbackRange.max = playbackStrokes.length;
      playbackRange.value = playbackRange.max;
    }
    currentStroke = null;
    lastCell = null;
  }
});

clearBtn.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokes = 0;
  saveHistory();
  recordedStrokes = [];
  playbackStrokes = [];
  playbackRange.max = 0;
  playbackRange.value = 0;
});

undoBtn.addEventListener("click", () => {
  if (historyIndex > 0) {
    historyIndex--;
    restoreHistory(historyIndex);
  }
});

redoBtn.addEventListener("click", () => {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    restoreHistory(historyIndex);
  }
});

saveBtn.addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const exportCtx = exportCanvas.getContext("2d");
  if (motif.src) {
    exportCtx.drawImage(motif, 0, 0, canvas.width, canvas.height);
  }
  exportCtx.drawImage(canvas, 0, 0);
  const link = document.createElement("a");
  link.href = exportCanvas.toDataURL("image/png");
  link.download = "drawing.png";
  link.click();
});

antialiasToggle.addEventListener("change", (e) => {
  antialias = e.target.checked;
});

penAlpha.addEventListener("input", () => {
  alphaValue.textContent = parseFloat(penAlpha.value).toFixed(2);
});

motifAlpha.addEventListener("input", () => {
  motifAlphaValue.textContent = parseFloat(motifAlpha.value).toFixed(2);
  motif.style.opacity = motifAlpha.value;
});

penWidth.addEventListener("input", () => {
  widthValue.textContent = penWidth.value;
});

stabilizeRange.addEventListener("input", (e) => {
  stabilizeAmount = parseFloat(e.target.value);
  stabilizeValue.textContent = e.target.value;
});

gridSizeInput.addEventListener("change", (e) => {
  GRID_SIZE = parseInt(e.target.value, 10) || 1;
});

centerBtn.addEventListener("click", () => {
  const rect = container.getBoundingClientRect();
  panX += window.innerWidth / 2 - (rect.left + rect.width / 2);
  panY += window.innerHeight / 2 - (rect.top + rect.height / 2);
  updateTransform();
});

function startPlayback() {
  if (playTimer || !playbackStrokes.length) return;
  playBtn.textContent = "一時停止";
  playTimer = setInterval(() => {
    let val = parseInt(playbackRange.value);
    if (val >= playbackStrokes.length) {
      stopPlayback();
      return;
    }
    val++;
    playbackRange.value = val;
    renderFrame(val);
  }, 300);
}

function stopPlayback() {
  if (!playTimer) return;
  clearInterval(playTimer);
  playTimer = null;
  playBtn.textContent = "再生";
}

playBtn.addEventListener("click", () => {
  if (playTimer) {
    stopPlayback();
  } else {
    startPlayback();
  }
});

playbackRange.addEventListener("pointerdown", stopPlayback);
playbackRange.addEventListener("input", (e) => {
  renderFrame(parseInt(e.target.value, 10));
});

prevFrameBtn.addEventListener("click", () => {
  stopPlayback();
  playbackRange.value = Math.max(0, parseInt(playbackRange.value, 10) - 1);
  renderFrame(parseInt(playbackRange.value, 10));
});

nextFrameBtn.addEventListener("click", () => {
  stopPlayback();
  playbackRange.value = Math.min(
    playbackStrokes.length,
    parseInt(playbackRange.value, 10) + 1,
  );
  renderFrame(parseInt(playbackRange.value, 10));
});

exportJsonBtn.addEventListener("click", () => {
  const data = {
    gridSize: GRID_SIZE,
    width: canvas.width,
    height: canvas.height,
    strokes: recordedStrokes,
  };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "strokes.json";
  link.click();
  URL.revokeObjectURL(url);
});

importJson.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const data = JSON.parse(ev.target.result);
    if (data.gridSize) {
      GRID_SIZE = data.gridSize;
      gridSizeInput.value = GRID_SIZE;
    }
    if (data.width && data.height) {
      setCanvasSize(data.width, data.height);
      updateTransform();
    }
    playbackStrokes = data.strokes || [];
    playbackRange.max = playbackStrokes.length;
    playbackRange.value = 0;
    renderFrame(0);
  };
  reader.readAsText(file);
});

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
    e.preventDefault();
    undoBtn.click();
  } else if (
    (e.ctrlKey || e.metaKey) &&
    ((e.shiftKey && e.key.toLowerCase() === "z") || e.key.toLowerCase() === "y")
  ) {
    e.preventDefault();
    redoBtn.click();
  } else if (e.key === "Delete") {
    clearBtn.click();
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    saveBtn.click();
  } else if (e.code === "Space") {
    e.preventDefault();
    playBtn.click();
  }
});
