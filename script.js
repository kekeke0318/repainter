const imageLoader = document.getElementById('imageLoader');
const motif = document.getElementById('motif');
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const penColor = document.getElementById('penColor');
const penWidth = document.getElementById('penWidth');
const alphaValue = document.getElementById('alphaValue');
const clearBtn = document.getElementById('clearBtn');
let drawing = false;
let strokes = 0;

function resizeCanvas() {
    canvas.width = motif.clientWidth;
    canvas.height = motif.clientHeight;
}

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

canvas.addEventListener('mousedown', e => {
    drawing = true;
    ctx.strokeStyle = penColor.value;
    ctx.lineWidth = penWidth.value;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
    motif.style.opacity = alphaValue.value;
});

canvas.addEventListener('mousemove', e => {
    if (!drawing) return;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
});

canvas.addEventListener('mouseup', e => {
    if (!drawing) return;
    drawing = false;
    strokes++;
    motif.style.opacity = 1;
});

canvas.addEventListener('mouseleave', () => {
    drawing = false;
    motif.style.opacity = 1;
});

clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes = 0;
});
