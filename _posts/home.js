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