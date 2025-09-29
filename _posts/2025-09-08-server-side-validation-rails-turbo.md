---
layout: page
title: "Inline server-side form validation with Turbo"
code: true
excerpt: >
  A guide to Rails validations and how to show server-side validation messages
  inline in your web forms. We employ Turbo Frames to avoid page reloads.
---

## TL;DR — Too long, didn't read

Use a [Rails model validation](https://guides.rubyonrails.org/active_record_validations.html#validations-overview). Install the [turbo-rails gem](https://github.com/hotwired/turbo-rails) and read the [Turbo Frames Hotwire documentation](https://turbo.hotwired.dev/handbook/frames). Then, wrap your forms in Turbo Frames (here, the model is called `Event` and passed as `event: @event`) to the form partial.

```erb
// +++FILENAME+++ views/events/new.html.erb
<%= turbo_frame_tag event do %>
  <%= form_with(model: event) do |f| %>
    ...
  <% end %>
<% end %>
```

Have a `create` method like this in your controller[^unprocessable-content]:

```rb
// +++FILENAME+++ controllers/events_controller.rb
def create
  @event = Event.new(event_params)
  if @event.save
    redirect_to @event, notice: t("events.created")
  else
    # This is the error case where we rerender the new.html.erb template
    render :new, status: :unprocessable_content
  end
end
```

[^unprocessable-content]: There is `:unprocessable_entity` and `:unprocessable_content` which both map to the HTTP status code `422`. See [this GitHub comment](https://github.com/rspec/rspec-rails/issues/2763#issuecomment-2172602162) for why you should prefer `:unprocessable_content`. See also [RFC 9110](https://datatracker.ietf.org/doc/html/rfc9110#name-422-unprocessable-content).

Last, but not least, customize the inline-styling by overwriting the [Rails error field wrapper](https://guides.rubyonrails.org/active_record_validations.html#customizing-error-field-wrapper) in an initializer.

```rb
// +++FILENAME+++ config/initializers/form_errors.rb
ActionView::Base.field_error_proc = proc do |html_tag, instance|
  # Do whatever you want. By default Rails does this:
  content_tag :div, html_tag, class: "field_with_errors"
end
```

## Rails validation basics

You always need _server-side_ validation to validate user input before writing data to your database. _Client-side_ validation is nice-to-have for good UI/UX, but can easily be bypassed by users. On the server-side, Rails comes with [ActiveRecord Validations](https://guides.rubyonrails.org/active_record_validations.html#validations-overview#validations) that can look like this:

```rb
// +++FILENAME+++ models/event.rb
# Think of an "Event" as "Meeting" here. Or just replace Event
# by Person, User or anything else you like.
class Event < ApplicationRecord
  validates :title, presence: true
end
```

This ensures that every `Event` row in the database has a title. If not, Rails refuses to write the object to the database.

```rb
// +++FILENAME+++ Rails Console
irb> e = Event.new
irb> e.title
=> nil
irb> e.valid?
=> false
irb> e.errors[:title]
=> ["Please fill out this field."]
irb> e.save
=> false
```

Note how the array returned by `e.errors[:title]` contains a localized string from my `en.yml` file. You can customize the messages, e.g. define a key named `blank` for a generic message whenever a `presence` validation is not met. Or specify messages down to single attributes of a model. See more details in the [i18n Rails Error Message Scopes guide](https://guides.rubyonrails.org/i18n.html#error-message-scopes).

```yml
// +++FILENAME+++ config/locales/validation/en.yml
en:
  errors:
    messages:
      blank: Please fill out this field.
  activerecord:
    errors:
      models:
        event:
          attributes:
            title:
              blank: >
                Please set an event title such that users can easily spot what
                your event is about.

```


## Inline server-side validation errors

So far so good. But how to show these error messages to the user inside a web form next to the respective input fields? Easy: whenever `@event.save` returns `false` (indicating there was a problem, e.g. a failed validation), send back the HTML of the entire page. Rails will by default include the error messages (see also next section).

```rb
// +++FILENAME+++ controllers/events_controller.rb
class EventsController < ApplicationController
  def index
  end

  def new
    @event = Event.new
  end

  def create
    @event = Event.new(event_params)
    if @event.save
      redirect_to @event, notice: t("events.created")
    else
      # This is the error case where we rerender the new.html.erb template
      render :new, status: :unprocessable_content
    end
  end

  private

    def event_params
      params.expect(event: [:title, :description])
    end
end


```

When we re-render the `new` template in the `create` method, we have initialized the variable `@event` beforehand via `@event = Event.new(event_params)`. Therefore, the `@event` object now holds the values that the user has already entered into the form fields, e.g. `@event[:description]` may give "My event description". This is great since when the `new` template passes this object to our form partial (see `event: @event`), Rails will render the input fields _with_ the previous user input. This avoids that the whole form is reset and spares you some angry mails by frustrated users.

```erb
// +++FILENAME+++ views/events/new.html.erb
<h1>New Event</h1>
<%= render "events/form", event: @event %>
```

```erb
// +++FILENAME+++ views/events/_form_.html.erb
<%= form_with(model: event) do |f| %>

  <div>
    <%= f.text_field :title %>
    <%= f.label :title, t("events.title") %>
  </div>

  <div>
    <%= f.text_area :description %>
    <%= f.label :description, t("events.description") %>
  </div>

<% end %>
```


## Customize how errors are rendered

But what about our errors? Well, Rails is about [convention over configuration](https://rubyonrails.org/doctrine#convention-over-configuration). By default, it will generate the following `div` around any field containing a validation error:

```html
<div class="field_with_errors">
  <!-- wraps the field that contains an error -->
</div>

```

See also the Rails Guide on [Displaying Validation Errors in Views](https://guides.rubyonrails.org/active_record_validations.html#displaying-validation-errors-in-views). You may want to style the `field_with_errors` CSS class however you like. But this approach is limiting, e.g. for Bootstrap, you are [expected](https://getbootstrap.com/docs/5.3/forms/validation/#server-side) to add an `is-invalid` class to the form element, and to add an element (`div`, `span` etc.) with the class `invalid-feedback` that contains the error message.
Luckily, Rails is also _customizable_: in this case, we are interested in the [error field wrapper](https://guides.rubyonrails.org/active_record_validations.html#customizing-error-field-wrapper). By default, it reads like this:

```rb
ActionView::Base.field_error_proc = proc do |html_tag, instance|
  content_tag :div, html_tag, class: "field_with_errors"
end
```

As we've seen, it simply wraps your field, here `html_tag`, inside a `div`. Let's overwrite this behavior in an initializer. This code is a mix of [this](https://dev.to/etoundi_1er/show-rails-validation-errors-inline-with-bootstrap-4-4ga6) and [this post](https://www.jorgemanrubia.com/2019/02/16/form-validations-with-html5-and-modern-rails/), the latter being a great writeup by _Jorge Manrubia_ that served me as inspiration. The code should be self-explanatory. It is adapted to [Bootstrap](https://getbootstrap.com/docs/5.3/forms/validation/#server-side), but you can really do whatever you want here. Don't forget to add `aria-live="polite"` to the error message to inform assistive technology users about the [updated site content](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-live). And note that we use `content_tag` here since it automatically [**escapes**](https://github.com/rails/rails/blob/cf6b3107753a762b27bfcf9eefcfd9feb43f0242/actionview/lib/action_view/helpers/tag_helper.rb#L230) the error message (which might contain user strings for custom validations).

```rb
// +++FILENAME+++ config/initializers/form_errors.rb
ActionView::Base.field_error_proc = proc do |html_tag, instance|
  fragment = Nokogiri::HTML.fragment(html_tag)
  field = fragment.at("input,select,textarea")
  next html_tag if field.nil?

  # classes adapted to Bootstrap
  field.add_class("is-invalid")
  error_message = [*instance.error_message].to_sentence
  error_span = ActionController::Base.helpers.content_tag(
    :span,
    error_message,
    class: "invalid-feedback",
    aria: { live: "polite" }
  )

  html = <<-HTML
    #{fragment}
    #{error_span}
  HTML

  html.html_safe # rubocop:disable Rails/OutputSafety
end
```

With this in place, your error messages that come from the server can look like this. Nice!

<figure class="image clickable">
  <img src="{{'/assets/blog/2025-server-side-validation-rails-turbo/error-on-title-field.png' | relative_url }}"
    alt="Error message shown on the title field of the events form"/>
</figure>

## Server-side errors without page reload (Turbo)

The title promised to use [Turbo from the Hotwire umbrella](https://turbo.hotwired.dev/), so let's do that. For a general introduction to Hotwire — besides the great docs themselves — you might also want to read [this blog post](https://boringrails.com/articles/thinking-in-hotwire-progressive-enhancement/). Our goal here is to only replace the form itself with an updated version of it (including validation errors). This is a perfect use case for [Turbo Frames](https://turbo.hotwired.dev/handbook/frames):

> Turbo Frames allow predefined parts of a page to be updated on request. Any links and forms inside a frame are captured, and the frame contents automatically update after receiving a response.

To make use of this magic, we wrap the form inside a `<turbo-frame>` tag by using the `turbo_frame_tag` helper from the [`turbo-rails` gem](https://github.com/hotwired/turbo-rails?tab=readme-ov-file#decompose-with-turbo-frames).

```erb
// +++FILENAME+++ views/events/_form.html.erb
<%= turbo_frame_tag event do %>
<%= form_with(model: event) do |f| %>
...
<% end %>
<% end %>
```

This will result in the following HTML:

```html
<turbo-frame id="new_event">
  <!-- the form -->
</turbo-frame>
```

And that's basically all you have to do. The `create` controller action stays exactly the same since we still want to render the `new.html.erb` template again whenever `@event.save` was unsuccessful.

```rb
// +++FILENAME+++ controllers/events_controller.rb
def create
  @event = Event.new(event_params)
  if @event.save
    redirect_to @event, notice: t("events.created")
  else
    # stays the same
    render :new, status: :unprocessable_content
  end
end
```

And the magic happens on the client-side now: the Turbo JS code (in your browser) detects that the response from our server contains a `<turbo-frame>` tag. It then tries to find the matching Turbo Frame on the page via their IDs — in our case the automatically generated id `new_event` — and replaces the frame with the new content. No full page-reload needed. The look-and-feel of a Single Page App (SPA) just by adding a `<turbo-frame>` tag to your form.


### Only send what is really needed (automatic)

Also notice that upon form submission, the Turbo JS code will set the `Turbo-Frame` request header. This allows the turbo-rails gem to provide a `turbo_frame_request?` method for your controllers, should you need it. It also registers a custom [layout method](https://github.com/hotwired/turbo-rails/blob/main/app/controllers/turbo/frames/frame_request.rb), which will only render a minimal layout in place of the application layout.

In the end, the Turbo JS library in the browser will only extract the `<turbo-frame>` tag from the response, so no need to render and ship the whole page with all headers, footer, maybe your sidebar etc. From the [Turbo Frame docs](https://turbo.hotwired.dev/handbook/frames):

> Regardless of whether the server provides a full document, or just a fragment containing an updated version of the requested frame, only that particular frame will be extracted from the response to replace the existing content.

Note that due to the turbo-rails gem overriding the layout, you have to keep [this note on custom layouts](https://github.com/hotwired/turbo-rails?tab=readme-ov-file#a-note-on-custom-layouts) in mind should you use another layout than `application`.

### Progressive enhancement (automatic)

When the user has JavaScript disabled in their browser, the `Turbo-Frame` request header will not be sent (since the Turbo _JavaScript_ library could not execute and therefore not add this header). Therefore, the turbo-rails library will also _not_ use the minimal layout in this case. Instead, this line of the events controller

```rb
render :new, status: :unprocessable_content
```

will use the usual application layout. So the entire page is re-rendered by Ruby on Rails and shipped as HTML to your browser where the entire DOM is replaced[^whole-dom]. Without JavaScript being activated on the users's browser, this is the best scenario you can get, as there is no way to replace only parts of the page without JS. So here, _progressive enhancement_ means that even with the bare minimum (just HTML/CSS, no JS), the user can still admire a correct-looking page.

Then, you can build upon that. In our case, the baseline is implicit by the fact that a missing `Turbo-Frame` header implies that the turbo-rails gem does not overwrite the layout. However, when you use Turbo Streams later on, keep this in mind for your controllers. E.g. always include a fallback `format.html` as well:

```rb
respond_to do |format|
  # not needed in this blog post, just as outlook
  format.turbo_stream { render :something }
  format.html { redirect_to @something_else }
end
```

## Bonus: Break out of Turbo Frames

By default, all links and forms of a `<turbo-frame>` target _the frame itself_. That is, when clicking on a link inside the form, we expect a response that includes a Turbo Frame. If that is not what you want, check out [the docs](https://turbo.hotwired.dev/handbook/frames#targeting-navigation-into-or-out-of-a-frame). E.g. you could use `target: _top`, such that the navigation targets _the entire page_.

```erb
<%= turbo_frame_tag event, target: "_top" do %>
```

But in this case, you have to re-configure the behavior for the form submit button since we want it to target only the frame:

```erb
<%= f.submit t("events.create"), data: { "turbo-frame": dom_id(event) } %>
```

## Bonus: General form errors

What if all fields you've shown to the user contain valid input, but there is still an error on the server-side? Simply imagine that you do a `params.expect(event: [:title, :description])` in the controller, but forgot to even include the description field in your template. No client-side validation can catch this, but there's still an error if `description` has a presence validation in the backend.

To not let our users baffled with a form that seems valid but doesn't do anything, let's include a generic error message next to the submit button by overwriting the `form_with` helper method. This code has to be adapted according to how you adjusted the `ActionView::Base.field_error_proc`. In our case, it's easy to check if the form contains any visible validation error messages in the user markup: just search for the `class="invalid-feedback"` string in the HTML. If any such class element is present, we don't want to show our generic error message. Otherwise, we do in order to at least show one message on the whole form.

```rb
// +++FILENAME+++ helpers/application_helper.rb
module ApplicationHelper
  # Overrides form_with to show a general form error message if the form
  # has errors but no field-specific errors shown on the page.
  def form_with(**options, &)
    # Render the form to a string
    form_html = capture do
      super(**options, &)
    end

    form_object = options[:model] || options[:scope]
    form_html = add_whole_form_error_message(form_object, form_html)

    form_html.html_safe # rubocop:disable Rails/OutputSafety
  end

  private

    # Adds a general form error message if the form object has errors but
    # no field-specific error markup is present.
    def add_whole_form_error_message(form_object, form_html)
      if !form_object.respond_to?(:errors) || form_object.errors.empty? \\
        || form_html.include?('class="invalid-feedback"')
        return form_html
      end

      doc = Nokogiri::HTML::DocumentFragment.parse(form_html)
      submit_buttons = doc.css('button[type="submit"],input[type="submit"]')
      return unless submit_buttons.any?

      last_submit = submit_buttons.last
      error_span = Nokogiri::HTML::DocumentFragment.parse(
        content_tag(:span, t("errors.unknown"),
                    class: "invalid-feedback d-block",
                    "aria-live": "polite")
      )
      last_submit.add_next_sibling(error_span)
      doc.to_html
    end
end
```

```yaml
// +++FILENAME+++ config/locales/validation/en.myl
en:
  errors:
    unknown: >
      You filled out the form correctly, but unfortunately something went wrong
      on the server. Please try again later and contact us if the problem persists.
```


[^whole-dom]: This is actually not entirely true since [Turbo Drives](https://turbo.hotwired.dev/handbook/drive) performs some optimizations, e.g. merging the contents of the `<head>` elements.
