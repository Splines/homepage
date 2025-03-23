// eslint-disable-next-line no-unused-vars
function navigateBack() {
  const referrer = new URL(document.referrer);
  if (referrer.hostname === window.location.hostname) {
    history.back();
    return false;
  }

  return true; // use href attribute
}
