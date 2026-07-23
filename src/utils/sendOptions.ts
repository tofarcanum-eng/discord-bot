import {
    MessageComponentInteraction,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    MessageFlags,
    TextChannel,
    ModalSubmitInteraction,
    ChatInputCommandInteraction
} from "discord.js";

export type SendOption = "current" | "announcement" | "cancel";


/**
 * Show send options buttons to user
 * This should be called from modal submit or interaction
 * The button interaction will be handled separately in your command handlers
 */
export async function showSendOptions(
    interaction: ModalSubmitInteraction | ChatInputCommandInteraction | any
): Promise<void> {
    try {
        // Defer the interaction if not already deferred/replied
        if (!interaction.replied && !interaction.deferred) {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        }

        const currentChannelBtn = new ButtonBuilder()
            .setCustomId("send-current-channel")
            .setLabel("📢 Current Channel")
            .setStyle(ButtonStyle.Primary);

        const announcementChannelBtn = new ButtonBuilder()
            .setCustomId("send-announcement-channel")
            .setLabel("📣 Announcement Channel")
            .setStyle(ButtonStyle.Success);

        const cancelBtn = new ButtonBuilder()
            .setCustomId("send-cancel")
            .setLabel("❌ Cancel")
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(currentChannelBtn, announcementChannelBtn, cancelBtn);

        // Send the buttons
        await interaction.editReply({
            content: "Where would you like to send this?",
            components: [row]
        });

    } catch (error) {
        console.error("Error in showSendOptions:", error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: "❌ An error occurred showing send options.",
                flags: MessageFlags.Ephemeral
            });
        }
    }
}

/**
 * Get the target channel based on send option
 * Called from button handler
 */
export async function getTargetChannel(
    interaction: MessageComponentInteraction,
    option: SendOption,
    announcementChannelId: string
): Promise<TextChannel> {
    if (option === "current") {
        const channel = interaction.channel;
        if (!channel?.isTextBased() || !channel?.isSendable()) {
            throw new Error("Current channel is not text-based or not sendable");
        }
        return channel as TextChannel;
    } else if (option === "announcement") {
        const channel = await interaction.client.channels.fetch(announcementChannelId);
        if (!channel?.isTextBased() || !channel?.isSendable()) {
            throw new Error("Announcement channel is invalid or not sendable");
        }
        return channel as TextChannel;
    } else {
        throw new Error("Invalid send option");
    }
}

/**
 * Store send option data temporarily for button handler to access
 * Returns a key to store/retrieve the data
 */
export function storeSendOptionData(
    userId: string,
    dataKey: string,
    data: any,
    dataStore: Map<string, any>
): void {
    dataStore.set(`${userId}:${dataKey}`, data);
}

/**
 * Retrieve stored send option data
 */
export function retrieveSendOptionData(
    userId: string,
    dataKey: string,
    dataStore: Map<string, any>
): any {
    const data = dataStore.get(`${userId}:${dataKey}`);
    if (!data) {
        throw new Error("Data expired. Please run the command again.");
    }
    return data;
}

/**
 * Clean up stored data
 */
export function cleanupSendOptionData(
    userId: string,
    dataKey: string,
    dataStore: Map<string, any>
): void {
    dataStore.delete(`${userId}:${dataKey}`);
}