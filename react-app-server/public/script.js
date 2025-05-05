const canvasElement = document.getElementById('overlay');
const canvasCtx = canvasElement.getContext('2d');

// Скрытый video-элемент для захвата камеры (не добавляется в DOM)
const videoElement = document.createElement('video');
videoElement.autoplay = true;
videoElement.playsInline = true;
videoElement.muted = true;

// Настройка faceMesh
const faceMesh = new FaceMesh({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`,
});

faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

faceMesh.onResults(onResults);

// Настройка камеры
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await faceMesh.send({ image: videoElement });
  },
});
camera.start();

// Авторазмер canvas под размер видео
videoElement.addEventListener('loadedmetadata', () => {
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;
});

// Основная функция отрисовки
function onResults(results) {
  if (!results.multiFaceLandmarks) return;

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Масштабируем изображение из видео без искажений
  const aspectVideo = videoElement.videoWidth / videoElement.videoHeight;
  const aspectCanvas = canvasElement.width / canvasElement.height;

  let drawWidth = canvasElement.width;
  let drawHeight = canvasElement.height;

  if (aspectVideo > aspectCanvas) {
    drawHeight = canvasElement.height;
    drawWidth = canvasElement.height * aspectVideo;
  } else {
    drawWidth = canvasElement.width;
    drawHeight = canvasElement.width / aspectVideo;
  }

  const dx = (canvasElement.width - drawWidth) / 2;
  const dy = (canvasElement.height - drawHeight) / 2;

  canvasCtx.drawImage(results.image, dx, dy, drawWidth, drawHeight);

  for (const landmarks of results.multiFaceLandmarks) {
    drawLips(canvasCtx, landmarks);
    drawEyebrows(canvasCtx, landmarks);
    drawCheeks(canvasCtx, landmarks);
  }

  canvasCtx.restore();
}

// ====== Функции отрисовки ======

function drawSmoothCurve(ctx, points) {
  if (points.length < 2) return;
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
}

function drawLips(ctx, landmarks) {
  const outerLips = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];
  const innerLips = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80];

  ctx.save();
  ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
  ctx.lineJoin = 'round';
  ctx.filter = 'blur(1px)';

  ctx.beginPath();
  drawSmoothCurve(ctx, outerLips.map(i => scalePoint(landmarks[i])));
  drawSmoothCurve(ctx, innerLips.slice().reverse().map(i => scalePoint(landmarks[i])));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawEyebrows(ctx, landmarks) {
  const leftBrow = [107, 66, 105, 63, 70, 46, 53, 52, 65, 55];
  const rightBrow = [336, 296, 334, 293, 300, 276, 283, 282, 295, 285];

  ctx.save();
  ctx.fillStyle = 'rgba(80, 40, 20, 0.5)';
  ctx.lineJoin = 'round';
  ctx.filter = 'blur(0.7px)';

  ctx.beginPath();
  drawSmoothCurve(ctx, leftBrow.map(i => scalePoint(landmarks[i])));
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  drawSmoothCurve(ctx, rightBrow.map(i => scalePoint(landmarks[i])));
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawCheeks(ctx, landmarks) {
  const leftCheek = [127, 143, 229, 101, 205, 93];
  const rightCheek = [356, 372, 449, 330, 425, 366];
  const nose = [51, 5, 281, 275, 1, 45];

  ctx.save();
  ctx.fillStyle = 'rgba(255, 105, 180, 0.25)';
  ctx.lineJoin = 'round';
  ctx.filter = 'blur(4px)';
  ctx.shadowColor = 'rgba(255, 105, 180, 0.3)';
  ctx.shadowBlur = 15;

  ctx.beginPath();
  drawSmoothCurve(ctx, leftCheek.map(i => scalePoint(landmarks[i])));
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  drawSmoothCurve(ctx, rightCheek.map(i => scalePoint(landmarks[i])));
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  drawSmoothCurve(ctx, nose.map(i => scalePoint(landmarks[i])));
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// ====== Утилита масштабирования ======
function scalePoint(point) {
  return {
    x: point.x * canvasElement.width,
    y: point.y * canvasElement.height
  };
}


function toggleControlButtons(show) {
  if (show) {
    controls.style.opacity = 1;
    controls.style.visibility = 'visible';
  } else {
    controls.style.opacity = 0;
    controls.style.visibility = 'hidden';
  }
}

function deactivateOtherButtons(exceptButton) {
  const buttons = [browsBtn, lipsBtn, cheeksBtn];
  buttons.forEach(btn => {
    if (btn !== exceptButton) {
      btn.classList.remove('active');
    }
  });
}

function updateControlVisibility() {
  if (
    browsBtn.classList.contains('active') ||
    lipsBtn.classList.contains('active') ||
    cheeksBtn.classList.contains('active')
  ) {
    toggleControlButtons(true);
  } else {
    toggleControlButtons(false);
  }
}

browsBtn.addEventListener('click', () => {
  const isActive = browsBtn.classList.toggle('active');
  if (isActive) {
    deactivateOtherButtons(browsBtn);
  }
  toggleControlButtons(browsBtn.classList.contains('active'));
  updateControlVisibility();
});

lipsBtn.addEventListener('click', () => {
  const isActive = lipsBtn.classList.toggle('active');
  if (isActive) {
    deactivateOtherButtons(lipsBtn);
  }
  toggleControlButtons(lipsBtn.classList.contains('active'));
  updateControlVisibility();
});

cheeksBtn.addEventListener('click', () => {
  const isActive = cheeksBtn.classList.toggle('active');
  if (isActive) {
    deactivateOtherButtons(cheeksBtn);
  }
  toggleControlButtons(cheeksBtn.classList.contains('active'));
  updateControlVisibility();
});

const intensityControl = document.getElementById('intensityControl');
const intensityBtn = document.getElementById('intensityBtn');
let isIntensityVisible = false;

intensityBtn.addEventListener('click', () => {
  isIntensityVisible = !isIntensityVisible;
  intensityControl.style.display = isIntensityVisible ? 'block' : 'none';
});