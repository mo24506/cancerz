/* CancerZ Diagnostics panel: in-browser breast imaging screening.
   Model files (produced by train.py): diagnostics/model.onnx + diagnostics/model_meta.json
   Nothing is uploaded: the image is decoded and scored locally. */
(function () {
  const ORT_SRC = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/ort.min.js";
  const ORT_WASM_BASE = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/";
  const MODEL_URL = "diagnostics/model.onnx";
  const META_URL = "diagnostics/model_meta.json";
  const MAX_PIXELS = 40e6;
  const MAX_BYTES = 25 * 1024 * 1024;

  const $ = (id) => document.getElementById(id);
  if (!$("dxDrop")) return;
  let meta = null, session = null, file = null, previewUrl = null;

  const pct = (x, d = 1) => (x * 100).toFixed(d) + "%";

  function showMsg(text) {
    const r = $("dxResult");
    r.hidden = false; r.className = "dx-result";
    $("dxLabel").textContent = "STATUS";
    $("dxVerdict").textContent = text.title;
    $("dxMeter").hidden = true; $("dxMeterLabel").hidden = true;
    $("dxNext").textContent = text.body || "";
  }

  function showResult(p) {
    const flagged = p >= meta.threshold;
    const r = $("dxResult");
    r.hidden = false; r.className = "dx-result " + (flagged ? "warn" : "ok");
    $("dxLabel").textContent = "AI SCREENING RESULT";
    $("dxVerdict").textContent = flagged ? "Suspicious features detected" : "No suspicious features detected";
    $("dxMeter").hidden = false; $("dxMeterLabel").hidden = false;
    $("dxBar").style.width = Math.max(2, Math.min(100, p * 100)) + "%";
    $("dxThr").style.left = Math.max(0, Math.min(100, meta.threshold * 100)) + "%";
    $("dxScore").textContent = "Model score " + pct(p);
    $("dxThrLabel").textContent = "Flag threshold " + pct(meta.threshold);
    $("dxNext").textContent = flagged
      ? "Next step: please see a doctor or breast specialist soon and bring your imaging report. This result is not a diagnosis, and many flagged images turn out to be harmless."
      : "Next step: keep up routine screening, and see a doctor if you notice any change or symptom. A normal AI result does not rule out cancer.";
    $("dxAgain").hidden = false;
  }

  function setFile(f) {
    if (!f) return;
    if (!/^image\/(png|jpeg)$/.test(f.type)) { showMsg({ title: "Unsupported file", body: "Please choose a PNG or JPG image." }); return; }
    if (f.size > MAX_BYTES) { showMsg({ title: "File too large", body: "Please choose an image under 25 MB." }); return; }
    file = f;
    $("dxDropText").textContent = f.name;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(f);
    $("dxPreview").src = previewUrl; $("dxPreview").hidden = false;
    $("dxGo").disabled = !meta;
    $("dxResult").hidden = true; $("dxAgain").hidden = true;
  }

  function reset() {
    file = null;
    $("dxFile").value = "";
    $("dxDropText").textContent = "Click to choose an image, or drag it here";
    $("dxPreview").hidden = true; $("dxResult").hidden = true; $("dxAgain").hidden = true;
    $("dxGo").disabled = true;
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

  // onnxruntime-web (~0.5 MB) and the model (~15 MB) are only downloaded when the user clicks Analyze
  function loadOrt() {
    if (window.ort) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = ORT_SRC; s.onload = res; s.onerror = () => rej(new Error("Could not load the analysis engine. Check your connection and try again."));
      document.head.appendChild(s);
    });
  }

  async function getSession() {
    if (session) return session;
    await loadOrt();
    ort.env.wasm.wasmPaths = ORT_WASM_BASE;
    ort.env.wasm.numThreads = 1; // works without cross-origin isolation (GitHub Pages)
    session = await ort.InferenceSession.create(MODEL_URL, { executionProviders: ["wasm"] });
    return session;
  }

  async function analyze() {
    if (!file || !meta) return;
    const btn = $("dxGo");
    btn.disabled = true;
    showMsg({ title: "Analyzing…", body: session ? "" : "Loading the model for the first time. This can take a few seconds." });
    try {
      const { rgba, w, h } = await decode(file);
      const size = meta.img_size || 224;
      const data = ScreeningPreprocess.toTensorData(rgba, w, h, size, meta.mean, meta.std);
      const s = await getSession();
      const out = await s.run({ input: new ort.Tensor("float32", data, [1, 3, size, size]) });
      const logit = out[s.outputNames[0]].data[0];
      showResult(1 / (1 + Math.exp(-logit)));
    } catch (err) {
      showMsg({ title: "Could not analyze the image", body: String((err && err.message) || err) });
    } finally {
      btn.disabled = false;
    }
  }

  async function init() {
    const drop = $("dxDrop");
    $("dxFile").addEventListener("change", (e) => setFile(e.target.files[0]));
    ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
    ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
    drop.addEventListener("drop", (e) => setFile(e.dataTransfer.files[0]));
    $("dxGo").addEventListener("click", analyze);
    $("dxAgain").addEventListener("click", reset);

    try {
      const r = await fetch(META_URL, { cache: "no-cache" });
      if (!r.ok) throw new Error("no model");
      meta = await r.json();
    } catch (e) {
      $("dxUnavailable").hidden = false;
      drop.classList.add("disabled");
      return;
    }
    if (meta.modality) document.querySelectorAll(".dx-modality").forEach((el) => { el.textContent = meta.modality; });
    const t = meta.metrics && meta.metrics.test;
    if (t) {
      $("dxModel").textContent =
        "Model performance on " + t.n + " held-out test images: sensitivity " + pct(t.sensitivity) +
        ", specificity " + pct(t.specificity) + ", AUC " + t.auc.toFixed(3) +
        (meta.metrics.patient_grouped ? "." : " (not grouped by patient, so figures may be optimistic).");
    }
    if (file) $("dxGo").disabled = false;
  }
  init();
})();
