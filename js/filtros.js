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
  // "y" baja o sube la montura respecto a los ojos; las imágenes están en monturas.js.
  const FILTERS = [
    { id: "cereza", name: "Cereza floral", width: 184, y: 5, hinge: -8, charms: true, burst: "🍀" },
    { id: "carey", name: "Carey rosado", width: 188, y: 5, hinge: -6, burst: "✨" },
    { id: "miel", name: "Miel y crema", width: 188, y: 5, hinge: -6, burst: "🤎" },
    { id: "ambar", name: "Carey ámbar", width: 188, y: 5, hinge: -7, burst: "⭐" },
    { id: "negra", name: "Negra ovalada", width: 188, y: 5, hinge: -8, burst: "🖤" },
  ];
  for (const f of FILTERS) {
    const art = window.MONTURAS[f.id];
    f.height = (f.width * art.height) / art.width;
    f.front = new Image();
    f.front.src = art.front;
    f.temple = new Image();
    f.temple.src = art.temple;
  }

  const drawFront = (c, f) => {
    c.drawImage(f.front, -f.width / 2, f.y - f.height / 2, f.width, f.height);
  };

  // La patilla es una tira con la textura de la foto, de la bisagra hacia la oreja.
  const drawTemple = (c, f, side, ear) => {
    const x = side * (f.width / 2 - 4);
    const y = f.y + f.hinge;
    if ((ear.x - x) * side <= 2) return; // queda oculta al girar la cara
    const dx = ear.x - x;
    const dy = ear.y - 6 - y;
    c.save();
    c.translate(x, y);
    c.rotate(Math.atan2(dy, dx));
    if (side < 0) c.scale(1, -1);
    c.drawImage(f.temple, 0, -3.5, Math.hypot(dx, dy), 7);
    c.restore();
  };

  // Dijes plateados: aro, cadena con nota y estrella con trébol.
  const drawCharms = (c, swing) => {
    const silver = (width, path) => {
      c.beginPath();
      path();
      c.lineWidth = width;
      c.strokeStyle = "#62666e";
      c.stroke();
      c.lineWidth = width * 0.55;
      c.strokeStyle = "#e9edf2";
      c.stroke();
    };
    const ring = (x, y, r, width = 1.8) => silver(width, () => c.arc(x, y, r, 0, Math.PI * 2));

    c.save();
    c.lineJoin = c.lineCap = "round";
    c.rotate(swing * 0.5);
    ring(0, 6, 7, 3);

    c.save(); // cadena con nota musical
    c.translate(-3, 13);
    c.rotate(0.12 + swing * 0.5);
    for (let y = 2; y < 23; y += 3.5) ring(0, y, 1.8, 1.3);
    silver(3, () => {
      c.moveTo(-3, 39);
      c.lineTo(-3, 26);
      c.lineTo(7, 25);
      c.lineTo(7, 38);
    });
    for (const [x, y] of [[-6, 40], [4, 39]]) {
      silver(2.2, () => c.ellipse(x, y, 3.5, 2.5, -0.4, 0, Math.PI * 2));
    }
    c.restore();

    c.save(); // estrella con trébol
    c.translate(4, 12);
    c.rotate(-0.25 + swing * 0.7);
    ring(0, 2, 2.5);
    silver(2.6, () => {
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 5 : 9.5;
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        c.lineTo(r * Math.cos(a), 14 + r * Math.sin(a));
      }
      c.closePath();
    });
    ring(0, 25, 2.2);
    c.translate(0, 35);
    c.fillStyle = "#d5dae1";
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(0, 0);
      c.bezierCurveTo(-8, -4, -5, -10, 0, -7);
      c.bezierCurveTo(5, -10, 8, -4, 0, 0);
      c.fill();
      c.lineWidth = 1;
      c.strokeStyle = "#62666e";
      c.stroke();
      c.rotate(Math.PI / 2);
    }
    c.restore();
    c.restore();
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
      mouth: at(13),
      mouthOpen: Math.hypot(lip.x, lip.y, lip.z) > Math.hypot(height.x, height.y, height.z) * 0.13,
    };
  };

  // Los dijes cuelgan con la gravedad: no giran con la cara y se balancean al moverla.
  const pendulum = { x: null, angle: 0, speed: 0 };
  const hangCharms = (pose, f) => {
    const [a, b, c, d, e, g] = pose.matrix;
    const localX = -f.width / 2 + 9;
    const localY = f.y + f.height * 0.2;
    const x = a * localX + c * localY + e;
    const y = b * localX + d * localY + g;
    const moved = pendulum.x === null ? 0 : (x - pendulum.x) / pose.size;
    pendulum.x = x;
    pendulum.speed = (pendulum.speed - pendulum.angle * 0.08 + moved * 0.008) * 0.9;
    pendulum.angle = Math.max(-0.8, Math.min(0.8, pendulum.angle + pendulum.speed));
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pose.size, pose.size);
    drawCharms(ctx, pendulum.angle);
    ctx.restore();
  };

  const drawFace = (pose, f) => {
    ctx.save();
    ctx.transform(...pose.matrix);
    drawTemple(ctx, f, -1, pose.leftEar);
    drawTemple(ctx, f, 1, pose.rightEar);
    ctx.restore();
    if (f.charms) hangCharms(pose, f); // detrás del frente, como en la foto
    ctx.save();
    ctx.transform(...pose.matrix);
    drawFront(ctx, f);
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
    c.translate(64, f.charms ? 52 : 64);
    c.scale(0.6, 0.6);
    f.front.decode().then(() => {
      if (f.charms) {
        c.save();
        c.translate(-f.width / 2 + 9, f.y + f.height * 0.2);
        drawCharms(c, 0);
        c.restore();
      }
      drawFront(c, f);
    }).catch((err) => console.error("No se pudo cargar la montura:", f.id, err));
    button.append(icon);
    button.addEventListener("click", () => {
      current = f;
      particles = [];
      pendulum.x = null;
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
