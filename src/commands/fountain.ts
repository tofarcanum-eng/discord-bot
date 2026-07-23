import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ModalSubmitInteraction,
    EmbedBuilder,
    MessageFlags,
    AttachmentBuilder
} from "discord.js";
import { Config } from "../models/configModel";

export const fountainCommand = new SlashCommandBuilder()

    .setName("fountain")

    .setDescription(
        "Create a high diamonds fountain location message."
    )


export async function handleFountain(
    interaction: ChatInputCommandInteraction
) {

    const modal = new ModalBuilder()

        .setCustomId(
            "fountain-modal"
        )

        .setTitle(
            "Fountain"
        );


    const square =

        new TextInputBuilder()

            .setCustomId(
                "square"
            )

            .setLabel(
                "Square number between 1-20"
            )

            .setRequired(
                true
            )

            .setStyle(
                TextInputStyle.Short
            )

            .setMaxLength(
                256
            );


    const diamonds =

        new TextInputBuilder()

            .setCustomId(
                "diamonds"
            )

            .setLabel(
                "Diamonds 20k - 70k"
            )

            .setRequired(
                true
            )

            .setStyle(
                TextInputStyle.Short
            )

            .setMaxLength(
                256
            );

    modal.addComponents(

        new ActionRowBuilder<TextInputBuilder>()

            .addComponents(
                square
            ),

        new ActionRowBuilder<TextInputBuilder>()

            .addComponents(
                diamonds
            ),

    );


    await interaction.showModal(
        modal
    );

}



export async function handleFountainModal(

    interaction: ModalSubmitInteraction

) {

    try {

        const square = Number(interaction.fields
            .getTextInputValue(
                "square"
            )
        );


        if (

            !Number.isInteger(square) ||

            square < 1 ||

            square > 20

        ){

            await interaction.reply({

                content:
                    "❌ square number must be an integer between 1 and 20.",

                flags:
                MessageFlags.Ephemeral

            });

            return;

        }


        const diamonds = Number(interaction.fields
            .getTextInputValue(
                "diamonds"
            ))

        if (

            !Number.isInteger(diamonds) || diamonds < 20000 || diamonds > 70000

        ){

            await interaction.reply({

                content:
                    "❌ diamonds amount must be an number and between 20000 and 70000",

                flags:
                MessageFlags.Ephemeral

            });

            return;

        }

        const member = interaction.user.displayName;

        const config =

            await Config.findOne();


        if (!config) {

            await interaction.reply({

                content:
                    "❌ Configuration not found.",

                flags:
                MessageFlags.Ephemeral

            });

            return;

        }


        const channel =

            await interaction.client.channels.fetch(

                config.channelFountainID

            );


        if (!channel?.isTextBased() || !channel?.isSendable()) {
            await interaction.reply({

                content:
                    "❌ Announcement channel is invalid.",

                flags:
                MessageFlags.Ephemeral

            });
            return;

        }

        const file = new AttachmentBuilder(
            "./assets/Screenshot_2026-07-22_212038-removebg-preview.png"
        );


        const embed =

            new EmbedBuilder()

                .setTitle(
                    "High Diamonds Fountain"
                )

                .setDescription(
                    "Square number: " + square + "\nNo. of Diamonds: " + diamonds + "\nBy: " + member
                )

                .setTimestamp();

            embed.setThumbnail(
                "attachment://Screenshot_2026-07-22_212038-removebg-preview.png"
            );
            embed.setColor(

                Number(
                    0x00FFFF
                )

            );

        await channel.send({

            embeds: [
                embed
            ],

            files: [
                file
            ]
        });


        await interaction.reply({

            content:
                "✅ Announcement sent successfully.",

            flags:
            MessageFlags.Ephemeral

        });

    }catch (error) {

        console.error(
            "Fountain message Error:",
            error
        );


        if (!interaction.replied) {

            await interaction.reply({

                content:
                    "❌ Failed to send fountain message.",

                flags:
                MessageFlags.Ephemeral

            });

        }

    }

}