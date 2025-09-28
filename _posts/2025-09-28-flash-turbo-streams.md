---
layout: page
title: "Rails Flash messages via Turbo Streams"
title_on_page: "Rails Flash messages<br>via Turbo Streams"
code: true
excerpt: >
  How to render Rails Flash messages via Turbo Streams, while still allowing usual redirects to show Flash messages. This is really quick to set up.
---

<video controls width="100%">
  <source src="/assets/blog/2025-flash-turbo-streams/flash-message-streamed.mp4" type="video/mp4" />
</video>

_For this article, I was inspired by [this](https://hivekind.com/blog/exploring-flash-messages-with-turbo-streams-in-rails-7), [this](https://bramjetten.dev/articles/flash-messages-with-hotwire-and-turbo-streams) and [this](https://thoughtbot.com/blog/rails-flashes-guide) post where you might find additional and alternative approaches._

## Introduction

Flash messages are a great way to provide direct user feedback, e.g. after submitting a form. The [`ActionDispatch::Flash` docs](https://api.rubyonrails.org/classes/ActionDispatch/Flash.html) tell us:

> The flash provides a way to pass temporary primitive-types (`String`, `Array`, `Hash`) between actions. Anything you place in the flash will be exposed to the very next action and then cleared out. This is a great way of doing notices and alerts, such as a create action that sets `flash[:notice] = "Post successfully created"` before redirecting to a display action [...].

But with [Hotwire](https://hotwired.dev/) being a thing now, you don't always want to redirect and disrupt the user experience. Instead, why not render the flash message directly on the page? Usually, this would require making a custom AJAX request upon clicking on "Submit", then checking the result and reacting accordingly, e.g. by rendering the flash message with JavaScript. But you'd have to do that for every single flash message and this feels like a task that would be reused a lot of times. Luckily, we have [Turbo Streams](https://turbo.hotwired.dev/handbook/streams):

> Turbo Streams deliver page changes as fragments of HTML wrapped in `<turbo-stream>` elements. Each stream element specifies an action together with a target ID to declare what should happen to the HTML inside it.

```html
<turbo-stream action="prepend" target="messages">
  <template>
    <div id="message_1">
      This div will be prepended to the element with the DOM ID "messages".
    </div>
  </template>
</turbo-stream>
```

As you should always [double-check](https://turbo.hotwired.dev/handbook/streams#progressively-enhance-when-necessary) whether you really need Turbo Streams, here is the justification: if we were to only use Turbo Frames, we'd have to re-render all messages, even those that might already be shown. But in our controllers, we only know about the current, new message, so a Turbo Stream to prepend or append to a message list seems like a good choice.


## Render Flash messages partials

First, we have to render our flash messages. The application layout is a good place since possibly every page might want to show such transient messages. We give the flash-messages container an id to be referenced by our Turbo Streams later on.

```erb
// +++FILENAME+++ frontend/layouts/application.html.erb
<body>
  <%= render partial: "flash/messages" %>
  <!-- And here comes the rest of your app -->
</body>
```

```erb
// +++FILENAME+++ frontend/flash/_messages.html.erb
<div class="container-max-md" id="flash-messages">
  <!-- might be prepended by Turbo Streams -->
  <%= render partial: "flash/message" %>
</div>
```

The classes used here are Bootstrap-specific (see [Alerts](https://getbootstrap.com/docs/5.3/components/alerts/)), but you can of course use whatever you want, e.g. Tailwind or your fully-custom styling. Don't forget the [`aria-live`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-live) attribute for accessibility.

```erb
// +++FILENAME+++ frontend/flash/_message.html.erb
<% if flash[:notice] %>
  <div class="alert alert-primary alert-dismissible fade show d-flex align-items-center"
       role="alert" aria-live="polite" tabindex="-1">
    <!-- "bi" stands for Bootstrap Icons that you might have to import -->
    <i class="bi bi-info-circle-fill flex-shrink-0 me-2"></i>
    <div><%= sanitize flash[:notice], :tags => %w(br) %></div>
    <button type="button" class="btn-close" aria-label="Close" data-bs-dismiss="alert"></button>
  </div>
<% end %>

<!-- And similarly for flash[:alert] or whatever you want to use -->
```

With this setup, we only render one flash message per type (`:notice`, `:alert` etc.). I feel like that's a good limitation to not overwhelm your users. But you can of course iterate over flash messages via `<% flash.each do |type, message| %>...<% end %>`.

Finally, let's always show them in the middle on top of everything else:

```scss
// +++FILENAME+++ frontend/entrypoints/application.scss
#flash-messages {
  z-index: 100000;
  position: fixed;
  top: 5%;
  left: 50%;
  transform: translate(-50%, -5%);
}
```


## Render Flash messages as controller response

The only thing you have to do is render a Turbo Stream in your controller, while referencing our div with id `flash-messages`. And set the flash message beforehand.

```rb
flash.now[:success] = "Thank's a lot for your feedback! We will review it soon."
render turbo_stream: turbo_stream.prepend("flash-messages", partial: "flash/message")
```

Maybe wrap that inside its own function such that you don't always have to remember the id `flash-messages`.

```rb
// +++FILENAME+++ controllers/application_controller.rb
class ApplicationController < ActionController::Base
  include Flash
end
```

```rb
// +++FILENAME+++ controllers/flash.rb
# Helpers for managing flash messages in controllers.
module Flash
  # Renders a flash message via Turbo Stream.
  #
  # Usage:
  # You can use :notice, :success, :alert and :error, see flash/_message.html.erb
  # > flash.now[:success] = "Profile updated"
  # > render_flash
  def render_flash
    return if flash.empty?

    render turbo_stream: turbo_stream.prepend("flash-messages", partial: "flash/message")
  end

  # Renders a flash success message for turbo_stream and html formats.
  # Usage: respond_with_flash_success(I18n.t("feedback.success"))
  def respond_with_flash_success(message, fallback_location: root_path)
    respond_to do |format|
      format.turbo_stream do
        flash.now[:success] = message
        render_flash
      end
      format.html do
        flash.keep[:success] = message
        redirect_back(fallback_location: fallback_location)
      end
    end
  end
end
```

With this, Rails might send something like the following response back to the browser, where the Turbo Stream JavaScript code (inside the Hotwire JS library) will intercept the request and do its job, i.e. prepend what we've sent to the element with the respective id.

```html
// +++FILENAME+++ Controller Turbo Stream response
<turbo-stream action="prepend" target="flash-messages">
  <template>
    <div class="alert alert-primary alert-dismissible fade show d-flex align-items-center"
       role="alert" aria-live="polite" tabindex="-1">
      <i class="bi bi-info-circle-fill flex-shrink-0 me-2"></i>
      <div>Thanks a lot for your feedback! We will review it soon.</div>
      <button type="button" class="btn-close" aria-label="Close" data-bs-dismiss="alert"></button>
    </div>
  </template>
</turbo-stream>
```

In the controller, we also respond to `format.html` in case the user has JavaScript turned off. Note that you have to use `flash.keep` instead of `flash.now` then, in order for the flash message to survive the back-redirection. But honestly, the `format.html` block is a bit of a farce here, since without JS, our users couldn't even open up the Bootstrap Modal that talks to this controller in the first place 😅 So maybe a better alternative, is to include a [`<noscript>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/noscript) tag and invite your users to enable JavaScript as we're living in 2025 (or later).

Furthermore, note that this approach does not limit you to Turbo Streams. Since we also render flash messages upon the initial page load, code like the following should work just fine and still show a flash message (see also [this blog post](/blog/2025/server-side-validation-rails-turbo)):

```rb
redirect_to @event, notice: t("events.created")
```


## Auto-dismiss Flash messages

We used `data-bs-dismiss="alert"` on the close button, so the Bootstrap JS code will automatically close the alert when the user clicks on the close button.

But what about some niceties like auto-dismissal after some time? For example, the alert could automatically close after 6s. And let's render a small progress bar that indicates how much time is left. When you hover over the message, the auto-dismissal counter should be paused, in case you want to have more time to read the message.

<figure class="image clickable" style="padding-left: 170px; padding-right: 170px;">
  <img src="/assets/blog/2025-flash-turbo-streams/flash-messages-with-progress-stacked.png"
    alt="Stacked Flash messages with a progress bar on top of each one indicating when they will close automatically.">
</figure>

Here is a Stimulus controller that does exactly that. We use a `MutationObserver` to listen to DOM changes. This allows us to also add the progress bar and the auto-dismissal feature to _newly shown_ flash messages prepended by Turbo Streams. You might come up with a different solution, e.g. listening to the [`turbo:before-stream-render`](https://turbo.hotwired.dev/reference/events#streams) event or the [`turbo:after-stream-render`](https://discuss.hotwired.dev/t/event-to-know-a-turbo-stream-has-been-rendered/1554/25) event.

```js
// +++FILENAME+++ frontend/flash/_messages.controller.js
import { Controller } from "@hotwired/stimulus";

const AUTO_DISMISS_TIMEOUT_MS = 6000;

/**
 * Handles flash messages auto-dismissal with a progress bar.
 */
export default class extends Controller {
  connect() {
    this.observeAlerts();
  }

  observeAlerts() {
    this.setupAllAlertsInitially();

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          if (!node.classList.contains("alert")) return;
          this.setupAutoDismiss(node);
        });
      });
    });
    this.observer.observe(this.element, { childList: true, subtree: false });
  }

  setupAllAlertsInitially() {
    this.element.querySelectorAll(".alert").forEach(alert => this.setupAutoDismiss(alert));
  }

  setupAutoDismiss(alert) {
    if (alert.dataset.autoDismiss) return;
    alert.dataset.autoDismiss = "true";

    alert.style.position = "relative";
    const bar = this.createProgressBar();
    alert.prepend(bar);

    let start = Date.now();
    let elapsed = 0;
    let paused = false;
    let animationFrameId;

    const updateBar = () => {
      if (paused) {
        animationFrameId = requestAnimationFrame(updateBar);
        return;
      }
      elapsed = Date.now() - start;
      let percent = Math.min(100, (elapsed / AUTO_DISMISS_TIMEOUT_MS) * 100);
      bar.style.width = percent + "%";
      if (elapsed < AUTO_DISMISS_TIMEOUT_MS) {
        animationFrameId = requestAnimationFrame(updateBar);
      }
      else {
        closeAlert();
      }
    };

    const closeAlert = () => {
      if (alert.classList.contains("show")) {
        alert.classList.remove("show");
        alert.classList.add("hide");
        setTimeout(() => alert.remove(), 500);
      }
      else {
        alert.remove();
      }
      cancelAnimationFrame(animationFrameId);
    };

    const pauseTimer = () => {
      if (!paused) {
        paused = true;
        cancelAnimationFrame(animationFrameId);
      }
    };

    const resumeTimer = () => {
      if (paused) {
        paused = false;
        start = Date.now() - elapsed;
        animationFrameId = requestAnimationFrame(updateBar);
      }
    };

    alert.addEventListener("mouseenter", pauseTimer);
    alert.addEventListener("focusin", pauseTimer);
    alert.addEventListener("mouseleave", resumeTimer);
    alert.addEventListener("focusout", resumeTimer);
    animationFrameId = requestAnimationFrame(updateBar);
  }

  createProgressBar() {
    const bar = document.createElement("div");
    bar.style.position = "absolute";
    bar.style.top = "0";
    bar.style.left = "0";
    bar.style.height = "4px";
    bar.style.width = "0%";
    bar.style.background = "rgba(0,0,0,0.15)";
    bar.style.transition = "width 0.2s linear";
    bar.style.zIndex = "2";
    return bar;
  }
}
```

Then, use the Stimulus controller on the div that acts as container for our flash messages (I've named the controller `flash-messages`).

```erb
// +++FILENAME+++ frontend/flash/_messages.html.erb
<!-- see the data-controller attribute -->
<div class="container-max-md" id="flash-messages" data-controller="flash-messages">
  <%= render partial: 'flash/message' %>
</div>
```

_Read [my other blog post](/blog/2025/server-side-validation-rails-turbo) if you want to show error messages from server-side validations inline in your forms._
