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
import {
    announceCommand,
    handleAnnounce,
    handleAnnounceModal
} from "./commands/announce";
import { dvStatusCommand, handleDvStatus } from "./commands/dvStatus";
import express from "express";
import {Request, Response} from "express";
import connectDB from "./utils/connectDB";
import {createDefaultConfig} from "./utils/createDefaultConfig";
import {fountainCommand, handleFountain, handleFountainModal} from "./commands/fountain";
import {
    handleMessageCommand,
    handleMessageModalSubmit,
    handleMessageRoleSelect,
    messageCommand
} from "./commands/message";
import {configCommand, handleConfig} from "./commands/config";


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
                dvStatusCommand.toJSON(),
                announceCommand.toJSON(),
                fountainCommand.toJSON(),
                messageCommand.toJSON(),
                configCommand.toJSON()
            ]
        }
    );

    console.log("✅ Slash commands registered.");
    await connectDB();
    await createDefaultConfig();
    startDvReminder(client);
});

client.on(

    "interactionCreate",

    async (interaction) => {


        // Slash Commands

        if (

            interaction.isChatInputCommand()

        ) {

            if (

                interaction.commandName ===
                "setup"

            ) {

                await handleSetup(
                    interaction
                );

            } else if (

                interaction.commandName ===
                "dv-status"

            ) {

                await handleDvStatus(
                    interaction
                );

            } else if (

                interaction.commandName ===
                "announce"

            ) {

                await handleAnnounce(
                    interaction
                );

            } else if (interaction.commandName === "fountain") {
                await handleFountain(interaction);
            } else if (interaction.commandName === "message") {
                await handleMessageCommand(interaction);
            } else if (interaction.commandName === "config") {
                await handleConfig(interaction);
            }

        }


        // Modals

        else if (

            interaction.isModalSubmit()

        ) {

            if (

                interaction.customId ===
                "announce-modal"

            ) {

                await handleAnnounceModal(
                    interaction
                );

            } else if (

                interaction.customId ===
                "fountain-modal"

            ) {

                await handleFountainModal(
                    interaction

                );

            } else if (interaction.customId === "message-modal") {
                await handleMessageModalSubmit(interaction);
            }


        } else if (interaction.isRoleSelectMenu()) {
            if (interaction.customId.startsWith("message-roles")) {
                await handleMessageRoleSelect(interaction);
            }
        }

    }

);

void client.login(process.env.TOKEN);