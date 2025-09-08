---
layout: page
title: "Inline server-side form validation with Turbo"
code: true
excerpt: >
  How to use <code>FactoryBot.create()</code> inside your Cypress frontend tests in order to set up some mock objects to interact with. TODO
---

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

Note how the array returned by `e.errors[:title]` contains a localized string from my `en.yml` file. You can customize the messages, e.g. define the key `blank` for a generic message whenever a `presence` validation is not met. Or specify messages down to single attributes of a model. See more details in the [i18n Rails Error Message Scopes guide](https://guides.rubyonrails.org/i18n.html#error-message-scopes).

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

So far so good. But how to show these error messages to the user inside a web form next to the respective input fields? Easy: whenever `@event.save` returns `false` (indicating there was a problem, e.g. a failed validation), send back the HTML of the entire page.

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
      respond_to do |format|
        # What we're interested in in this blog post
        format.html { render :new, status: :unprocessable_content }
      end
    end
  end

  private

    def event_params
      params.expect(event: [:title, :description])
    end
end


```

When we re-render the `new` template in the `create` method, we have initialized the variable `@event` beforehand via `@event = Event.new(event_params)`. Therefore, the `@event` object now holds the values the user has already input in the form, e.g. `@event[:description]` could give "My event description". This is great since when the `new` template passes this object to our form partial (see `event: @event`), Rails will render the input fields with the previous user input. This avoids that the whole form is reset and spares you some angry mails by your users.

```html
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
