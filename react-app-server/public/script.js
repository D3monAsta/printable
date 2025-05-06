const canvasElement = document.getElementById('overlay');
const canvasCtx = canvasElement.getContext('2d');

prozlips = 0;
rgblips = '(255, 0, 0';

prozbrowz = 0;
rgbbrowz = '(255, 0, 0';

prozblush = 0;
rgbblush = '(255, 0, 0';

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
  ctx.fillStyle = 'rgba' + rgblips + ', ' + prozlips/100 +')';
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
  ctx.fillStyle = 'rgba' + rgbbrowz + ', ' + prozbrowz/100 +')';
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
  ctx.fillStyle = 'rgba' + rgbblush + ', ' + prozblush/100 +')';
  ctx.lineJoin = 'round';
  ctx.filter = 'blur(4px)';
  ctx.shadowColor = 'rgba' + rgbblush + ', ' + prozblush/100 +')';
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

// document.getElementById("captureBtn").addEventListener("click", () => {
//   const flatCanvas = document.getElementById("makeupFlatCanvas");
//   const ctx = flatCanvas.getContext("2d");
//   ctx.clearRect(0, 0, flatCanvas.width, flatCanvas.height);

//   // 1. Получаем текущие landmarks
//   const landmarks = lastFaceLandmarks; // предположим, ты их хранишь при каждом кадре

//   // 2. Нормализуем landmarks
//   const normalizedPoints = normalizeFace(landmarks, flatCanvas.width, flatCanvas.height);

//   // 3. Рисуем макияж на нейтральном лице
//   drawMakeupOnFlatCanvas(ctx, normalizedPoints);

//   // 4. Скачиваем PNG
//   const dataURL = flatCanvas.toDataURL("/image");
//   const link = document.createElement("a");
//   link.href = dataURL;
//   link.download = "makeup_template.png";
//   link.click();
// });


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

const colorBtn = document.getElementById('colorBtn');
const colorControl = document.getElementById('colorControl');
const intensityControl = document.getElementById('intensityControl');
const intensityBtn = document.getElementById('intensityBtn');

// Обработчик для кнопки "Интенсивность"
intensityBtn.addEventListener('click', () => {
  const isVisible = intensityControl.style.display === 'block';
  intensityControl.style.display = isVisible ? 'none' : 'block';
  colorControl.style.display = 'none'; // Скрываем палитру, если была открыта
});

// Обработчик для кнопки "Цвет"
colorBtn.addEventListener('click', () => {
  const isVisible = colorControl.style.display === 'block';
  colorControl.style.display = isVisible ? 'none' : 'block';
  intensityControl.style.display = 'none'; // Скрываем интенсивность, если была открыта
});


function getActiveButton() {
  if (browsBtn.classList.contains('active')) {
    return 'browsBtn'; // Если кнопка бровей активна
  } else if (lipsBtn.classList.contains('active')) {
    return 'lipsBtn'; // Если кнопка губ активна
  } else if (cheeksBtn.classList.contains('active')) {
    return 'cheeksBtn'; // Если кнопка румян активна
  } else {
    return null; // Если ни одна кнопка не нажата
  }
}


const colorSlider = document.getElementById('colorSlider');

// Получение цвета по hue
function hueToRGB(hue) {
  const s = 1;  // Насытимость (можно изменить по желанию)
  const l = 0.5; // Светлотa (можно изменить по желанию)

  // Преобразование HSL в RGB
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
  const m = l - c / 2;

  let r, g, b;
  if (hue >= 0 && hue < 60) {
    r = c; g = x; b = 0;
  } else if (hue >= 60 && hue < 120) {
    r = x; g = c; b = 0;
  } else if (hue >= 120 && hue < 180) {
    r = 0; g = c; b = x;
  } else if (hue >= 180 && hue < 240) {
    r = 0; g = x; b = c;
  } else if (hue >= 240 && hue < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  // Преобразуем значения от 0 до 1 в 0-255
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return `(${r}, ${g}, ${b}`; // Возвращаем цвет в формате rgb
}

colorSlider.addEventListener('input', () => {
  const hue = parseInt(colorSlider.value);
  const selectedColor = hueToRGB(hue);
  console.log('Выбранный цвет:', selectedColor);
  if (getActiveButton() == 'browsBtn') {
    rgbbrowz = selectedColor;
  }
  if (getActiveButton() == 'lipsBtn') {
    rgblips = selectedColor;
  }
  if (getActiveButton() == 'cheeksBtn') {
    rgbblush = selectedColor;
  }
});

const intensitySlider = document.getElementById('intensitySlider');

// Обработчик для ползунка прозрачности
intensitySlider.addEventListener('input', () => {
  const intensity = parseFloat(intensitySlider.value); // Получаем значение ползунка (от 0 до 1)
  console.log('Интенсивность прозрачности:', intensity); // Выводим значение интенсивности
  if (getActiveButton() == 'browsBtn') {
    prozbrowz = intensity;
  }
  if (getActiveButton() == 'lipsBtn') {
    prozlips = intensity;
  }
  if (getActiveButton() == 'cheeksBtn') {
    prozblush = intensity;
  }
});