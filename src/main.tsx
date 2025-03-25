import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { MentorProvider } from "./context/MentorContext";
import { SessionProvider } from "./context/SessionContext";
import "./index.css";

// Import database module - bootstrapping happens automatically upon import
import { databaseBootstrapStatus } from "./services/database";

// Check database bootstrap status
console.log(
  "Main entry point: Database bootstrap status:",
  databaseBootstrapStatus.completed ? "Completed" : "In progress"
);

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
