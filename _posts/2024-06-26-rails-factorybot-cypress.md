---
layout: page
title: "Rails FactoryBot in Cypress"
date: 2024-06-26
code: true
excerpt: >
  How to use <code>FactoryBot.create()</code> inside your Cypress frontend tests in order to set up some mock objects to interact with.
---

[FactoryBot](https://thoughtbot.github.io/factory_bot/) is a great library to easily create test data by means of Ruby objects. This is very useful in unit tests. But what about your frontend Cypress tests? Well, you can use FactoryBot there as well (to some extent). Jump directly into the code [here][github].

## Preview

Here’s how your Cypress test might look like in the end.

```js
// +++FILENAME+++ spec/cypress/e2e/submissions_spec.cy.js
import FactoryBot from "../support/factorybot";

describe("Submissions", () => {
  beforeEach(() => {
    cy.cleanDatabase();
    cy.createUserAndLogin("generic");
  });

  it("can create a submission", function () {
    FactoryBot.create("assignment", "with_deadline_tomorrow", { file_type: ".pdf" })
      .as("assignment");

    cy.then(() => {
      console.log(this.assignment);
    });
  });
});
```

## How?

This works by setting up routes with respective controllers in your Rails application that allow to create mock objects. We call these routes from the Cypress tests. That’s all you need, but of course a bit syntactic sugar and convenience methods on top of that might be desirable, such that you can write this in Cypress tests:

```js
cy.cleanDatabase();
cy.createUserAndLogin("admin");
FactoryBot.create("assignment", "with_deadline_tomorrow", { file_type: ".pdf" })
```

I’ve published a [**GitHub repo**][github] providing a minimal demo that you can follow along to implement this in your own project. You really don’t need much code for this. Happy testing!

## Limitations

For the sake of completeness, there are of course limitations to this approach.

- The returned objects are plain JavaScript objects and know nothing about your Rails app. So you cannot call instance methods on these objects (this would require a more complex setup that I've implemented in a project [here](https://github.com/MaMpf-HD/mampf/blob/50d59e6077ea926fe6dad3fc1707d174ef3f61c8/app/controllers/cypress/factories_controller.rb#L21-L47)).

- Most of the time, a few `FactoryBot.create()` statements are sufficient for a Cypress test. But in case you need very complex scenarios, it's probably easier to set up a scenario-based workflow. Create an `.rb` file, which uses any FactoryBot statements you like. Write a controller and add an endpoint that you call from Cypress. A parameter could indicate the name of the scenario, corresponding to a `.rb` file that you invoke from the controller. If you follow along my demo on [GitHub][github], you should be able to also implement such a workflow.


[github]: https://github.com/Splines/cypress-rails-factory-bot
