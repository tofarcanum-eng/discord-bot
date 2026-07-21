import {
    Client,
    GatewayIntentBits,
    REST,
    Routes
} from "discord.js";

import dotenv from "dotenv";

dotenv.config();

import { startDvReminder } from "./reminders/dvReminder";

import { setupCommand, handleSetup } from "./commands/setup";
import { dvStatusCommand, handleDvStatus } from "./commands/dvStatus";


import express from "express";
import {Request, Response} from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// Health endpoint for Uptime Robot
app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({ status: "Bot is alive ✅" });
});

app.listen(PORT, () => {
    console.log(`🌐 HTTP Server running on port ${PORT}`);
});


const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once("clientReady", async (client) => {
    console.log(`${client.user.tag} is online!`);

    const rest = new REST({
        version: "10"
    }).setToken(process.env.TOKEN!);

    await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID!),
        {
            body: [
                setupCommand.toJSON(),
                dvStatusCommand.toJSON()
            ]
        }
    );

    console.log("✅ Slash commands registered.");
    startDvReminder(client);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    if (interaction.commandName === "setup") {
        await handleSetup(interaction);
    }

    if (interaction.commandName === "dv-status") {
        await handleDvStatus(interaction);
    }
});

void client.login(process.env.TOKEN);