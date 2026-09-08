/**
 * Dodo Payments inline checkout for the store product page.
 *
 * This site is fully static (Jekyll on Cloudflare Pages), so there is no server to
 * create a Checkout Session on. We therefore use the SDK's static-link mode, which
 * points the frame straight at a product: `{base}/inline/buy/{productId}`. No API key
 * is involved — a product id is public information, and the payment itself is handled
 * entirely inside the Dodo frame, which is the merchant of record.
 *
 * Note: `linkType: "static"` and the `products` option are deprecated in the SDK and
 * are scheduled to be removed in v2.0.0, where every flow needs a server-created
 * session. `dodopayments-checkout` is therefore pinned to an exact version; revisit
 * this before bumping to v2.
 *
 * Nothing is loaded from dodopayments.com until the reader presses "Buy"
 * (Art. 6 (1) (a) GDPR, § 25 (1) TDDDG).
 *
 * "Buy" stays disabled until every `[data-agree]` box is ticked, which is what records
 * acceptance of the terms and of the documented product limitations (§ 327h BGB) before
 * an order can be placed.
 */

import { DodoPayments } from "dodopayments-checkout";
import type { CheckoutEvent, CheckoutMode } from "dodopayments-checkout";

const CONTAINER_ID = "dodo-inline-checkout";

/** Matches the transition duration of `.store-checkout` in `_checkout.scss`. */
const EXPAND_MS = 420;

/**
 * The frame reports readiness via `checkout.form_ready`. Should a frame version ever
 * stop emitting it, reveal the form anyway rather than spinning forever.
 */
const READY_FALLBACK_MS = 6000;

/** Frame events that mean the form has painted and can be revealed. */
const READY_EVENTS = new Set(["checkout.form_ready", "checkout.payment_page_opened"]);

document.addEventListener("DOMContentLoaded", () => {
  const purchase = document.querySelector<HTMLElement>("[data-dodo-product]");
  const button = document.querySelector<HTMLButtonElement>("[data-buy]");
  const panel = document.querySelector<HTMLElement>("[data-checkout]");
  const status = document.querySelector<HTMLElement>("[data-checkout-status]");
  const closeButton = document.querySelector<HTMLButtonElement>("[data-checkout-close]");
  const notice = document.querySelector<HTMLElement>("[data-checkout-notice]");
  const spinner = document.querySelector<HTMLElement>("[data-checkout-spinner]");
  const frame = document.getElementById(CONTAINER_ID);
  const agreements = Array.from(
    document.querySelectorAll<HTMLInputElement>("[data-agree]"),
  );
  const agreeHint = document.querySelector<HTMLElement>("[data-agree-hint]");
  if (!purchase || !button || !panel || !status || !closeButton) return;
  if (!notice || !spinner || !frame) return;

  const productId = purchase.dataset.dodoProduct;
  const mode = purchase.dataset.dodoMode === "live" ? "live" : "test";

  // The live product id is only filled in once the product goes live, so fail loudly
  // here rather than letting the SDK throw on an empty id.
  if (!productId) {
    button.disabled = true;
    show(status, "The checkout is not configured yet. Please try again later.");
    return;
  }

  let opened = false;
  let readyTimer = 0;
  let sweepTimer = 0;

  /**
   * Enables "Buy" exactly when every box is ticked and no checkout is open yet.
   */
  const syncGate = (): void => {
    const agreed = agreements.every(box => box.checked);
    button.disabled = opened || !agreed;
    if (agreeHint) agreeHint.hidden = agreed;
  };

  for (const box of agreements) {
    // A reloaded page can restore ticks the browser remembered, so read the boxes
    // rather than assuming they start empty.
    box.addEventListener("change", syncGate);
  }
  syncGate();

  /** Swaps the spinner for the payment frame once the frame has painted. */
  const reveal = (): void => {
    window.clearTimeout(readyTimer);
    spinner.hidden = true;
    frame.dataset.ready = "";
  };

  /**
   * Collapses the panel.
   *
   * Once collapsed, the checkout panel is removed from the DOM.
   */
  const collapse = (): void => {
    delete panel.dataset.open;
    sweepTimer = window.setTimeout(() => frame.replaceChildren(), EXPAND_MS);
  };

  button.addEventListener("click", () => {
    if (opened) return;
    opened = true;

    window.clearTimeout(sweepTimer);
    syncGate();
    notice.hidden = true;
    spinner.hidden = false;
    delete frame.dataset.ready;
    panel.dataset.open = "";

    readyTimer = window.setTimeout(reveal, READY_FALLBACK_MS);

    try {
      openCheckout(productId, mode, status, reveal);
    }
    catch (error) {
      console.error("Dodo Payments checkout failed to open:", error);
      window.clearTimeout(readyTimer);
      opened = false;
      syncGate();
      notice.hidden = false;
      collapse();
      show(status, "The checkout could not be opened. Please try again.");
    }
  });

  closeButton.addEventListener("click", () => {
    window.clearTimeout(readyTimer);
    DodoPayments.Checkout.close();
    collapse();
    hide(status);
    notice.hidden = false;
    opened = false;
    syncGate();
    button.focus();
  });
});

/**
 * Initializes the SDK and mounts the checkout frame into the panel.
 */
function openCheckout(
  productId: string,
  mode: CheckoutMode,
  status: HTMLElement,
  onReady: () => void,
): void {
  DodoPayments.Initialize({
    mode,
    displayType: "inline",
    linkType: "static",
    onEvent: (event: CheckoutEvent) => onCheckoutEvent(event, status, onReady),
  });

  DodoPayments.Checkout.open({
    products: [{ productId, quantity: 1 }],
    elementId: CONTAINER_ID,
    options: {
      showSecurityBadge: true,
      fontSize: "md",
    },
  });
}

/**
 * Reveals the frame once it is ready and surfaces errors to the reader; everything else
 * stays inside the frame, which renders its own confirmation once a payment succeeds.
 */
function onCheckoutEvent(
  event: CheckoutEvent,
  status: HTMLElement,
  onReady: () => void,
): void {
  if (READY_EVENTS.has(event.event_type)) {
    onReady();
    return;
  }

  if (event.event_type === "checkout.error") {
    console.error("Dodo Payments checkout error:", event.data);
    onReady();
    show(status, "Something went wrong with the checkout. Please try again.");
    return;
  }

  if (event.event_type === "checkout.link_expired") {
    onReady();
    show(status, "This checkout expired. Please reload the page and try again.");
  }
}

function show(element: HTMLElement, message: string): void {
  element.textContent = message;
  element.hidden = false;
}

function hide(element: HTMLElement): void {
  element.hidden = true;
}

export {};
