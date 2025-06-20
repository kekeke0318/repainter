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
}

// initialize default canvas size
setCanvasSize(640, 480);

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

canvas.addEventListener('pointerdown', e => {
    drawing = true;
    canvas.setPointerCapture(e.pointerId);
    ctx.strokeStyle = penColor.value;
    ctx.lineWidth = penWidth.value;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
    motif.style.visibility = 'hidden';
});

canvas.addEventListener('pointermove', e => {
    if (!drawing) return;
    ctx.lineTo(e.offsetX, e.offsetY);
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
