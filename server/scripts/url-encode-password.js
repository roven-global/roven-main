#!/usr/bin/env node

/**
 * URL Encode Password Tool
 *
 * This script helps you URL-encode your MongoDB password
 * to avoid authentication issues with special characters.
 *
 * Usage: node scripts/url-encode-password.js
 */

const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("🔐 MongoDB Password URL Encoder");
console.log("================================\n");

console.log("Special characters that need encoding:");
console.log("@ → %40    # → %23    $ → %24    % → %25");
console.log("& → %26    + → %2B    / → %2F    : → %3A");
console.log("; → %3B    = → %3D    ? → %3F    [ → %5B");
console.log("] → %5D    \\ → %5C    ^ → %5E    ` → %60");
console.log("{ → %7B    | → %7C    } → %7D    ~ → %7E\n");

rl.question("Enter your MongoDB password: ", (password) => {
  const encodedPassword = encodeURIComponent(password);

  console.log("\n📋 Results:");
  console.log("============");
  console.log(`Original password: ${password}`);
  console.log(`URL-encoded password: ${encodedPassword}`);

  console.log("\n🔗 Your connection string should look like:");
  console.log(
    `mongodb+srv://<username>:${encodedPassword}@<cluster-url>/<database-name>?retryWrites=true&w=majority`
  );

  console.log("\n⚠️  Important:");
  console.log("- Replace <username> with your actual MongoDB username");
  console.log("- Replace <cluster-url> with your actual cluster URL");
  console.log("- Replace <database-name> with your actual database name");
  console.log("- Add this to your .env file as MONGODB_URI");

  rl.close();
});

rl.on("close", () => {
  console.log("\n✅ Done! Copy the encoded password to your .env file.");
  process.exit(0);
});
