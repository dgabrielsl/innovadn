(function () {
  "use strict";

  var THUMB_SELECTOR = ".project-modal__shot img";
  var LOCK_CLASS = "project-modal-lock"; // misma clase que usa modal.js
  var OPEN_CLASS = "is-open";

  var viewer = document.getElementById("project-image-viewer");
  if (!viewer) return; // el componente aún no fue pegado en la página

  var overlayDialog = viewer.querySelector(".project-image-viewer__dialog");
  var imageEl = viewer.querySelector(".project-image-viewer__image");
  var captionEl = viewer.querySelector(".project-image-viewer__caption");
  var closeBtn = viewer.querySelector(".project-image-viewer__close");

  var lastTrigger = null;
  var lockedByViewer = false;
  var scrollY = 0;

  /* ---------- marcar visualmente las miniaturas como interactivas ---------- */
  function markThumbnails() {
    document.querySelectorAll(THUMB_SELECTOR).forEach(function (img) {
      img.classList.add("project-modal__shot--zoomable");
    });
  }

  /* ---------- bloqueo de scroll (solo si nadie más lo bloqueó ya) ---------- */
  function lockScrollIfNeeded() {
    if (document.documentElement.classList.contains(LOCK_CLASS)) {
      // El modal de caso de estudio ya bloqueó el scroll: no duplicar.
      lockedByViewer = false;
      return;
    }
    scrollY = window.scrollY || window.pageYOffset || 0;
    document.documentElement.classList.add(LOCK_CLASS);
    document.body.style.top = "-" + scrollY + "px";
    lockedByViewer = true;
  }

  function unlockScrollIfNeeded() {
    if (!lockedByViewer) return; // el caso de estudio sigue abierto debajo
    document.documentElement.classList.remove(LOCK_CLASS);
    document.body.style.top = "";
    window.scrollTo(0, scrollY);
    lockedByViewer = false;
  }

  /* ---------- ESC con prioridad sobre el modal de caso de estudio ----------
     Se escucha en fase de captura sobre "window", que se dispara antes que
     el listener de modal.js (registrado sobre "document"), evitando así
     tener que modificar modal.js. */
  function onWindowKeydown(event) {
    if (event.key === "Escape" || event.key === "Esc") {
      event.preventDefault();
      event.stopPropagation();
      closeViewer();
      return;
    }
    if (event.key === "Tab") {
      // Único elemento enfocable dentro del visor: el botón de cierre.
      event.preventDefault();
      closeBtn.focus();
    }
  }

  /* ---------- abrir / cerrar ---------- */
  function openViewer(img) {
    if (!img || !img.src) return;

    lastTrigger = img;
    imageEl.src = img.currentSrc || img.src;
    imageEl.alt = img.alt || "";
    captionEl.textContent = img.alt || "";

    viewer.hidden = false;
    lockScrollIfNeeded();

    requestAnimationFrame(function () {
      viewer.classList.add(OPEN_CLASS);
    });

    overlayDialog.focus();
    window.addEventListener("keydown", onWindowKeydown, true);
  }

  function closeViewer() {
    if (viewer.hidden) return;

    viewer.classList.remove(OPEN_CLASS);
    window.removeEventListener("keydown", onWindowKeydown, true);
    unlockScrollIfNeeded();

    var finished = false;
    var finish = function () {
      if (finished) return;
      finished = true;
      viewer.hidden = true;
      imageEl.src = "";
      imageEl.alt = "";
      captionEl.textContent = "";
      if (lastTrigger && typeof lastTrigger.focus === "function") {
        lastTrigger.setAttribute("tabindex", "-1");
        lastTrigger.focus();
        lastTrigger.removeAttribute("tabindex");
      }
      lastTrigger = null;
    };

    overlayDialog.addEventListener("transitionend", finish, { once: true });
    setTimeout(finish, 300); // respaldo si prefers-reduced-motion anula la transición
  }

  /* ---------- delegación de eventos: funciona con imágenes futuras ---------- */
  document.addEventListener("click", function (event) {
    var img = event.target.closest ? event.target.closest(THUMB_SELECTOR) : null;
    if (img) {
      event.preventDefault();
      openViewer(img);
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    var img = event.target.closest ? event.target.closest(THUMB_SELECTOR) : null;
    if (img) {
      event.preventDefault();
      openViewer(img);
    }
  });

  viewer.addEventListener("click", function (event) {
    if (event.target.closest("[data-viewer-close]")) {
      closeViewer();
    }
  });

  /* ---------- inicialización ---------- */
  function init() {
    markThumbnails();

    // Las miniaturas dentro de <figure><span><img></span></figure> no son
    // focusables por defecto: se agrega tabindex para permitir abrirlas
    // con teclado (Enter / Espacio) sin tocar el HTML existente.
    document.querySelectorAll(THUMB_SELECTOR).forEach(function (img) {
      if (!img.hasAttribute("tabindex")) img.setAttribute("tabindex", "0");
      if (!img.hasAttribute("role")) img.setAttribute("role", "button");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
