import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    MessageFlags
} from "discord.js";

import {Config} from "../models/configModel";

export const dvStatusCommand = new SlashCommandBuilder()
    .setName("dv-status")
    .setDescription("Set when DV is available")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
        subcommand
            .setName("set-available")
            .setDescription("Set the available date range for DV")
            .addStringOption(option =>
                option
                    .setName("start-date")
                    .setDescription("Start date (YYYY-MM-DD)")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName("end-date")
                    .setDescription("End date (YYYY-MM-DD)")
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName("clear-available")
            .setDescription("Clear available dates and pause reminders")
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName("status")
            .setDescription("Check current DV availability status")
    );

/**
 * Validate date format (YYYY-MM-DD)
 */
function isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
}

export async function handleDvStatus(
    interaction: ChatInputCommandInteraction
) {
    const subcommand = interaction.options.getSubcommand();

    try {
        if (subcommand === "set-available") {
            const startDate = interaction.options.getString("start-date", true);
            const endDate = interaction.options.getString("end-date", true);

            // Validate date formats
            if (!isValidDate(startDate)) {
                await interaction.reply({
                    content: "❌ Invalid start date format. Use YYYY-MM-DD",
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            if (!isValidDate(endDate)) {
                await interaction.reply({
                    content: "❌ Invalid end date format. Use YYYY-MM-DD",
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            // Validate that end date is after start date
            if (endDate < startDate) {
                await interaction.reply({
                    content: "❌ End date must be after or equal to start date",
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            const config = await Config.findOne();
            if (!config) {

                await interaction.reply({
                    content: "No configuration found."
                });

                return;
            }
            config.dvAvailableStart = startDate;
            config.dvAvailableEnd = endDate;
            await Config.updateOne({}, config)

            await interaction.reply({
                content: `✅ DV available period set!\n\n` +
                    `📅 Start: ${startDate}\n` +
                    `📅 End: ${endDate}\n\n` +
                    `🔔 Reminders are active during this period.`,
                flags: MessageFlags.Ephemeral
            });
        }

        else if (subcommand === "clear-available") {
            const config = await Config.findOne();
            if (!config) {
                await interaction.reply({
                    content: "No configuration found."
                });
                return;
            }
            config.dvAvailableStart = null;
            config.dvAvailableEnd = null;
            await Config.updateOne({}, config)

            await interaction.reply({
                content: `✅ Available period cleared!\n\n🔇 Reminders are now paused.`,
                flags: MessageFlags.Ephemeral
            });
        }

        else if (subcommand === "status") {
            const config = await Config.findOne();

            if (!config) {
                await interaction.reply({
                    content: "No configuration found."
                });
                return;
            }

            if (!config.dvAvailableStart || !config.dvAvailableEnd) {
                await interaction.reply({
                    content: `❌ DV is **UNAVAILABLE**\n\n🔇 Reminders are paused.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            const today = new Date().toISOString().split("T")[0];
            const isAvailable = today >= config.dvAvailableStart && today <= config.dvAvailableEnd;

            const status = isAvailable ? "✅ **AVAILABLE**" : "❌ **UNAVAILABLE**" ;
            const bell = isAvailable ? "🔔" : "🔇";

            await interaction.reply({
                content: `${status}\n\n` +
                    `📅 Period: ${config.dvAvailableStart} to ${config.dvAvailableEnd}\n` +
                    `${bell} ${isAvailable ?  "Reminders active" : "Reminders paused"}`,
                flags: MessageFlags.Ephemeral
            });
        }
    } catch (error) {
        console.error("Error in handleDvStatus:", error);
        await interaction.reply({
            content: "❌ An error occurred while processing your request.",
            flags: MessageFlags.Ephemeral
        });
    }
}