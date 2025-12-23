const video = document.getElementById("videoElement");
const playlistElem = document.getElementById("playlist");
const canvas = document.getElementById("videoCanvas");
const ctx = canvas.getContext("2d");
const effectSelect = document.getElementById("effectSelect");
const subtitleSelect = document.getElementById("subtitleSelect");
const zoneInteractive = {
  play: { x: 460, y: 490, w: 28, h: 28 },
  prev: { x: 420, y: 490, w: 28, h: 28 },
  next: { x: 500, y: 490, w: 28, h: 28 },
  bar: { x: 120, y: 530, w: 720, h: 6 },
  volume: { x: 860, y: 485, w: 12, h: 40 },
};
const previewVideo = document.createElement("video");
previewVideo.muted = true;
previewVideo.preload = "auto";

const STORAGE_KEYS = {
  volume: "player_volume",
  index: "player_index",
  effect: "player_effect",
};

const playlist = [
  {
    title: "Video 1",
    src: "media/videos/video1.mp4",
    subtitrare: "media/subtitles/video1.json",
  },
  {
    title: "Video 2",
    src: "media/videos/video2.mp4",
    subtitrare: "media/subtitles/video2.json",
  },
  {
    title: "Video 3",
    src: "media/videos/video3.mp4",
    subtitrare: "media/subtitles/video3.json",
  },
  {
    title: "Video 4",
    src: "media/videos/video4.mp4",
    subtitrare: "media/subtitles/video4.json",
  },
];

let indexCurent = 0;
let dragIndex = null;
let efectCurent = "none";
let arataPreview = false;
let previewTime = 0;
let previewX = 0;
let subtitles = [];
let subtitlesEnabled = true;

effectSelect.addEventListener("change", (e) => {
  efectCurent = e.target.value;
  localStorage.setItem(STORAGE_KEYS.effect, efectCurent);
});

function incarcaVideo(index) {
  indexCurent = index;
  video.src = playlist[indexCurent].src;
  video.load();
  video.muted = true;
  video.play();
  previewVideo.src = video.src;
  previewVideo.load();
  incarcaSubtitrari(playlist[indexCurent].subtitrare);
  updateSelectSubtitrari();
  localStorage.setItem(STORAGE_KEYS.index, indexCurent);
}

function randare() {
  playlistElem.innerHTML = "";
  playlist.forEach((item, index) => {
    const li = document.createElement("li");
    li.draggable = true;
    const span = document.createElement("span");
    span.textContent = item.title;
    const btn = document.createElement("button");
    btn.textContent = "Delete";

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      stergeVideo(index);
    });

    li.addEventListener("click", () => {
      incarcaVideo(index);
    });

    li.appendChild(span);
    li.appendChild(btn);
    playlistElem.appendChild(li);

    addEventDrag(li, index);
  });
}

video.addEventListener("ended", () => {
  indexCurent++;
  if (indexCurent >= playlist.length) {
    indexCurent = 0;
  }

  incarcaVideo(indexCurent);
});

restaurareSetari();
randare();
incarcaVideo(indexCurent);

const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");

function adaugaVideo(file) {
  if (!file.type.startsWith("video/")) return;

  const urlVideo = URL.createObjectURL(file);

  playlist.push({
    title: file.name,
    src: urlVideo,
  });

  randare();
}

fileInput.addEventListener("change", (e) => {
  const files = e.target.files;

  for (let file of files) {
    adaugaVideo(file);
  }

  fileInput.value = "";
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.style.borderColor = "#fff";
});

dropZone.addEventListener("dragleave", () => {
  dropZone.style.borderColor = "#666";
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.style.borderColor = "#666";

  const files = e.dataTransfer.files;

  for (let file of files) {
    adaugaVideo(file);
  }
});

function stergeVideo(index) {
  playlist.splice(index, 1);

  if (index === indexCurent) {
    indexCurent = 0;
    if (playlist.length > 0) {
      incarcaVideo(indexCurent);
    }
  } else if (index < indexCurent) {
    indexCurent--;
  }

  randare();
}

function addEventDrag(li, index) {
  li.addEventListener("dragstart", () => {
    dragIndex = index;
    li.classList.add("dragging");
  });

  li.addEventListener("dragend", () => {
    li.classList.remove("dragging");
  });

  li.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  li.addEventListener("drop", () => {
    if (dragIndex === null || dragIndex === index) return;

    const draggedItem = playlist[dragIndex];
    playlist.splice(dragIndex, 1);
    playlist.splice(index, 0, draggedItem);

    if (indexCurent === dragIndex) {
      indexCurent = index;
    }

    dragIndex = null;
    randare();
  });
}

function deseneaza() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  if (efectCurent !== "none") {
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    aplicaEfect(frame, efectCurent);
    ctx.putImageData(frame, 0, 0);
  }

  deseneazaControale();
  if (arataPreview) {
    drawPreviewFrame();
  }

  requestAnimationFrame(deseneaza);
}

requestAnimationFrame(deseneaza);

function aplicaEfect(imageData, efect) {
  switch (efect) {
    case "grayscale":
      efectGrayscale(imageData);
      break;
    case "invert":
      efectInvert(imageData);
      break;
    case "threshold":
      efectThreshold(imageData, 128);
      break;
    default:
      break;
  }
}

function efectInvert(imageData) {
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = 255 - d[i];
    d[i + 1] = 255 - d[i + 1];
    d[i + 2] = 255 - d[i + 2];
  }
}
function efectThreshold(imageData, t) {
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const y = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) | 0;
    const v = y >= t ? 255 : 0;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
}

function efectGrayscale(imageData) {
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i],
      g = d[i + 1],
      b = d[i + 2];
    const y = (0.2126 * r + 0.7152 * g + 0.0722 * b) | 0;
    d[i] = d[i + 1] = d[i + 2] = y;
  }
}

function deseneazaControale() {
  ctx.fillStyle = "rgba(0,0,0,0.35)";

  ctx.fillStyle = "white";

  if (video.paused) {
    ctx.beginPath();
    ctx.moveTo(460, 492);
    ctx.lineTo(460, 516);
    ctx.lineTo(488, 504);
    ctx.fill();
  } else {
    ctx.fillRect(460, 492, 6, 24);
    ctx.fillRect(472, 492, 6, 24);
  }

  ctx.beginPath();
  ctx.moveTo(442, 492);
  ctx.lineTo(442, 516);
  ctx.lineTo(420, 504);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(500, 492);
  ctx.lineTo(500, 516);
  ctx.lineTo(522, 504);
  ctx.fill();

  const p = video.duration ? video.currentTime / video.duration : 0;
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillRect(120, 532, 720, 4);
  ctx.fillStyle = "#fff";
  ctx.fillRect(120, 532, 720 * p, 4);

  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillRect(860, 490, 8, 36);

  ctx.fillStyle = "#fff";
  ctx.fillRect(860, 490 + 36 * (1 - video.volume), 8, 36 * video.volume);

  deseneazaSubtitrare();
}

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (verifica(x, y, zoneInteractive.play)) {
    video.paused ? video.play() : video.pause();
  } else if (verifica(x, y, zoneInteractive.prev)) {
    indexCurent = (indexCurent - 1 + playlist.length) % playlist.length;
    incarcaVideo(indexCurent);
  } else if (verifica(x, y, zoneInteractive.next)) {
    indexCurent = (indexCurent + 1) % playlist.length;
    incarcaVideo(indexCurent);
  } else if (verifica(x, y, zoneInteractive.bar)) {
    const p = (x - zoneInteractive.bar.x) / zoneInteractive.bar.w;
    video.currentTime = p * video.duration;
  } else if (verifica(x, y, zoneInteractive.volume)) {
    const v = 1 - (y - zoneInteractive.volume.y) / zoneInteractive.volume.h;
    video.volume = Math.min(1, Math.max(0, v));
    localStorage.setItem(STORAGE_KEYS.volume, video.volume);
  }
});

function verifica(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (verifica(x, y, zoneInteractive.bar) && video.duration) {
    arataPreview = true;
    previewX = x;

    const p = (x - zoneInteractive.bar.x) / zoneInteractive.bar.w;
    previewTime = Math.max(0, Math.min(video.duration, p * video.duration));

    previewVideo.currentTime = previewTime;
  } else {
    arataPreview = false;
  }
});

function drawPreviewFrame() {
  const w = 160;
  const h = 90;

  let x = previewX - w / 2;
  if (x < 0) x = 0;
  if (x + w > canvas.width) x = canvas.width - w;

  const y = zoneInteractive.bar.y - h - 10;

  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);

  ctx.drawImage(previewVideo, x, y, w, h);

  ctx.fillStyle = "white";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(format(previewTime), x + w / 2, y + h + 14);
}

function format(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

async function incarcaSubtitrari(url) {
  subtitles = [];

  if (!url) return;

  try {
    const res = await fetch(url);
    subtitles = await res.json();
  } catch (e) {
    console.error("Eroare subtitrari", e);
  }
}

function getSubtitrare(time) {
  return subtitles.find((s) => time >= s.start && time <= s.end);
}

function deseneazaSubtitrare() {
  if (!subtitlesEnabled || subtitles.length === 0) return;

  const s = getSubtitrare(video.currentTime);
  if (!s) return;

  ctx.font = "20px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const x = canvas.width / 2;
  const y = canvas.height - 90;
  const padding = 10;

  const metrics = ctx.measureText(s.text);
  const w = metrics.width + padding * 2;
  const h = 30;

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(x - w / 2, y - h / 2, w, h);

  ctx.fillStyle = "white";
  ctx.fillText(s.text, x, y);
}

function updateSelectSubtitrari() {
  subtitleSelect.innerHTML = "";

  const optNone = document.createElement("option");
  optNone.value = "none";
  optNone.textContent = "Fara subtitrari";
  subtitleSelect.appendChild(optNone);

  if (playlist[indexCurent].subtitrare) {
    const opt = document.createElement("option");
    opt.value = "on";
    opt.textContent = "Subtitrari";
    subtitleSelect.appendChild(opt);
  }

  subtitleSelect.value = "none";
  subtitlesEnabled = false;
}

subtitleSelect.addEventListener("change", (e) => {
  subtitlesEnabled = e.target.value !== "none";
});

function restaurareSetari() {
  const savedVolume = localStorage.getItem(STORAGE_KEYS.volume);
  if (savedVolume !== null) {
    video.volume = parseFloat(savedVolume);
  }

  const savedEffect = localStorage.getItem(STORAGE_KEYS.effect);
  if (savedEffect) {
    efectCurent = savedEffect || "none";
    effectSelect.value = savedEffect;
  }

  const savedIndex = localStorage.getItem(STORAGE_KEYS.index);
  if (savedIndex !== null) {
    indexCurent = parseInt(savedIndex, 10);
  }
}
