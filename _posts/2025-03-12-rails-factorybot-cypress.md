---
layout: page
title:  "Rails FactoryBot in Cypress"
date:   2024-06-26
---

Cypress tests don't come TODO

## Preview

Here’s how your Cypress test might look like in the end.
See the [GitHub repo][github].

```js
// spec/cypress/e2e/submissions_spec.cy.js
import FactoryBot from "../support/factorybot";

describe("Submissions", () => {
  beforeEach(() => {
    cy.cleanDatabase();
    cy.createUserAndLogin("generic");
  });

  it("can create a submission", function () {
    FactoryBot.create("assignment", "with_deadline_tomorrow", { file_type: ".pdf", size_max: 10 })
      .as("assignment");

    cy.then(() => {
      console.log(this.assignment);
    });
  });
});
```

## Motivation

Testing should be fun, otherwise it’s hard to incorporate it into your daily routine. For frontend UI tests, I enjoy Cypress as framework.

One more ingredient is test isolation. Without it, you will likely end up frustrated searching for the root cause of multiple failing tests. To achieve such an isolation, we can clean our database before every test run and also use mock objects. [FactoryBot](https://github.com/thoughtbot/factory_bot) and [DatabaseCleaner](https://github.com/DatabaseCleaner/database_cleaner) are two amazing gems that help with this in Ruby on Rails unit tests. But what about frontend tests? Cypress cannot access the database directly.

The solution is easy: provide routes with respective controllers in your Rails application that allow to clean the database and create mock objects. And then call these routes from your Cypress tests. That’s all you need, but of course a bit syntactic sugar and convenience methods on top of that might be desirable such that you can write this in Cypress tests:

```
cy.cleanDatabase();
cy.createUserAndLogin("admin");
FactoryBot.create("assignment", "with_deadline_tomorrow", { file_type: ".pdf", size_max: 10 })
```

I’ve set up a [GitHub repo][github] providing a minimal demo that you can follow along to implement this in your own project. You really don’t need much code for this. Happy testing!


[github]: https://github.com/Splines/cypress-rails-factory-bot
