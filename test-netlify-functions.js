// test-netlify-functions.js
// A simple script to test Netlify functions locally

import { exec } from "child_process";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("🚀 Netlify Functions Tester");
console.log("============================");
console.log("This script will help you test your Netlify functions locally");
console.log("Make sure Netlify CLI is installed and authorized");
console.log("");

// Start the Netlify dev server
const startServer = () => {
  console.log("Starting Netlify dev server...");

  const netlifyDev = exec("netlify dev", { maxBuffer: 1024 * 1024 * 10 });

  netlifyDev.stdout.on("data", (data) => {
    console.log(data.toString());

    // Look for the server started message
    if (data.toString().includes("Server now ready on")) {
      showTestOptions();
    }
  });

  netlifyDev.stderr.on("data", (data) => {
    console.error(`Error: ${data}`);
  });

  netlifyDev.on("close", (code) => {
    console.log(`Netlify dev server exited with code ${code}`);
    rl.close();
  });

  return netlifyDev;
};

// Show test options
const showTestOptions = () => {
  console.log("\nAvailable test endpoints:");
  console.log("1. Create Payment Intent");
  console.log("2. Capture Payment");
  console.log("3. Create Refund");
  console.log("4. Get Mentor Balance");
  console.log("5. Create Connect Account");
  console.log("6. Create Mentor Stripe Account");
  console.log("7. Mentor Payout");
  console.log("8. Exit");
  console.log("");

  rl.question("Select an option (1-8): ", (answer) => {
    switch (answer) {
      case "1":
        testCreatePaymentIntent();
        break;
      case "2":
        testCapturePayment();
        break;
      case "3":
        testCreateRefund();
        break;
      case "4":
        testMentorBalance();
        break;
      case "5":
        testCreateConnectAccount();
        break;
      case "6":
        testCreateMentorStripeAccount();
        break;
      case "7":
        testMentorPayout();
        break;
      case "8":
        console.log("Exiting...");
        process.exit(0);
        break;
      default:
        console.log("Invalid option");
        showTestOptions();
    }
  });
};

// Test functions
const testCreatePaymentIntent = () => {
  console.log("\nTesting Create Payment Intent...");

  rl.question("Enter amount in cents (e.g., 2000 for $20): ", (amount) => {
    const command = `curl -X POST http://localhost:8888/.netlify/functions/create-payment-intent \
      -H "Content-Type: application/json" \
      -d '{"amount": ${amount}, "currency": "usd", "description": "Test payment"}'`;

    runCommand(command);
  });
};

const testCapturePayment = () => {
  console.log("\nTesting Capture Payment...");

  rl.question("Enter payment intent ID: ", (paymentIntentId) => {
    const command = `curl -X POST http://localhost:8888/.netlify/functions/capture-payment \
      -H "Content-Type: application/json" \
      -d '{"paymentIntentId": "${paymentIntentId}"}'`;

    runCommand(command);
  });
};

const testCreateRefund = () => {
  console.log("\nTesting Create Refund...");

  rl.question("Enter payment intent ID: ", (paymentIntentId) => {
    const command = `curl -X POST http://localhost:8888/.netlify/functions/create-refund \
      -H "Content-Type: application/json" \
      -d '{"paymentIntentId": "${paymentIntentId}"}'`;

    runCommand(command);
  });
};

const testMentorBalance = () => {
  console.log("\nTesting Get Mentor Balance...");

  rl.question("Enter mentor/Stripe account ID: ", (mentorId) => {
    const command = `curl -X GET http://localhost:8888/.netlify/functions/mentor-balance/${mentorId}`;

    runCommand(command);
  });
};

const testCreateConnectAccount = () => {
  console.log("\nTesting Create Connect Account...");

  rl.question("Enter email: ", (email) => {
    const command = `curl -X POST http://localhost:8888/.netlify/functions/create-connect-account \
      -H "Content-Type: application/json" \
      -d '{"email": "${email}", "country": "US"}'`;

    runCommand(command);
  });
};

const testCreateMentorStripeAccount = () => {
  console.log("\nTesting Create Mentor Stripe Account...");

  rl.question("Enter mentor ID: ", (mentorId) => {
    rl.question("Enter email: ", (email) => {
      const command = `curl -X POST http://localhost:8888/.netlify/functions/create-mentor-stripe-account/${mentorId} \
        -H "Content-Type: application/json" \
        -d '{"email": "${email}", "country": "US"}'`;

      runCommand(command);
    });
  });
};

const testMentorPayout = () => {
  console.log("\nTesting Mentor Payout...");

  rl.question("Enter mentor ID: ", (mentorId) => {
    rl.question("Enter amount in cents (e.g., 5000 for $50): ", (amount) => {
      const command = `curl -X POST http://localhost:8888/.netlify/functions/mentor-payout/${mentorId} \
        -H "Content-Type: application/json" \
        -d '{"amount": ${amount}, "currency": "usd", "description": "Test payout"}'`;

      runCommand(command);
    });
  });
};

const runCommand = (command) => {
  console.log(`Running command: ${command}`);

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }

    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }

    console.log("Response:");
    console.log(stdout);

    // Show options again
    showTestOptions();
  });
};

// Start the server
const server = startServer();

// Handle Ctrl+C
process.on("SIGINT", () => {
  console.log("\nStopping server...");
  server.kill();
  process.exit(0);
});
