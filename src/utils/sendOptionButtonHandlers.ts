import {
    MessageComponentInteraction,
    MessageFlags
} from "discord.js";
import { getTargetChannel, retrieveSendOptionData, cleanupSendOptionData } from "./sendOptions";
import { Config } from "../models/configModel";

// Store for announcement data
export const announceDataStore = new Map<string, any>();

// Store for message data
export const messageDataStore = new Map<string, any>();

/**
 * Handle announce send option buttons
 */
export async function handleAnnounceSendButton(
    interaction: MessageComponentInteraction
): Promise<void> {
    try {
        const userId = interaction.user.id;
        const option = interaction.customId === "send-current-channel"
            ? "current"
            : "announcement";

        if (interaction.customId === "send-cancel") {
            await interaction.update({
                content: "❌ Cancelled.",
                components: []
            });
            cleanupSendOptionData(userId, "announce", announceDataStore);
            return;
        }

        // Defer immediately
        await interaction.update({
            content: option === "current"
                ? "✅ Current channel selected."
                : "✅ Announcement channel selected.",
            components: []
        });

        // Get the data
        const announceData = retrieveSendOptionData(userId, "announce", announceDataStore);

        const config = await Config.findOne();
        if (!config) {
            await interaction.followUp({
                content: "❌ Configuration not found.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        // Get target channel
        const channel = await getTargetChannel(interaction, option as any, config.channelAnnouncementID);

        // Send the announcement
        await channel.send({
            content: announceData.content,
            embeds: announceData.embeds,
            allowedMentions: announceData.allowedMentions
        });

        // Confirm
        await interaction.followUp({
            content:
                `✅ Announcement sent successfully!\n\n` +
                `Channel: <#${channel.id}>\n` +
                `${announceData.additionalInfo ?? ""}`,
            flags: MessageFlags.Ephemeral
        });

        // Cleanup
        cleanupSendOptionData(userId, "announce", announceDataStore);

    } catch (error) {
        console.error("Error in handleAnnounceSendButton:", error);
        await interaction.followUp({
            content: `❌ ${
                error instanceof Error
                    ? error.message
                    : "An error occurred."
            }`,
            flags: MessageFlags.Ephemeral
        });
    }
}

/**
 * Handle message send option buttons
 */
export async function handleMessageSendButton(
    interaction: MessageComponentInteraction
): Promise<void> {
    try {
        const userId = interaction.user.id;
        const option = interaction.customId === "send-current-channel"
            ? "current"
            : "announcement";

        if (interaction.customId === "send-cancel") {
            await interaction.update({
                content: "❌ Cancelled.",
                components: []
            });
            cleanupSendOptionData(userId, "message", messageDataStore);
            return;
        }

        // Defer immediately
        await interaction.update({
            content: option === "current"
                ? "✅ Current channel selected."
                : "✅ Announcement channel selected.",
            components: []
        });

        // Get the data
        const messageData = retrieveSendOptionData(userId, "message", messageDataStore);

        const config = await Config.findOne();
        if (!config) {
            await interaction.followUp({
                content: "❌ Configuration not found.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        // Get target channel
        const channel = await getTargetChannel(interaction, option as any, config.channelAnnouncementID);

        // Store channel for role selector
        messageDataStore.set(`${userId}:message:channel`, channel.id);
        messageDataStore.set(`${userId}:message:content`, messageData);

        // Show role selector
        const { RoleSelectMenuBuilder, ActionRowBuilder } = await import("discord.js");

        const roleSelector = new RoleSelectMenuBuilder()
            .setCustomId(`message-roles_${userId}`)
            .setPlaceholder("Select roles to ping (optional)")
            .setMinValues(0)
            .setMaxValues(25);

        const roleRow = new ActionRowBuilder()
            .addComponents(roleSelector);

        await interaction.followUp({
            content: "📢 Select roles to ping (optional):",
            components: [roleRow as any],
            flags: MessageFlags.Ephemeral
        });

    } catch (error) {
        console.error("Error in handleMessageSendButton:", error);
        await interaction.followUp({
            content: `❌ ${
                error instanceof Error
                    ? error.message
                    : "An error occurred."
            }`,
            flags: MessageFlags.Ephemeral
        });
    }
}