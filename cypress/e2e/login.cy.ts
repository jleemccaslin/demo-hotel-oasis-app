describe("Login", () => {
  beforeEach(() => {
    cy.visit("/login");
  });

  it("should display the login form", () => {
    cy.contains("Log in to your account").should("be.visible");
    cy.get("#email").should("be.visible");
    cy.get("#password").should("be.visible");
    cy.contains("button", "Login").should("be.visible");
  });

  it("should not submit when fields are empty", () => {
    cy.get("#email").clear();
    cy.get("#password").clear();
    cy.contains("button", "Login").click();

    // Should stay on login page (no navigation away)
    cy.url().should("include", "/login");
  });

  it("should show an error with invalid credentials", () => {
    cy.get("#email").clear().type("wrong@example.com");
    cy.get("#password").clear().type("wrongpassword");
    cy.contains("button", "Login").click();

    // App uses react-hot-toast for error messages
    cy.get("[role='status']").should("be.visible");
    cy.url().should("include", "/login");
  });

  it("should log in with valid credentials and redirect to dashboard", () => {
    cy.env(["TEST_USER_EMAIL", "TEST_USER_PASSWORD"]).then(
      ({ TEST_USER_EMAIL, TEST_USER_PASSWORD }) => {
        cy.get("#email").clear().type(TEST_USER_EMAIL);
        cy.get("#password").clear().type(TEST_USER_PASSWORD, { log: false });
      },
    );
    cy.contains("button", "Login").click();

    cy.url().should("include", "/dashboard");
  });

  it("should disable inputs while loading", () => {
    cy.env(["TEST_USER_EMAIL", "TEST_USER_PASSWORD"]).then(
      ({ TEST_USER_EMAIL, TEST_USER_PASSWORD }) => {
        cy.get("#email").clear().type(TEST_USER_EMAIL);
        cy.get("#password").clear().type(TEST_USER_PASSWORD, { log: false });
      },
    );
    cy.contains("button", "Login").click();

    // Inputs should be disabled during request
    cy.get("#email").should("be.disabled");
    cy.get("#password").should("be.disabled");
  });
});
