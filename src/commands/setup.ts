import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    MessageFlags
} from "discord.js";

import {Config} from "../models/configModel";

export const setupCommand = new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Configure the reminder bot.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
        option
            .setName("channel")
            .setDescription("Select a channel.")
            .setRequired(true)
    )
    .addRoleOption(option =>
        option
            .setName("role")
            .setDescription("Select a role.")
            .setRequired(true)
    )
    .addIntegerOption(option =>
        option
            .setName("hour")
            .setDescription("Hour (0-23)")
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(23)
    )
    .addIntegerOption(option =>
        option
            .setName("minute")
            .setDescription("Minute (0-59)")
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(59)
    );

export async function handleSetup(
    interaction: ChatInputCommandInteraction
) {
    const channel = interaction.options.getChannel("channel", true);
    const role = interaction.options.getRole("role", true);
    const hour = interaction.options.getInteger("hour", true);
    const minute = interaction.options.getInteger("minute", true);
    const days = [0,1,3,4,5,6]

    const config = await Config.findOne();

    if (!config) {

        throw new Error(
            "Configuration not found."
        );

    }

    config.channelID = channel.id;

    config.roleID = role.id;

    config.hour = hour;

    config.minute = minute;

    config.days = days;

    await config.save();

    await interaction.reply({
        content: `Configuration Saved!\n\n` +
            `Channel: <#${channel.id}>\n` +
            `Role: <@&${role.id}>\n` +
            `Time: ${hour}:${minute.toString().padStart(2, "0")}`,
        flags: MessageFlags.Ephemeral
    });
}
