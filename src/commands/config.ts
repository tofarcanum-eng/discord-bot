import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    EmbedBuilder,
    MessageFlags
} from "discord.js";

import { Config } from "../models/configModel";

export const configCommand = new SlashCommandBuilder()
    .setName("config")
    .setDescription("View the current bot configuration.")
    .setDefaultMemberPermissions(
        PermissionFlagsBits.Administrator
    );

export async function handleConfig(
    interaction: ChatInputCommandInteraction
) {

    const config = await Config.findOne();

    if (!config) {
        await interaction.reply({
            content: "❌ Configuration not found.",
            flags: MessageFlags.Ephemeral
        });

        return;
    }

    const days = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"
    ];

    const selectedDays = config.days
        .map((day:number) => days[day])
        .join(", ");

    const availability =

        config.dvAvailableStart &&
        config.dvAvailableEnd

            ? "AVAILABLE"
            : "UNAVAILABLE";


    const embed = new EmbedBuilder()
        .setTitle("Bot Configuration")
        .setColor(0x00FFFF)
        .addFields(

            {
                name: "Channels",
                value:
                    `Reminder: <#${config.channelReminderID}>\n` +
                    `Announcement: <#${config.channelAnnouncementID}>\n` +
                    `Fountain: <#${config.channelFountainID}>`
            },

            {
                name: "DV reminder role",
                value:
                    `<@&${config.roleID}>`
            },

            {
                name: "Reminder Time",
                value:
                    `Time: ${config.hour}:${config.minute
                        .toString()
                        .padStart(2, "0")} IST\n` +

                    `Days: ${selectedDays}`
            },

            {
                name: "DV Availability",
                value: `Status: ${availability}\n` +

                    `Start: ${
                        config.dvAvailableStart ??
                        "Not Set"
                    }\n` +

                    `End: ${
                        config.dvAvailableEnd ??
                        "Not Set"
                    }`
            }

        )
        .setTimestamp();


    await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral
    });

}