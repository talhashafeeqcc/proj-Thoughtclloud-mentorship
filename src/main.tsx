import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { MentorProvider } from "./context/MentorContext";
import { SessionProvider } from "./context/SessionContext";
import "./index.css";
import { initializeDatabaseWithSampleData } from "./services/database/db";

// Initialize the database with sample data when the app starts
initializeDatabaseWithSampleData()
  .then(() => {
    console.log("Database initialized with sample data if needed");
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);

    // For serious database errors, provide message to user
    if (typeof document !== "undefined") {
      const dbErrorElement = document.createElement("div");
      dbErrorElement.style.padding = "20px";
      dbErrorElement.style.backgroundColor = "#FEF2F2";
      dbErrorElement.style.color = "#991B1B";
      dbErrorElement.style.margin = "20px";
      dbErrorElement.style.borderRadius = "5px";
      dbErrorElement.innerHTML = `
        <h2 style="font-size: 18px; margin-bottom: 10px;">Database Error</h2>
        <p>There was an error with the database. Please try clearing your browser data and reloading the page.</p>
        <button id="clearAndReload" style="background-color: #DC2626; color: white; padding: 8px 16px; border: none; border-radius: 4px; margin-top: 10px; cursor: pointer;">
          Clear & Reload
        </button>
      `;

      document.body.prepend(dbErrorElement);

      // Add click handler for the clear and reload button
      document
        .getElementById("clearAndReload")
        ?.addEventListener("click", () => {
          if (typeof indexedDB !== "undefined") {
            indexedDB.deleteDatabase("thoughtcllouddb");
          }
          localStorage.clear();
          window.location.reload();
        });
    }
  });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MentorProvider>
          <SessionProvider>
            <App />
          </SessionProvider>
        </MentorProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
