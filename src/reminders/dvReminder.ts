import {
    Client,
    TextChannel,
    EmbedBuilder,
    AttachmentBuilder
} from "discord.js";

import cron from "node-cron";

import { Config } from "../models/configModel";
import { isDvAvailable } from "../utils/isDvAvailable";
import { dvReminderMessage } from "../messages/dvReminderMessage";

export function startDvReminder(client: Client) {

    const file = new AttachmentBuilder(
        "./assets/anya_forger_spying.gif"
    );

    console.log(
        "⏰ DV Reminder scheduler started."
    );

    cron.schedule(

        "* * * * *",

        async () => {
            try {

                // Always fetch the latest configuration
                const config = await Config.findOne();

                if (!config) {
                    return;
                }

                const now = new Date();

                // Current IST time
                const currentHour = Number(
                    now.toLocaleString(
                        "en-US",
                        {
                            timeZone: "Asia/Kolkata",
                            hour: "numeric",
                            hour12: false
                        }
                    )
                );

                const currentMinute = Number(
                    now.toLocaleString(
                        "en-US",
                        {
                            timeZone: "Asia/Kolkata",
                            minute: "numeric"
                        }
                    )
                );

                // Sunday = 0 .... Saturday = 6
                const currentDay = now.getDay();


                // Wrong hour
                if (currentHour !== config.hour) {
                    return;
                }


                // Wrong minute
                if (currentMinute !== config.minute) {
                    return;
                }


                // Not a reminder day
                if (
                    !config.days.includes(
                        currentDay
                    )
                ) {
                    return;
                }


                // DV unavailable
                if (
                    !isDvAvailable(config)
                ) {

                    console.log(
                        "⏸️ DV unavailable."
                    );

                    return;
                }


                const channel =
                    await client.channels.fetch(
                        config.channelID
                    );


                if (
                    !(channel instanceof TextChannel)
                ) {

                    console.log(
                        "❌ Invalid channel."
                    );

                    return;
                }


                const reminder =
                    new EmbedBuilder()

                        .setTitle(
                            dvReminderMessage.title
                        )

                        .setDescription(
                            dvReminderMessage.description
                        )

                        .setThumbnail(
                            "attachment://anya_forger_spying.gif"
                        )

                        .setTimestamp()

                        .setColor(
                            0xFF6B6B
                        );


                await channel.send({

                    content:
                        `<@&${config.roleID}>`,

                    embeds: [
                        reminder
                    ],

                    files: [
                        file
                    ]

                });


                console.log(
                    "✅ Reminder sent successfully."
                );

            }

            catch (error) {

                console.error(
                    "❌ Error sending reminder:",
                    error
                );

            }

        },

        {
            timezone: "Asia/Kolkata"
        }

    );

}