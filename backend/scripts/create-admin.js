#!/usr/bin/env node

const http = require("http");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
};

async function createAdmin() {
  console.log("\n======================================");
  console.log("Nestora Admin Registration");
  console.log("======================================\n");

  try {
    const name = await question("Enter your full name: ");
    const email = await question(
      "Enter your Gmail address (e.g., yourname@gmail.com): ",
    );
    const password = await question(
      "Enter a password (minimum 6 characters): ",
    );
    const mobile = await question("Enter your mobile number: ");
    const gender = await question("Enter your gender (Male/Female/Other): ");
    const address = await question("Enter your address: ");
    const occupation = await question("Enter your occupation: ");
    let adminKey = await question(
      "Enter admin registration key (or press Enter for default): ",
    );

    if (!adminKey) {
      adminKey = "nestora-admin-2024";
    }

    console.log("\nCreating admin account...\n");

    const payload = JSON.stringify({
      name,
      email,
      password,
      mobile,
      gender,
      address,
      occupation,
      adminKey,
      imageUrl: "",
    });

    const options = {
      hostname: "localhost",
      port: 5000,
      path: "/api/auth/register-admin",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": payload.length,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(data);

          if (response.success) {
            console.log("✓ Admin account created successfully!\n");
            console.log("Account Details:");
            console.log(`  User ID: ${response.user.userId}`);
            console.log(`  Name: ${response.user.name}`);
            console.log(`  Email: ${response.user.email}`);
            console.log(`  Role: ${response.user.roleName}\n`);
            console.log("Next steps:");
            console.log("1. Go to http://localhost:3000/login");
            console.log('2. Click on the "Admin" tab');
            console.log("3. Enter your email and password");
            console.log('4. Click "Sign in"\n');
            console.log("You will be redirected to the admin dashboard.");
          } else {
            console.log(`✗ Error: ${response.message}`);
          }
        } catch (error) {
          console.log("✗ Invalid response from server:", data);
        }

        rl.close();
        process.exit(0);
      });
    });

    req.on("error", (error) => {
      console.log("✗ Connection Error:", error.message);
      console.log("\nMake sure:");
      console.log("1. Backend server is running (npm start in backend folder)");
      console.log("2. Backend is running on http://localhost:5000");
      console.log("3. You have internet connection\n");
      rl.close();
      process.exit(1);
    });

    req.write(payload);
    req.end();
  } catch (error) {
    console.log("Error:", error.message);
    rl.close();
    process.exit(1);
  }
}

createAdmin();
