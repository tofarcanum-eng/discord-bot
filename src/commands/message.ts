import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    RoleSelectMenuBuilder,
    MessageComponentInteraction,
    MessageFlags, ModalSubmitInteraction
} from "discord.js";
import {Config} from "../models/configModel";

// Store message data temporarily (max 15 min before Discord discards interaction)
const messageDataStore = new Map<string, string>();

export const messageCommand = new SlashCommandBuilder()
    .setName("message")
    .setDescription("Send a custom announcement message (no embed)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function handleMessageCommand(
    interaction: ChatInputCommandInteraction
) {
    try {
        // Create modal for message content
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

        // Store the content temporarily
        messageDataStore.set(
            interaction.user.id,
            content
        );

        const selector = new RoleSelectMenuBuilder()
            .setCustomId("message-roles")
            .setPlaceholder("Select roles to ping.")
            .setMinValues(0)
            .setMaxValues(5);


        const row =
            new ActionRowBuilder<RoleSelectMenuBuilder>()
                .addComponents(selector);


        await interaction.reply({

            content:
                "Select the roles you would like to ping.",

            components:[
                row
            ],

            flags:
            MessageFlags.Ephemeral

        });

    } catch (error) {
        console.error("Error in handleMessageModalSubmit:", error);
        if (!interaction.replied) {
            await interaction.reply({
                content: "❌ An error occurred processing the modal.",
                flags: MessageFlags.Ephemeral
            });
        }
    }
}

/**
 * Handle role selection and send message
 */
export async function handleMessageRoleSelect(
    interaction: MessageComponentInteraction
) {
    try {
        if (!interaction.isRoleSelectMenu()) return;

        let content = messageDataStore.get(
            interaction.user.id
        );

        if (!content) {
            await interaction.reply({
                content: "❌ Message data expired. Please run /message again.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        // Get selected role IDs
        const selectedRoleIds = interaction.values;

        // Defer reply as we're about to send a message
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Get the channel
        const config = await Config.findOne();
        if(!config) return;
        const channel = await interaction.client.channels.fetch(

            config.channelAnnouncementID

        );

        // Add role pings at the beginning if any roles selected
        const rolePings = selectedRoleIds
            .map(id => `<@&${id}>`)
            .join(" ");

        if (rolePings.length > 0) {
            content = `${rolePings}\n\n${content}`;
        }

        // Send the message
        if (!channel?.isTextBased() || !channel?.isSendable()) {
            await interaction.reply({

                content:
                    "❌ Announcement channel is invalid.",

                flags:
                MessageFlags.Ephemeral

            });
            return;

        }

        await channel.send({
            content,
            allowedMentions: {
                roles: selectedRoleIds
            }
        });

        // Confirm to admin
        const rolesCount = selectedRoleIds.length;
        await interaction.editReply({
            content: `✅ Message sent to <#${channel.id}>!\n\n` +
                `📢 Roles pinged: ${rolesCount > 0 ? rolesCount : 'None'}`
        });

        // Clean up
        messageDataStore.delete(interaction.user.id);

    } catch (error) {
        console.error("Error in handleMessageRoleSelect:", error);
        if (!interaction.replied) {
            await interaction.reply({
                content: "❌ An error occurred sending the message.",
                flags: MessageFlags.Ephemeral
            });
        }
    }
}