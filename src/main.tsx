import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { MentorProvider } from "./context/MentorContext";
import { SessionProvider } from "./context/SessionContext";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

// Import firebase configuration - initialization happens automatically upon import
import { firebaseApp, db } from "./services/firebase";

// Log Firebase initialization status
console.log(
  "Main entry point: Firebase initialized with app:",
  firebaseApp.name
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <MentorProvider>
            <SessionProvider>
              <App />
            </SessionProvider>
          </MentorProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
