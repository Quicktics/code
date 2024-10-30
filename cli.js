import dotenv from "dotenv";
import { createFunction, runFunction, viewFunctions,startWebhookServer } from "./helper.js";
import readline from "readline";

dotenv.config();

  
 
 

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
async function prompt(query, defaultValue = null) {
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            resolve(answer || defaultValue);
        });
    });
}
async function main() {
  console.log("Select an option:");
  console.log("1) Create Event Function");
  console.log("2) View My Functions");
  console.log("3) Run Function");
 
  const choice = await prompt("Enter your choice: ");
  console.log(choice);

  switch (choice) {
    case "1":
      await createFunction(prompt);
      break;
    case "2":
      await viewFunctions(prompt);
      break;
    case "3":
      await runFunction(prompt);
      break;
 
    default:
      console.log("Invalid choice. Exiting.");
  }
  rl.close();
}

main();


 