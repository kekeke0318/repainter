const imageLoader = document.getElementById('imageLoader');
const motif = document.getElementById('motif');
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const penColor = document.getElementById('penColor');
const penWidth = document.getElementById('penWidth');
const clearBtn = document.getElementById('clearBtn');
const container = document.getElementById('canvasContainer');
let drawing = false;
let strokes = 0;
let scale = 1;
let panX = 0;
let panY = 0;
let panning = false;
let startPanX = 0;
let startPanY = 0;

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
        ctx.beginPath();
        const pos = getCanvasCoords(e);
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
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
});

canvas.addEventListener('pointerup', e => {
    if (!drawing) return;
    drawing = false;
    canvas.releasePointerCapture(e.pointerId);
    strokes++;
    motif.style.visibility = 'visible';
});

canvas.addEventListener('pointerleave', () => {
    drawing = false;
    motif.style.visibility = 'visible';
});

clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes = 0;
});
