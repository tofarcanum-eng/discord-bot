import { Client, TextChannel, EmbedBuilder, AttachmentBuilder } from "discord.js";
import cron from "node-cron";
import {isDvAvailable } from "../utils/isDvAvailable";
import { dvReminderMessage } from "../messages/dvReminderMessage";
import {Config} from "../models/configModel";

export async function startDvReminder(client: Client) {
    const config = await Config.findOne();
    if (!config) {
        return;
    }
    const days = config.days.join(",");

    const cronTime = `${config.minute} ${config.hour} * * ${days}`;

    const file = new AttachmentBuilder(

        "./assets/anya_forger_spying.gif"

    );


    console.log(`⏰ DV Reminder scheduled at: ${config.hour}:${config.minute.toString().padStart(2, "0")} IST`);
    console.log(`📋 Cron pattern: ${cronTime}`);

    cron.schedule(
        cronTime,
        async () => {
            try {
                // Check if DV is available
                if (!isDvAvailable(config)) {
                    console.log("⏸️  DV is unavailable - reminder skipped");
                    return;
                }

                const channel = await client.channels.fetch(config.channelID);

                if (!(channel instanceof TextChannel)) {
                    console.log("❌ Channel is not a text channel");
                    return;
                }

                const reminder = new EmbedBuilder()
                    .setTitle(dvReminderMessage.title)
                    .setDescription(dvReminderMessage.description)
                    .setThumbnail("attachment://anya_forger_spying.gif")
                    .setTimestamp()
                    .setColor(0xFF6B6B); // Red color for urgency

                await channel.send({
                    content: `<@&${config.roleID}>`,
                    embeds: [reminder],
                    files: [file]
                });

                console.log("✅ Reminder sent successfully");
            } catch (error) {
                console.error("❌ Error sending reminder:", error);
            }
        },
        {
            timezone: "Asia/Kolkata"
        }
    );
}