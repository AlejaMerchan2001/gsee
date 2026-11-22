// Filtros de cara del simulador. Todo se procesa en el navegador.
// Script clásico (no módulo) para que también funcione al abrir el HTML directamente.
(() => {
  const MP = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
  const MODEL =
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

  const $ = (id) => document.getElementById(id);
  const canvas = $("sim-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const statusEl = $("sim-status");
  const setStatus = (text) => {
    if (statusEl.textContent !== text) statusEl.textContent = text;
  };

  // Los dibujos usan una cara de 200 unidades de ancho, con (0, 0) entre los ojos.
  const FILTERS = [
    { name: "Clásica", shape: "square", frame: "#16181d", width: 8, lens: "#b9e6ff22", burst: "✨" },
    { name: "Redonda", shape: "round", frame: "#b08d45", width: 4, lens: "#ffffff18", burst: "✨" },
    { name: "Aviador", shape: "aviator", frame: "#d4af37", width: 4, lens: ["#17251fee", "#62805f99"], burst: "😎" },
    { name: "Color", shape: "square", frame: "#f6873d", width: 9, lens: ["#ff4f9a99", "#ffd36a55"], burst: "🎉" },
    { name: "Ojo de gato", shape: "cateye", frame: "#8c1d40", width: 8, lens: "#ffc4d522", burst: "💋" },
    { name: "Luz azul", shape: "square", frame: "#285e61", width: 6, lens: ["#4c6fff66", "#8be9ff22"], burst: "💎" },
    { name: "Corazones", shape: "heart", frame: "#e8336d", width: 7, lens: ["#ff2f7caa", "#ffb3d177"], burst: "💖" },
    { name: "Estrellas", shape: "star", frame: "#f5b700", width: 7, lens: ["#7b2ff7aa", "#f107a377"], burst: "⭐" },
    { name: "Gatito", shape: "cateye", frame: "#3b2b35", width: 5, lens: "#ffffff11", extra: "cat", burst: "🐾" },
    { name: "Flores", shape: "round", frame: "#d98aa6", width: 4, lens: "#ffd6e822", extra: "flowers", burst: "🌸" },
  ];

  // Silueta del lente derecho; el izquierdo es su reflejo.
  const lensPath = (shape) => {
    const p = new Path2D();
    if (shape === "round") {
      p.arc(45, 4, 31, 0, Math.PI * 2);
    } else if (shape === "square") {
      p.roundRect(12, -22, 70, 50, [10, 12, 22, 20]);
    } else if (shape === "aviator") {
      p.moveTo(14, -17);
      p.bezierCurveTo(35, -24, 68, -24, 82, -16);
      p.bezierCurveTo(90, 22, 68, 40, 47, 38);
      p.bezierCurveTo(26, 36, 10, 14, 14, -17);
    } else if (shape === "cateye") {
      p.moveTo(13, -12);
      p.bezierCurveTo(34, -24, 66, -22, 90, -32);
      p.bezierCurveTo(86, 14, 72, 28, 46, 28);
      p.bezierCurveTo(22, 28, 10, 12, 13, -12);
    } else if (shape === "heart") {
      p.moveTo(47, -15);
      p.bezierCurveTo(53, -35, 88, -36, 87, -6);
      p.bezierCurveTo(86, 15, 62, 28, 47, 42);
      p.bezierCurveTo(32, 28, 8, 15, 7, -6);
      p.bezierCurveTo(6, -36, 41, -35, 47, -15);
    } else if (shape === "star") {
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 26 : 45;
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        p.lineTo(48 + r * Math.cos(a), 4 + r * Math.sin(a));
      }
    }
    p.closePath();
    return p;
  };
  FILTERS.forEach((f) => (f.path = lensPath(f.shape)));

  const drawCatEars = (c) => {
    for (const side of [-1, 1]) {
      c.save();
      c.scale(side, 1);
      c.fillStyle = "#3b2b35";
      c.beginPath();
      c.moveTo(22, -88);
      c.quadraticCurveTo(50, -145, 86, -165);
      c.quadraticCurveTo(105, -108, 94, -52);
      c.quadraticCurveTo(66, -86, 22, -88);
      c.fill();
      c.fillStyle = "#f49ab8";
      c.beginPath();
      c.moveTo(48, -92);
      c.quadraticCurveTo(60, -120, 80, -140);
      c.quadraticCurveTo(92, -105, 85, -74);
      c.quadraticCurveTo(70, -90, 48, -92);
      c.fill();
      c.restore();
    }
  };

  const drawFlowers = (c) => {
    const colors = ["#f48fb1", "#fff1a8", "#b39ddb", "#ff8a80", "#b39ddb", "#fff1a8", "#f48fb1"];
    colors.forEach((color, i) => {
      const x = (i - 3) * 31;
      const y = -98 + x * x * 0.0048;
      const r = 20 - Math.abs(i - 3) * 1.5;
      c.fillStyle = color;
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI) / 3;
        c.beginPath();
        c.arc(x + r * 0.65 * Math.cos(a), y + r * 0.65 * Math.sin(a), r * 0.55, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = "#e6a11c";
      c.beginPath();
      c.arc(x, y, r * 0.4, 0, Math.PI * 2);
      c.fill();
    });
  };

  const drawCatNose = (c, x, y) => {
    c.save();
    c.translate(x, y);
    c.fillStyle = "#e86f98";
    c.beginPath();
    c.ellipse(0, 0, 15, 10, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#3b2b35";
    c.lineWidth = 2.5;
    c.beginPath();
    for (const side of [-1, 1]) {
      for (const i of [-1, 0, 1]) {
        c.moveTo(side * 27, 8 + i * 6);
        c.quadraticCurveTo(side * 58, 4 + i * 9, side * 88, 10 + i * 16);
      }
    }
    c.stroke();
    c.restore();
  };

  const drawFilter = (c, f, nose) => {
    if (f.extra === "cat") {
      drawCatEars(c);
      drawCatNose(c, nose.x, nose.y);
    }
    if (f.extra === "flowers") drawFlowers(c);

    for (const side of [-1, 1]) {
      c.save();
      c.scale(side, 1);
      let fill = f.lens;
      if (Array.isArray(fill)) {
        fill = c.createLinearGradient(0, -28, 0, 38);
        fill.addColorStop(0, f.lens[0]);
        fill.addColorStop(1, f.lens[1]);
      }
      c.fillStyle = fill;
      c.fill(f.path);
      c.save();
      c.clip(f.path);
      c.fillStyle = "#ffffff30"; // brillo del cristal
      c.beginPath();
      c.moveTo(34, -50);
      c.lineTo(50, -50);
      c.lineTo(22, 50);
      c.lineTo(6, 50);
      c.fill();
      c.restore();
      c.strokeStyle = f.frame;
      c.lineWidth = f.width;
      c.lineJoin = "round";
      c.stroke(f.path);
      c.restore();
    }

    c.strokeStyle = f.frame;
    c.lineWidth = f.width;
    c.beginPath();
    c.moveTo(-15, -6);
    c.quadraticCurveTo(0, -16, 15, -6);
    if (f.shape === "aviator") {
      c.moveTo(-22, -19);
      c.lineTo(22, -19);
    }
    c.stroke();
  };

  // Convierte los puntos de la cara en una base 3D proyectada sobre la imagen.
  const getPose = (marks, mirrored) => {
    const W = canvas.width;
    const H = canvas.height;
    const at = (i) => ({
      x: (mirrored ? 1 - marks[i].x : marks[i].x) * W,
      y: marks[i].y * H,
      z: marks[i].z * W,
    });
    const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
    const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
    const unit = (a) => {
      const n = Math.hypot(a.x, a.y, a.z) || 1;
      return { x: a.x / n, y: a.y / n, z: a.z / n };
    };
    const [leftEye, rightEye, leftEar, rightEar] = (
      mirrored ? [263, 33, 356, 127] : [33, 263, 127, 356]
    ).map(at);

    const right = unit(sub(rightEye, leftEye));
    const height = sub(at(152), at(10));
    const k = dot(height, right);
    const down = unit({ x: height.x - right.x * k, y: height.y - right.y * k, z: height.z - right.z * k });
    const face = sub(at(454), at(234));
    const size = Math.hypot(face.x, face.y, face.z) / 200;

    const bridge = at(168);
    const eyes = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2, z: (leftEye.z + rightEye.z) / 2 };
    const drop = dot(sub(eyes, bridge), down);
    const origin = { x: bridge.x + down.x * drop, y: bridge.y + down.y * drop };
    const matrix = [right.x * size, right.y * size, down.x * size, down.y * size, origin.x, origin.y];

    const toFace = (p) => {
      const [a, b, c, d, e, f] = matrix;
      const det = a * d - b * c || 1;
      return { x: (d * (p.x - e) - c * (p.y - f)) / det, y: (a * (p.y - f) - b * (p.x - e)) / det };
    };
    const lip = sub(at(14), at(13));
    return {
      matrix,
      size,
      leftEar: toFace(leftEar),
      rightEar: toFace(rightEar),
      nose: toFace(at(1)),
      mouth: at(13),
      mouthOpen: Math.hypot(lip.x, lip.y, lip.z) / size > 30,
    };
  };

  const drawFace = (pose, f) => {
    ctx.save();
    ctx.transform(...pose.matrix);
    // La patilla del lado que queda oculto al girar no se dibuja.
    ctx.strokeStyle = f.frame;
    ctx.lineWidth = f.width;
    ctx.lineCap = "round";
    for (const [side, ear] of [[-1, pose.leftEar], [1, pose.rightEar]]) {
      if (ear.x * side <= 84) continue;
      ctx.beginPath();
      ctx.moveTo(side * 82, -12);
      ctx.lineTo(ear.x, ear.y - 6);
      ctx.stroke();
    }
    drawFilter(ctx, f, pose.nose);
    ctx.restore();
  };

  let current = FILTERS[0];
  let landmarker;
  let loading;
  let source = null; // { el, width, height, mirrored, stream }
  let request = 0;
  let particles = [];
  let lastBurst = 0;
  let lastFrame = 0;

  const loadDetector = () => {
    loading ??= (async () => {
      const { FaceLandmarker, FilesetResolver } = await import(`${MP}/vision_bundle.mjs`);
      const files = await FilesetResolver.forVisionTasks(`${MP}/wasm`);
      const create = (delegate) =>
        FaceLandmarker.createFromOptions(files, {
          baseOptions: { modelAssetPath: MODEL, delegate },
          runningMode: "VIDEO",
          numFaces: 1, // con una sola cara MediaPipe suaviza el temblor
        });
      landmarker = await create("GPU").catch(() => create("CPU"));
    })().catch((err) => {
      loading = null;
      throw err;
    });
    return loading;
  };

  const updateParticles = (now) => {
    const dt = Math.min((now - lastFrame) / 1000, 0.1);
    lastFrame = now;
    particles = particles.filter((p) => (p.life -= dt) > 0);
    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      ctx.globalAlpha = Math.min(1, p.life);
      ctx.font = `${p.size}px sans-serif`;
      ctx.fillStyle = "#000";
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  };

  const render = () => {
    if (!source || !landmarker) return;
    const { el, mirrored, stream } = source;
    if (stream && el.readyState < 2) return;

    const width = stream ? el.videoWidth : source.width;
    const height = stream ? el.videoHeight : source.height;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    ctx.save();
    if (mirrored) ctx.setTransform(-1, 0, 0, 1, width, 0);
    ctx.drawImage(el, 0, 0, width, height);
    ctx.restore();

    const now = performance.now();
    const marks = landmarker.detectForVideo(el, now).faceLandmarks[0];
    if (marks) {
      const pose = getPose(marks, mirrored);
      drawFace(pose, current);
      if (pose.mouthOpen && now - lastBurst > 180) {
        lastBurst = now;
        particles.push({
          ...pose.mouth,
          text: current.burst,
          size: 36 * pose.size,
          vx: (Math.random() - 0.5) * 220 * pose.size,
          vy: -(60 + Math.random() * 120) * pose.size,
          life: 1.6,
        });
      }
      setStatus("");
    } else {
      setStatus("No veo una cara: mira de frente y busca buena luz.");
    }
    updateParticles(now);
  };

  const loop = () => {
    try {
      render();
    } catch (err) {
      console.error("Error al dibujar el filtro:", err);
    }
    requestAnimationFrame(loop);
  };

  const stop = () => {
    request++; // invalida cualquier carga pendiente
    source?.stream?.getTracks().forEach((track) => track.stop());
    source = null;
    particles = [];
    $("sim-start").hidden = false;
    $("sim-shot").disabled = true;
    setStatus("Activa la cámara o elige una foto.");
  };

  const start = async (open, errorText) => {
    stop();
    const id = request;
    let next;
    try {
      setStatus("Preparando la imagen…");
      next = await open();
      if (id === request) setStatus("Cargando filtros…");
      await loadDetector().catch((err) => {
        errorText = () => "No se pudieron cargar los filtros. Revisa tu internet.";
        throw err;
      });
      if (id !== request) {
        next.stream?.getTracks().forEach((track) => track.stop());
        return;
      }
      source = next;
      $("sim-start").hidden = true;
      $("sim-shot").disabled = false;
    } catch (err) {
      next?.stream?.getTracks().forEach((track) => track.stop());
      console.error(err);
      if (id === request) setStatus(errorText(err));
    }
  };

  $("sim-camera").addEventListener("click", () =>
    start(
      async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 720 } },
          audio: false,
        });
        const el = document.createElement("video");
        el.muted = true;
        el.playsInline = true;
        el.srcObject = stream;
        await el.play();
        return { el, stream, mirrored: true };
      },
      (err) =>
        err.name === "NotFoundError"
          ? "No encontré una cámara. Puedes usar una foto."
          : "No pude abrir la cámara. Revisa el permiso o usa una foto."
    )
  );

  $("sim-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    start(
      async () => {
        const image = await createImageBitmap(file);
        const scale = Math.min(1, 1280 / Math.max(image.width, image.height));
        const el = document.createElement("canvas");
        el.width = Math.round(image.width * scale);
        el.height = Math.round(image.height * scale);
        el.getContext("2d").drawImage(image, 0, 0, el.width, el.height);
        image.close();
        return { el, width: el.width, height: el.height, mirrored: false };
      },
      () => "No pude leer esa foto. Prueba con un JPG o PNG."
    );
  });

  $("sim-change").addEventListener("click", stop);
  window.addEventListener("pagehide", stop);

  $("sim-shot").addEventListener("click", () => {
    canvas.toBlob((blob) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `g-see-${Date.now()}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    });
  });

  FILTERS.forEach((f, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = i ? "lens" : "lens active";
    button.title = f.name;
    button.setAttribute("aria-label", f.name);
    button.setAttribute("aria-pressed", String(!i));
    const icon = document.createElement("canvas");
    icon.width = icon.height = 128;
    const c = icon.getContext("2d");
    c.translate(64, f.extra ? 80 : 64);
    c.scale(0.54, 0.54);
    drawFilter(c, f, { x: 0, y: 48 });
    button.append(icon);
    button.addEventListener("click", () => {
      current = f;
      particles = [];
      $("sim-name").textContent = f.name;
      $("sim-lenses").querySelectorAll(".lens").forEach((b) => {
        b.classList.toggle("active", b === button);
        b.setAttribute("aria-pressed", String(b === button));
      });
    });
    $("sim-lenses").append(button);
  });

  $("sim-name").textContent = current.name;
  loop();
})();
