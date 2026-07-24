import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    MessageFlags
} from "discord.js";

import {Config} from "../models/configModel";

export const setupCommand = new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Configure the bot.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    .addChannelOption(option => option
        .setName("announcement-channel")
        .setDescription("Select a channel for Announcements.")
        .setRequired(false)
    )
    .addChannelOption(option =>
        option
            .setName("reminder-channel")
            .setDescription("Select a channel for DV reminder.")
            .setRequired(false)
    )
    .addChannelOption(option =>
    option
        .setName("fountain-channel")
        .setDescription("Select a channel for Fountain messages.")
        .setRequired(false)
    )
    .addRoleOption(option =>
        option
            .setName("role")
            .setDescription("Select a role.")
            .setRequired(false)
    )
    .addIntegerOption(option =>
        option
            .setName("hour")
            .setDescription("Hour (0-23)")
            .setRequired(false)
            .setMinValue(0)
            .setMaxValue(23)
    )
    .addIntegerOption(option =>
        option
            .setName("minute")
            .setDescription("Minute (0-59)")
            .setRequired(false)
            .setMinValue(0)
            .setMaxValue(59)
    );

export async function handleSetup(
    interaction: ChatInputCommandInteraction
) {
    const channelAnnouncement = interaction.options.getChannel("announcement-channel", false);
    const channelReminder = interaction.options.getChannel("reminder-channel", false);
    const channelFountain =  interaction.options.getChannel("fountain-channel", false);
    const role = interaction.options.getRole("role", false);
    const hour = interaction.options.getInteger("hour", false);
    const minute = interaction.options.getInteger("minute", false);
    const days = [0,1,3,4,5,6]

    const config = await Config.findOne();

    if (!config) {

        throw new Error(
            "Configuration not found."
        );

    }

    config.channelAnnouncementID = channelAnnouncement?.id || config.channelAnnouncementID;

    config.channelReminderID = channelReminder?.id || config.channelReminderID;

    config.channelFountainID = channelFountain?.id || config.channelFountainID;

    config.roleID = role?.id || config.roleID;

    config.hour = Number(hour) || config.hour;

    config.minute = Number(minute) || config.minute;

    config.days = days;

    await config.save();


    await interaction.reply({
        content: `Configuration Saved!`,
        flags: MessageFlags.Ephemeral
    });
}
