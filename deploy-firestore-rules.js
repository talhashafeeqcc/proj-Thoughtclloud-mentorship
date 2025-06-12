/**
 * Script to deploy Firestore rules using the Firebase Admin SDK
 * Run with: node deploy-firestore-rules.js
 */

const { exec } = require("child_process");

console.log("Deploying Firestore rules...");

// Deploy only the Firestore rules
exec("firebase deploy --only firestore:rules", (error, stdout, stderr) => {
  if (error) {
    console.error(`Error deploying rules: ${error.message}`);
    return;
  }

  if (stderr) {
    console.error(`Error output: ${stderr}`);
    return;
  }

  console.log(`Rules deployed successfully:`);
  console.log(stdout);
});
