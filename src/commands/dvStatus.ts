import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    MessageFlags
} from "discord.js";

import { loadConfig, saveConfig } from "../utils/config";

export const dvStatusCommand = new SlashCommandBuilder()
    .setName("dv-status")
    .setDescription("Set when DV is unavailable (reminders will pause)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
        subcommand
            .setName("set-unavailable")
            .setDescription("Set the unavailable date range for DV")
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
            .setName("clear-unavailable")
            .setDescription("Clear unavailable dates and resume reminders")
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
        if (subcommand === "set-unavailable") {
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

            const config = loadConfig();
            config.dvUnavailableStart = startDate;
            config.dvUnavailableEnd = endDate;
            saveConfig(config);

            await interaction.reply({
                content: `✅ DV unavailable period set!\n\n` +
                    `📅 Start: ${startDate}\n` +
                    `📅 End: ${endDate}\n\n` +
                    `🔇 Reminders will be paused during this period.`,
                flags: MessageFlags.Ephemeral
            });
        }

        else if (subcommand === "clear-unavailable") {
            const config = loadConfig();
            config.dvUnavailableStart = undefined;
            config.dvUnavailableEnd = undefined;
            saveConfig(config);

            await interaction.reply({
                content: `✅ Unavailable period cleared!\n\n🔔 Reminders are now active.`,
                flags: MessageFlags.Ephemeral
            });
        }

        else if (subcommand === "status") {
            const config = loadConfig();

            if (!config.dvUnavailableStart || !config.dvUnavailableEnd) {
                await interaction.reply({
                    content: `✅ DV is **AVAILABLE**\n\n🔔 Reminders are active.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            const today = new Date().toISOString().split("T")[0];
            const isUnavailable = today >= config.dvUnavailableStart && today <= config.dvUnavailableEnd;

            const status = isUnavailable ? "❌ **UNAVAILABLE**" : "✅ **AVAILABLE**";
            const bell = isUnavailable ? "🔇" : "🔔";

            await interaction.reply({
                content: `${status}\n\n` +
                    `📅 Period: ${config.dvUnavailableStart} to ${config.dvUnavailableEnd}\n` +
                    `${bell} ${isUnavailable ? "Reminders paused" : "Reminders active"}`,
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