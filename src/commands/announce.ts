import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ModalSubmitInteraction,
    EmbedBuilder,
    MessageFlags
} from "discord.js";
import { Config } from "../models/configModel";
import { showSendOptions, storeSendOptionData } from "../utils/sendOptions";
import { announceDataStore } from "../utils/sendOptionButtonHandlers";

export const announceCommand = new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Create an announcement.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function handleAnnounce(
    interaction: ChatInputCommandInteraction
) {
    const modal = new ModalBuilder()
        .setCustomId("announce-modal")
        .setTitle("Announcement");

    const title = new TextInputBuilder()
        .setCustomId("title")
        .setLabel("Title")
        .setRequired(true)
        .setStyle(TextInputStyle.Short)
        .setMaxLength(256);

    const description = new TextInputBuilder()
        .setCustomId("description")
        .setLabel("Description")
        .setRequired(true)
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(4000);

    const thumbnail = new TextInputBuilder()
        .setCustomId("thumbnail")
        .setLabel("Thumbnail URL (Optional)")
        .setRequired(false)
        .setStyle(TextInputStyle.Short);

    const role = new TextInputBuilder()
        .setCustomId("role")
        .setLabel("Role ID (Optional)")
        .setRequired(false)
        .setStyle(TextInputStyle.Short);

    const color = new TextInputBuilder()
        .setCustomId("color")
        .setLabel("Hex Color (Optional)")
        .setPlaceholder("Example: FF6B6B")
        .setRequired(false)
        .setStyle(TextInputStyle.Short);

    modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(title),
        new ActionRowBuilder<TextInputBuilder>().addComponents(description),
        new ActionRowBuilder<TextInputBuilder>().addComponents(thumbnail),
        new ActionRowBuilder<TextInputBuilder>().addComponents(role),
        new ActionRowBuilder<TextInputBuilder>().addComponents(color)
    );

    await interaction.showModal(modal);
}

export async function handleAnnounceModal(
    interaction: ModalSubmitInteraction
) {
    try {
        const title = interaction.fields.getTextInputValue("title");
        const description = interaction.fields.getTextInputValue("description");
        const thumbnail = interaction.fields.getTextInputValue("thumbnail");
        const roleID = interaction.fields.getTextInputValue("role");
        const color = interaction.fields.getTextInputValue("color");

        const config = await Config.findOne();

        if (!config) {
            await interaction.reply({
                content: "❌ Configuration not found.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        // Build embed
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setTimestamp();

        if (thumbnail) {
            embed.setThumbnail(thumbnail);
        }

        if (color && /^[0-9A-Fa-f]{6}$/.test(color)) {
            embed.setColor(Number(`0x${color}`));
        } else {
            embed.setColor(0xFF6B6B);
        }

        // Prepare data for button handler
        const announceData = {
            title,
            description,
            content: roleID ? `<@&${roleID}>` : "",
            embeds: [embed],
            allowedMentions: {
                roles: roleID ? [roleID] : []
            },
            additionalInfo: `📌 Title: ${title}`
        };

        // Store data
        storeSendOptionData(interaction.user.id, "announce", announceData, announceDataStore);

        // Show send options
        await showSendOptions(interaction);

    } catch (error) {
        console.error("Announcement Error:", error);

        if (!interaction.replied) {
            await interaction.reply({
                content: `❌ ${error instanceof Error ? error.message : "Failed to send announcement."}`,
                flags: MessageFlags.Ephemeral
            });
        } else {
            await interaction.editReply({
                content: `❌ ${error instanceof Error ? error.message : "Failed to send announcement."}`
            });
        }
    }
}