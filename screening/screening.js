/* In-browser breast imaging demo. Model: screening/model.onnx + screening/model_meta.json
   (produced by train.py). Nothing is uploaded: the image is decoded and scored locally. */
(function () {
  const ORT_WASM_BASE = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/";
  const MODEL_URL = "screening/model.onnx";
  const META_URL = "screening/model_meta.json";
  const MAX_PIXELS = 40e6;
  const MAX_BYTES = 25 * 1024 * 1024;

  const $ = (id) => document.getElementById(id);
  let meta = null, session = null, file = null, previewUrl = null;

  function show(cls, verdict, details) {
    const r = $("scrResult");
    r.hidden = false;
    r.className = "scr-result " + (cls || "");
    $("scrVerdict").textContent = verdict;
    $("scrDetails").textContent = details || "";
  }
  const pct = (x, d = 1) => (x * 100).toFixed(d) + "%";

  function setFile(f) {
    if (!f) return;
    if (!/^image\/(png|jpeg)$/.test(f.type)) { show("", "Unsupported file", "Please choose a PNG or JPG image."); return; }
    if (f.size > MAX_BYTES) { show("", "File too large", "Please choose an image under 25 MB."); return; }
    file = f;
    $("scrDropText").textContent = f.name;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(f);
    $("scrPreview").src = previewUrl;
    $("scrPreview").hidden = false;
    $("scrGo").disabled = !meta;
    $("scrResult").hidden = true;
  }

  async function decode(f) {
    let bmp;
    try { bmp = await createImageBitmap(f); }
    catch (e) {
      bmp = await new Promise((res, rej) => {
        const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = previewUrl;
      });
    }
    const w = bmp.width, h = bmp.height;
    if (w * h > MAX_PIXELS) throw new Error("Image is too large (over 40 megapixels).");
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false; // 1:1 pixels; resizing is done in preprocess.js
    ctx.drawImage(bmp, 0, 0);
    return { rgba: ctx.getImageData(0, 0, w, h).data, w, h };
  }

  async function getSession() {
    if (session) return session;
    ort.env.wasm.wasmPaths = ORT_WASM_BASE;
    ort.env.wasm.numThreads = 1; // works without cross-origin isolation (GitHub Pages)
    session = await ort.InferenceSession.create(MODEL_URL, { executionProviders: ["wasm"] });
    return session;
  }

  async function analyze() {
    if (!file || !meta) return;
    const btn = $("scrGo");
    btn.disabled = true;
    show("", "Analyzing…", session ? "" : "Loading the model for the first time (about 15 MB).");
    try {
      const { rgba, w, h } = await decode(file);
      const size = meta.img_size || 224;
      const data = ScreeningPreprocess.toTensorData(rgba, w, h, size, meta.mean, meta.std);
      const s = await getSession();
      const out = await s.run({ input: new ort.Tensor("float32", data, [1, 3, size, size]) });
      const logit = out[s.outputNames[0]].data[0];
      const p = 1 / (1 + Math.exp(-logit));
      const flagged = p >= meta.threshold;
      show(flagged ? "warn" : "ok",
        flagged ? "Suspicious features detected" : "No suspicious features detected",
        "Model score " + pct(p) + " (flag threshold " + pct(meta.threshold) + "). This is not a diagnosis. Please discuss any concern with a doctor.");
    } catch (err) {
      show("", "Could not analyze the image", String((err && err.message) || err));
    } finally {
      btn.disabled = false;
    }
  }

  async function init() {
    const drop = $("scrDrop");
    $("scrFile").addEventListener("change", (e) => setFile(e.target.files[0]));
    ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
    ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
    drop.addEventListener("drop", (e) => setFile(e.dataTransfer.files[0]));
    $("scrGo").addEventListener("click", analyze);

    try {
      const r = await fetch(META_URL, { cache: "no-cache" });
      if (!r.ok) throw new Error("no model");
      meta = await r.json();
    } catch (e) {
      $("scrUnavailable").hidden = false;
      drop.classList.add("disabled");
      return;
    }
    if (meta.modality) $("scrModality").textContent = meta.modality;
    const t = meta.metrics && meta.metrics.test;
    if (t) {
      $("scrModelInfo").textContent =
        "Model performance on " + t.n + " held-out test images: sensitivity " + pct(t.sensitivity) +
        ", specificity " + pct(t.specificity) + ", AUC " + t.auc.toFixed(3) +
        (meta.metrics.patient_grouped ? "." : " (the split was not grouped by patient, so these figures may be optimistic).");
    }
    if (file) $("scrGo").disabled = false;
  }
  // mobile menu (script.js is built for the home page, so it is not loaded here)
  const mt = $("menuToggle"), nav = $("mainNav");
  if (mt && nav) mt.addEventListener("click", () => {
    mt.setAttribute("aria-expanded", String(nav.classList.toggle("open")));
  });
  init();
})();
