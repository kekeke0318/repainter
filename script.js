const imageLoader = document.getElementById('imageLoader');
const motif = document.getElementById('motif');
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const penColor = document.getElementById('penColor');
const penWidth = document.getElementById('penWidth');
const clearBtn = document.getElementById('clearBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const saveBtn = document.getElementById('saveBtn');
const antialiasToggle = document.getElementById('antialiasToggle');
const stabilizeToggle = document.getElementById('stabilizeToggle');
const container = document.getElementById('canvasContainer');
let drawing = false;
let strokes = 0;
let scale = 1;
let panX = 0;
let panY = 0;
let panning = false;
let startPanX = 0;
let startPanY = 0;
let antialias = true;
let stabilize = false;
let lastPos = null;

let history = [];
let historyIndex = -1;

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

function setCanvasSize(width, height) {
    container.style.width = width + 'px';
    container.style.height = height + 'px';
    canvas.width = width;
    canvas.height = height;
}

function resizeCanvas() {
    if (motif.style.display === 'block') {
        setCanvasSize(motif.clientWidth, motif.clientHeight);
    }
    updateTransform();
}

// initialize default canvas size
setCanvasSize(640, 480);
updateTransform();
saveHistory();

imageLoader.addEventListener('change', function(e) {
    const reader = new FileReader();
    reader.onload = function(event) {
        motif.src = event.target.result;
        motif.style.display = 'block';
        motif.onload = () => {
            resizeCanvas();
        };
    };
    reader.readAsDataURL(e.target.files[0]);
});

window.addEventListener('resize', resizeCanvas);

function updateTransform() {
    container.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
}

canvas.addEventListener('pointerdown', e => {
    if (e.button === 0) {
        drawing = true;
        canvas.setPointerCapture(e.pointerId);
        ctx.strokeStyle = penColor.value;
        ctx.lineWidth = penWidth.value;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.imageSmoothingEnabled = antialias;
        ctx.beginPath();
        const pos = getCanvasCoords(e);
        lastPos = pos;
        ctx.moveTo(pos.x, pos.y);
        motif.style.visibility = 'hidden';
    }
});

container.addEventListener('pointerdown', e => {
    if (e.button === 1) {
        e.preventDefault();
        panning = true;
        container.setPointerCapture(e.pointerId);
        startPanX = e.clientX - panX;
        startPanY = e.clientY - panY;
    }
});

container.addEventListener('pointermove', e => {
    if (panning) {
        panX = e.clientX - startPanX;
        panY = e.clientY - startPanY;
        updateTransform();
    }
});

container.addEventListener('pointerup', e => {
    if (panning && e.button === 1) {
        panning = false;
        container.releasePointerCapture(e.pointerId);
    }
});

container.addEventListener('pointerleave', e => {
    if (panning) {
        panning = false;
        container.releasePointerCapture(e.pointerId);
    }
});

container.addEventListener('wheel', e => {
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
});

canvas.addEventListener('pointermove', e => {
    if (!drawing) return;
    const pos = getCanvasCoords(e);
    let drawPos = pos;
    if (stabilize && lastPos) {
        lastPos = {
            x: lastPos.x * 0.75 + pos.x * 0.25,
            y: lastPos.y * 0.75 + pos.y * 0.25
        };
        drawPos = lastPos;
    }
    ctx.lineTo(drawPos.x, drawPos.y);
    ctx.stroke();
});

canvas.addEventListener('pointerup', e => {
    if (!drawing) return;
    drawing = false;
    canvas.releasePointerCapture(e.pointerId);
    strokes++;
    motif.style.visibility = 'visible';
    saveHistory();
});

canvas.addEventListener('pointerleave', () => {
    if (drawing) {
        drawing = false;
        motif.style.visibility = 'visible';
        saveHistory();
    }
});

clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes = 0;
    saveHistory();
});

undoBtn.addEventListener('click', () => {
    if (historyIndex > 0) {
        historyIndex--;
        restoreHistory(historyIndex);
    }
});

redoBtn.addEventListener('click', () => {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        restoreHistory(historyIndex);
    }
});

saveBtn.addEventListener('click', () => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext('2d');
    if (motif.src) {
        exportCtx.drawImage(motif, 0, 0, canvas.width, canvas.height);
    }
    exportCtx.drawImage(canvas, 0, 0);
    const link = document.createElement('a');
    link.href = exportCanvas.toDataURL('image/png');
    link.download = 'drawing.png';
    link.click();
});

antialiasToggle.addEventListener('change', e => {
    antialias = e.target.checked;
});

stabilizeToggle.addEventListener('change', e => {
    stabilize = e.target.checked;
});
