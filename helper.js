import fs from 'fs';
import dotenv from 'dotenv';

import path from 'path';
import fetch from 'node-fetch';

import chalk from 'chalk';

import express from 'express';
import ngrok from 'ngrok';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());



function getBase64FromFile(filePath) {
    try {
      const fileContent = fs.readFileSync(filePath, "utf8");
      return Buffer.from(fileContent).toString("base64");
    } catch (error) {
      console.error(`Error reading or converting file: ${error.message}`);
      process.exit(1);
    }
  }


const API_URL = 'https://api.quicknode.com/functions/rest/v1/functions';
dotenv.config();

const API_KEY = process.env.API_KEY;

async function createFunction(prompt) {
    const name = await prompt("Enter function name: ");
    const description = await prompt("Enter function description: ");
    const filePath = path.join(process.cwd(), 'functions/event.js');
    const base64Code = getBase64FromFile(filePath);
    console.log(base64Code)

    const payload = {
        name,
        description,
        kind: "nodejs-qn:20",
        code: base64Code,
        binary: false,
        limits: {
            timeout: 5000,
            memory: 128
        }
    };



    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (response.ok) {
            console.log("Function created successfully:", data);
        } else {
            console.error("Failed to create function:", data);
        }
    } catch (error) {
        console.error(`API call failed: ${error.message}`);
    }
}

 async function viewFunctions(prompt) {
    try {


        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            }
        });
        const data = await response.json();
        if (response.ok) {
             if (Array.isArray(data.data)) {
                data.data.forEach(func => {
                    console.log(chalk.yellow("---------------"));
                    console.log(chalk.green.bold("Function:"));
                    console.log(chalk.blue("  Name:"), chalk.white(func.name));
                    console.log(chalk.blue("  Description:"), chalk.white(func.description));
                    console.log(chalk.blue("  Created At:"), chalk.white(func.created_at));
                    console.log(chalk.blue("  ID:"), chalk.white(func.id));
                });
            } else {
                console.log(chalk.red("No functions found."));
            }
        }
    } catch (error) {
        console.error(`API call failed: ${error.message}`);
    }
}


 
 async function runFunction(prompt) {
    const functionId = await prompt("Enter function ID to run: ");
    const network =  await prompt("Enter network (e.g., ethereum-mainnet): ","ethereum-mainnet");
    const dataset = await prompt("Enter dataset (e.g., block): ", "block_with_receipts");
    // const blockNumber = await prompt("Enter block number: ");
    const userDataKey = await prompt("Enter user data key: (Default eventName ) ","eventName");
    const userDataValue =await prompt("Enter user data value: (Default Swap )","Swap");

    const payload = {
        network,
        dataset,
        // block_number: parseInt(blockNumber),
        user_data: {
            [userDataKey]: userDataValue
        }
    };

    try {
        const response = await fetch(`${API_URL}/${functionId}/call`, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (response.ok) {
            console.error("Ran Succcessfully :", data);
 

            if (Array.isArray(data.execution.result.event)) {
                data.execution.result.event.forEach((item, index) => {
                    console.log(chalk.yellow(`\nResult #${index + 1}:`));

                     Object.keys(item).forEach((key) => {
                        console.log(chalk.blue(`${key}:`), chalk.white(item[key]));
                    });
                });}
        } else {
            console.error("Failed to run function:", data);
        }
    } catch (error) {
        console.error(`API call failed: ${error.message}`);
    }
}

async function startWebhookServer() {

    app.post('/webhook', (req, res) => {
        console.log("Received a request:", req.body);
         res.status(200).send({ message: 'Webhook received successfully!' });
    });
    
     const startServer = async () => {
        const server = app.listen(PORT, () => {
            console.log(`Webhook server is running at http://localhost:${PORT}/webhook`);
        });

        console.log("start ngrok server",PORT)

    
         const url = await ngrok.connect(PORT);
        console.log(`ngrok tunnel established at: ${url}`);
    
        return server;
    };

    
     startServer().catch(console.error);

}
export {
    createFunction,
    runFunction,
    viewFunctions,
    startWebhookServer


}