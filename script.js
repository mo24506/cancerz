const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

menuToggle?.addEventListener("click", () => {
  const open = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll(".main-nav a").forEach(a => {
  a.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

const filters = document.querySelectorAll(".filter");
const courseCards = document.querySelectorAll(".course-card");

filters.forEach(filter => {
  filter.addEventListener("click", () => {
    filters.forEach(f => f.classList.remove("active"));
    filter.classList.add("active");
    const selected = filter.dataset.filter;

    courseCards.forEach(card => {
      const show = selected === "all" || card.dataset.category === selected;
      card.classList.toggle("hidden", !show);
    });
  });
});

const descriptions = {
  "Foundations of Cancer Biology": "A structured introduction to the biological principles that explain how cancer begins, progresses, and responds to intervention.",
  "AI for Biotechnology": "A practical introduction to using AI-assisted methods to explore biological questions, organize information, and design smarter workflows.",
  "Research Skills Lab": "A hands-on pathway covering literature search, critical reading, study design, scientific writing, and presenting your work.",
  "Molecular Oncology": "Dive deeper into genomic changes, molecular pathways, biomarkers, resistance, and the logic behind precision oncology.",
  "Bioinformatics Starter": "Learn the mental models behind sequence data, biological databases, analysis pipelines, and reproducible computational work.",
  "Scientific Communication": "Turn scientific ideas into clear posters, slides, abstracts, visual summaries, and stories that make sense to your audience."
};

const modal = document.getElementById("courseModal");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const modalEnroll = document.getElementById("modalEnroll");

function openCourse(name) {
  modalTitle.textContent = name;
  modalDescription.textContent = descriptions[name] || "A practical online learning experience from CancerZ Academy.";
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeCourse() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

document.querySelectorAll("[data-course]").forEach(button => {
  button.addEventListener("click", () => openCourse(button.dataset.course));
});

document.querySelectorAll("[data-close-modal]").forEach(el => {
  el.addEventListener("click", closeCourse);
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeCourse();
});

modalEnroll?.addEventListener("click", () => {
  closeCourse();
  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
});

const signup = document.getElementById("signupForm");
const message = document.getElementById("formMessage");

signup?.addEventListener("submit", e => {
  e.preventDefault();
  message.textContent = "Thanks — you're on the list. This demo form is ready to connect to your email platform.";
  signup.reset();
});


// ---------- Cancer Biology webinar library ----------
const webinarModal = document.getElementById("webinarModal");
const webinarList = document.getElementById("webinarList");
const webinarInput = document.getElementById("webinarVideoInput");
const webinarPlayer = document.getElementById("webinarPlayer");
const trackCard = document.querySelector('[data-track="Cancer Biology"]');

const defaultWebinar = {
  title: "Introduction to Cancer Biology",
  category: "CANCER BIOLOGY",
  description: "Upload your first webinar video to replace this demo item."
};

function openWebinars() {
  webinarModal?.classList.add("open");
  webinarModal?.setAttribute("aria-hidden", "false");
}

function closeWebinars() {
  webinarModal?.classList.remove("open");
  webinarModal?.setAttribute("aria-hidden", "true");
  if (webinarPlayer) {
    webinarPlayer.pause();
    webinarPlayer.removeAttribute("src");
    webinarPlayer.hidden = true;
    webinarPlayer.load();
  }
}

trackCard?.addEventListener("click", (event) => {
  if (event.target.closest("button") || event.currentTarget === trackCard) {
    openWebinars();
  }
});

trackCard?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openWebinars();
  }
});

document.querySelectorAll("[data-close-webinar]").forEach(el => {
  el.addEventListener("click", closeWebinars);
});

function renderUploadedWebinar(file) {
  const url = URL.createObjectURL(file);

  webinarList.innerHTML = `
    <article class="webinar-item webinar-uploaded">
      <div class="webinar-thumbnail">
        <span>UPLOADED</span>
      </div>
      <div class="webinar-info">
        <div class="webinar-topline">
          <span class="pill teal">WEBINAR</span>
          <span>${Math.max(1, Math.round(file.size / 1024 / 1024))} MB</span>
        </div>
        <h3>${file.name.replace(/[<>&"]/g, "")}</h3>
        <p>Your uploaded webinar is ready to watch.</p>
        <button class="text-btn play-uploaded-btn" type="button">Watch webinar →</button>
      </div>
    </article>
  `;

  const playButton = webinarList.querySelector(".play-uploaded-btn");
  playButton?.addEventListener("click", () => {
    webinarPlayer.hidden = false;
    webinarPlayer.src = url;
    webinarPlayer.play().catch(() => {});
  });
}

webinarInput?.addEventListener("change", () => {
  const file = webinarInput.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("video/")) {
    alert("Please choose a video file.");
    webinarInput.value = "";
    return;
  }

  renderUploadedWebinar(file);
  webinarPlayer.hidden = false;
  webinarPlayer.src = URL.createObjectURL(file);
  webinarPlayer.load();
});

document.querySelector(".demo-webinar-btn")?.addEventListener("click", () => {
  if (!webinarPlayer) return;
  webinarPlayer.hidden = false;
  webinarPlayer.removeAttribute("src");
  webinarPlayer.poster = "";
  alert("This is a demo webinar card. Use “+ Upload webinar” to add your real video.");
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeWebinars();
});
