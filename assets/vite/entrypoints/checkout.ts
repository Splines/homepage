/**
 * Checkout hand-off for the store product page.
 *
 * This site is fully static (Jekyll on Cloudflare Pages), so there is no server to
 * create a Dodo Payments Checkout Session on. We therefore use a *static payment
 * link* — `https://{host}/buy/{productId}`, built in `_layouts/store.html` — and
 * simply open Dodo's hosted checkout in a new tab. Dodo Payments is the merchant of
 * record; the payment happens entirely on their page.
 */

document.addEventListener("DOMContentLoaded", () => {
  const purchase = document.querySelector<HTMLElement>("[data-checkout-url]");
  const button = document.querySelector<HTMLButtonElement>("[data-buy]");
  const status = document.querySelector<HTMLElement>("[data-checkout-status]");
  const agreements = Array.from(
    document.querySelectorAll<HTMLInputElement>("[data-agree]"),
  );
  const agreeHint = document.querySelector<HTMLElement>("[data-agree-hint]");
  if (!purchase || !button || !status) return;

  const checkoutUrl = purchase.dataset.checkoutUrl;

  // The live product id is only filled in once the product goes live, so fail loudly
  // here rather than opening a blank tab.
  if (!checkoutUrl) {
    button.disabled = true;
    show(status, "The checkout is not configured yet. Please try again later.");
    return;
  }

  /**
   * Enables "Buy" exactly when every box is ticked, and hides the nudge once there is
   * nothing left to confirm.
   */
  const syncGate = (): void => {
    const agreed = agreements.every(box => box.checked);
    button.disabled = !agreed;
    if (agreeHint) agreeHint.hidden = agreed;
  };

  for (const box of agreements) {
    // A reloaded page can restore ticks the browser remembered, so read the boxes
    // rather than assuming they start empty.
    box.addEventListener("change", syncGate);
  }
  syncGate();

  button.addEventListener("click", () => {
    // avoid reverse tabnabbing
    const tab = window.open("about:blank", "_blank");

    if (tab === null) {
      // Offer a link to open the checkout in case the browser blocked the new tab.
      showWithLink(
        status,
        "Your browser blocked the checkout tab.",
        checkoutUrl,
        "Open the checkout",
      );
      return;
    }

    tab.opener = null;
    tab.location = checkoutUrl;
    hide(status);
  });
});

function show(element: HTMLElement, message: string): void {
  element.textContent = message;
  element.hidden = false;
}

function showWithLink(
  element: HTMLElement,
  message: string,
  href: string,
  label: string,
): void {
  const link = document.createElement("a");
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = label;

  element.replaceChildren(`${message} `, link);
  element.hidden = false;
}

function hide(element: HTMLElement): void {
  element.hidden = true;
}

export {};
