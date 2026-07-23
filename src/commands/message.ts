import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    MessageFlags,
    ModalSubmitInteraction,
    MessageComponentInteraction
} from "discord.js";
import { Config } from "../models/configModel";
import { showSendOptions, storeSendOptionData } from "../utils/sendOptions";
import { messageDataStore } from "../utils/sendOptionButtonHandlers";

export const messageCommand = new SlashCommandBuilder()
    .setName("message")
    .setDescription("Send a custom announcement message (no embed)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function handleMessageCommand(
    interaction: ChatInputCommandInteraction
) {
    try {
        const modal = new ModalBuilder()
            .setCustomId(`message-modal`)
            .setTitle("Send Announcement");

        const messageInput = new TextInputBuilder()
            .setCustomId("message_content")
            .setLabel("Message Content")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Enter your announcement here...")
            .setRequired(true)
            .setMaxLength(4000);

        const row = new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    } catch (error) {
        console.error("Error in handleMessageCommand:", error);
    }
}

/**
 * Handle modal submission
 */
export async function handleMessageModalSubmit(
    interaction: ModalSubmitInteraction
) {
    try {
        const content = interaction.fields.getTextInputValue("message_content");

        const config = await Config.findOne();
        if (!config) {
            await interaction.reply({
                content: "❌ Configuration not found.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        // Store the message content
        storeSendOptionData(interaction.user.id, "message", content, messageDataStore);

        // Show send options
        await showSendOptions(interaction);

    } catch (error) {
        console.error("Error in handleMessageModalSubmit:", error);
        if (!interaction.replied) {
            await interaction.reply({
                content: `❌ ${error instanceof Error ? error.message : "An error occurred processing the modal."}`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
}

/**
 * Handle role selection and send message
 * This is called from the message send button handler
 */
export async function handleMessageRoleSelect(
    interaction: MessageComponentInteraction
) {
    try {
        if (!interaction.isRoleSelectMenu()) return;

        const userIdFromCustomId = interaction.customId.split("_")[1];
        const channelId = messageDataStore.get(`${userIdFromCustomId}:message:channel`);
        const content = messageDataStore.get(`${userIdFromCustomId}:message:content`);

        if (!content || !channelId) {
            await interaction.reply({
                content: "❌ Message data expired. Please run /message again.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        // Get selected role IDs
        const selectedRoleIds = interaction.values;

        // Defer reply
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Get the channel
        const channel = await interaction.client.channels.fetch(channelId);

        if (!channel?.isTextBased() || !channel?.isSendable()) {
            await interaction.editReply({
                content: "❌ Target channel is invalid."
            });
            return;
        }

        // Build message with role pings
        let finalContent = content;
        if (selectedRoleIds.length > 0) {
            const rolePings = selectedRoleIds.map(id => `<@&${id}>`).join(" ");
            finalContent = `${rolePings}\n\n${content}`;
        }

        // Send the message
        await channel.send({
            content: finalContent,
            allowedMentions: {
                roles: selectedRoleIds
            }
        });

        // Confirm to admin
        await interaction.editReply({
            content: `✅ Message sent to <#${channelId}>!\n📢 Roles pinged: ${selectedRoleIds.length > 0 ? selectedRoleIds.length : "None"}`
        });

        // Clean up
        messageDataStore.delete(userIdFromCustomId);
        messageDataStore.delete(`${userIdFromCustomId}:message:channel`);
        messageDataStore.delete(`${userIdFromCustomId}:message:content`);

    } catch (error) {
        console.error("Error in handleMessageRoleSelect:", error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: `❌ ${error instanceof Error ? error.message : "An error occurred sending the message."}`,
                flags: MessageFlags.Ephemeral
            });
        } else {
            await interaction.editReply({
                content: `❌ ${error instanceof Error ? error.message : "An error occurred sending the message."}`
            });
        }
    }
}