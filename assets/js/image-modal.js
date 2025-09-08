/**
 * Lets the user click on images to view them enlarged in a modal with a smooth transition.
 */
document.addEventListener("DOMContentLoaded", function () {
  const figures = document.querySelectorAll("figure.image img");
  if (!figures.length) return;

  figures.forEach((img) => {
    img.style.cursor = "zoom-in";
    img.addEventListener("click", function (e) {
      e.stopPropagation();
      openImageModal(img);
    });
  });

  /**
   * Opens the modal with a transition from the original image position.
   */
  function openImageModal(img) {
    const { clone, frame, aspectRatio } = createTransitionElements(img);
    hideOriginalImage(img);
    document.body.appendChild(frame);
    document.body.appendChild(clone);
    const modalData = { img, clone, frame, aspectRatio };
    requestAnimationFrame(() => animateToModal(modalData));
  }

  /**
   * Hides the original image for the duration of the modal.
   */
  function hideOriginalImage(img) {
    img.style.visibility = "hidden";
  }

  /**
   * Shows the original image after the modal is closed.
   */
  function showOriginalImage(img) {
    img.style.visibility = "visible";
  }

  /**
   * Creates a clone and a frame at the image's position.
   * @param {HTMLImageElement} img
   * @returns {{clone: HTMLElement, frame: HTMLElement, aspectRatio: number}}
   */
  function createTransitionElements(img) {
    const rect = img.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const aspectRatio = rect.width / rect.height;
    const clone = img.cloneNode();
    const frame = document.createElement("div");
    Object.assign(clone.style, {
      position: "absolute",
      left: `${rect.left + scrollX}px`,
      top: `${rect.top + scrollY}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      zIndex: 1001,
      margin: 0,
      borderRadius: getComputedStyle(img).borderRadius,
      boxShadow: getComputedStyle(img).boxShadow,
      transition: "all 0.35s ease-in-out",
      cursor: "zoom-out",
      background: "white",
      objectFit: "cover",
    });
    Object.assign(frame.style, {
      position: "absolute",
      left: `${rect.left + scrollX}px`,
      top: `${rect.top + scrollY}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      zIndex: 1000,
      borderRadius: getComputedStyle(img).borderRadius,
      boxSizing: "border-box",
      background: "transparent",
      pointerEvents: "none",
      transition: "opacity 0.35s ease-in-out",
    });
    return { clone, frame, aspectRatio };
  }

  /**
   * Animates the clone to the modal position and shows the backdrop.
   * @param {{img, clone, frame, aspectRatio}} modalData
   */
  function animateToModal(modalData) {
    const { clone, frame, aspectRatio } = modalData;
    const backdrop = createModalBackdrop();
    document.body.appendChild(backdrop);

    const { left, top, width, height } = getModalTargetRect(aspectRatio);
    Object.assign(clone.style, {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      borderRadius: "5px",
      boxShadow: "0 0.2em 1.2em #00000055",
      objectFit: "contain",
    });
    setTimeout(() => {
      frame.style.opacity = "0.2";
      enableModalClose(modalData, backdrop);
    }, 10);
  }

  /**
   * Creates the modal backdrop element.
   */
  function createModalBackdrop() {
    const backdrop = document.createElement("div");
    backdrop.className = "image-modal-backdrop";
    backdrop.style.opacity = "0";
    requestAnimationFrame(() => {
      backdrop.style.opacity = "1";
    });
    return backdrop;
  }

  /**
   * Enables closing the modal by click, scroll, or Escape.
   * @param {{img, clone, frame, aspectRatio: number}} modalData
   * @param backdrop
   */
  function enableModalClose(modalData, backdrop) {
    let closed = false;
    function closeModal() {
      if (closed) return;
      closed = true;
      animateBackToOrigin(modalData, backdrop);
      window.removeEventListener("scroll", closeModal);
      document.removeEventListener("keydown", onKeyDown);
      backdrop.removeEventListener("click", closeModal);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") closeModal();
    }
    window.addEventListener("scroll", closeModal, { once: true });
    document.addEventListener("keydown", onKeyDown);
    backdrop.addEventListener("click", closeModal);
    modalData.clone.addEventListener("click", closeModal);
  }

  /**
   * Returns the target rect for the modal image (centered, max 80vw/vh, preserves aspect ratio).
   * @param {number} aspectRatio
   */
  function getModalTargetRect(aspectRatio) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxW = vw * 0.8;
    const maxH = vh * 0.8;
    let width = maxW;
    let height = width / aspectRatio;
    if (height > maxH) {
      height = maxH;
      width = height * aspectRatio;
    }
    return {
      left: (vw - width) / 2 + window.scrollX,
      top: (vh - height) / 2 + window.scrollY,
      width,
      height,
    };
  }

  /**
   * Animates the image back to its original position and cleans up.
   * @param {{img: HTMLImageElement, clone: HTMLElement, frame: HTMLElement, aspectRatio: number}} modalData
   * @param {HTMLElement} backdrop
   */
  function animateBackToOrigin(modalData, backdrop) {
    const { img, clone, frame } = modalData;
    const rect = img.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    Object.assign(clone.style, {
      left: `${rect.left + scrollX}px`,
      top: `${rect.top + scrollY}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      borderRadius: getComputedStyle(img).borderRadius,
      boxShadow: getComputedStyle(img).boxShadow,
      objectFit: "cover",
    });

    frame.style.opacity = "1";
    backdrop.style.opacity = "0";

    setTimeout(() => {
      clone.remove();
      frame.remove();
      backdrop.remove();
      showOriginalImage(img);
    }, 350);
  }
});
