/**
 * project-modal — InnovADN
 * Lógica de apertura/cierre para los modales de "caso de estudio".
 *
 * Convención de IDs (para poder duplicar el componente sin tocar JS):
 *   enlace  #project-link-N   (clase .project-link, ya existe en la landing)
 *   modal   #project-modal-N  (mismo N, generado a partir del ID del enlace)
 *
 * No requiere dependencias externas.
 */
(function () {
  "use strict";

  var LOCK_CLASS = "project-modal-lock";
  var OPEN_CLASS = "is-open";
  var FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

  var activeModal = null; // objeto de estado del modal abierto actualmente
  var scrollY = 0;

  function getModalForLink(link) {
    if (!link.id) return null;
    var modalId = link.id.replace("project-link", "project-modal");
    if (modalId === link.id) return null; // el ID no sigue la convención esperada
    return document.getElementById(modalId);
  }

  function lockScroll() {
    scrollY = window.scrollY || window.pageYOffset || 0;
    document.documentElement.classList.add(LOCK_CLASS);
    document.body.style.top = "-" + scrollY + "px";
  }

  function unlockScroll() {
    document.documentElement.classList.remove(LOCK_CLASS);
    document.body.style.top = "";
    window.scrollTo(0, scrollY);
  }

  function trapFocus(event, container) {
    if (event.key !== "Tab") return;

    var focusable = Array.prototype.slice.call(
      container.querySelectorAll(FOCUSABLE_SELECTOR)
    );
    if (focusable.length === 0) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function onKeydown(event) {
    if (!activeModal) return;
    if (event.key === "Escape" || event.key === "Esc") {
      event.preventDefault();
      closeModal();
    } else {
      trapFocus(event, activeModal.dialog);
    }
  }

  function openModal(modal, trigger) {
    if (activeModal) closeModal(true);

    var dialog = modal.querySelector(".project-modal__dialog");
    if (!dialog) return;

    activeModal = { modal: modal, dialog: dialog, trigger: trigger };

    modal.hidden = false;
    lockScroll();

    // Se agrega la clase en el siguiente frame para que la transición CSS se dispare.
    requestAnimationFrame(function () {
      modal.classList.add(OPEN_CLASS);
    });

    dialog.focus();
    document.addEventListener("keydown", onKeydown, true);
  }

  function closeModal(immediate) {
    if (!activeModal) return;
    var modal = activeModal.modal;
    var trigger = activeModal.trigger;

    modal.classList.remove(OPEN_CLASS);
    document.removeEventListener("keydown", onKeydown, true);
    unlockScroll();

    var finish = function () {
      modal.hidden = true;
      if (trigger && typeof trigger.focus === "function") {
        trigger.focus();
      }
    };

    if (immediate) {
      finish();
    } else {
      var dialog = modal.querySelector(".project-modal__dialog");
      var handled = false;
      var onEnd = function () {
        if (handled) return;
        handled = true;
        dialog.removeEventListener("transitionend", onEnd);
        finish();
      };
      if (dialog) {
        dialog.addEventListener("transitionend", onEnd);
        // Respaldo por si prefers-reduced-motion desactiva la transición.
        setTimeout(onEnd, 300);
      } else {
        finish();
      }
    }

    activeModal = null;
  }

  function init() {
    var links = document.querySelectorAll(".project-link");

    links.forEach(function (link) {
      var modal = getModalForLink(link);
      if (!modal) return;

      link.addEventListener("click", function (event) {
        event.preventDefault();
        openModal(modal, link);
      });

      modal.addEventListener("click", function (event) {
        if (event.target.closest("[data-modal-close]")) {
          closeModal();
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
