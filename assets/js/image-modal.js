/**
 * Lets the user click on images to view them enlarged in a modal.
 */
document.addEventListener("DOMContentLoaded", function () {
  const figures = document.querySelectorAll("figure.image img");
  if (!figures.length) return;

  figures.forEach((img) => {
    img.style.cursor = "zoom-in";
    img.addEventListener("click", function (e) {
      e.stopPropagation();
      showImageModal(img.src, img.alt || "");
    });
  });

  function showImageModal(src, alt) {
    const backdrop = document.createElement("div");
    backdrop.className = "image-modal-backdrop";

    const modalImg = document.createElement("img");
    modalImg.className = "image-modal-img";
    modalImg.src = src;
    modalImg.alt = alt;
    backdrop.appendChild(modalImg);
    document.body.appendChild(backdrop);

    function closeModal() {
      backdrop.remove();
      document.removeEventListener("keydown", onKeyDown);
    }

    function onKeyDown(e) {
      if (e.key === "Escape") closeModal();
    }

    backdrop.addEventListener("click", closeModal);
    modalImg.addEventListener("click", closeModal);
    document.addEventListener("keydown", onKeyDown);
  }
});
