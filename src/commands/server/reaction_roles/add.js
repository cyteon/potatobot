import { PermissionFlagsBits, SlashCommandSubcommandBuilder } from "discord.js";
import ReactionRole from "../../../models/ReactionRole.js";

const data = new SlashCommandSubcommandBuilder()
    .setName("add")
    .setDescription("Add a reaction role to a message")
    .addStringOption((option) =>
        option
            .setName("message_id")
            .setDescription("The ID of the message to add the reaction role to")
            .setRequired(true)
    )
    .addStringOption((option) =>
        option
            .setName("emoji")
            .setDescription("The emoji to react with")
            .setRequired(true)
    )
    .addRoleOption((option) =>
        option
            .setName("role")
            .setDescription("The role to assign when the emoji is reacted with")
            .setRequired(true)
    );

const execute = async (interaction, client) => {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.reply({
            content: "You do not have permission to manage roles >:(",
            ephemeral: true,
        });
    }

    const messageId = interaction.options.getString("message_id");
    const role = interaction.options.getRole("role");

    let emoji = interaction.options.getString("emoji");

    if (emoji.startsWith("<") && emoji.endsWith(">")) {
        const match = emoji.match(/<a?:\w+:(\d+)>/);

        if (match) {
            emoji = match[1];
        } else {
            emoji = emoji.replace(/<:\w+:/, "").replace(">", "");
        }
    } else {
        emoji = interaction.guild.emojis.cache.find(e => e.name === emoji) || emoji;
    }

    try {
        const data = await ReactionRole.findOneAndUpdate(
            { message_id: messageId },
            {
                $set: {
                    [`roles.${emoji}`]: role.id,
                },
            },
            { upsert: true, new: true }
        );

        if (!data) {
            return interaction.reply({
                content: "Failed to add reaction role :(",
                ephemeral: true,
            });
        }

        try {
            const message = await interaction.channel.messages.fetch(messageId);
            if (message) {
                

                await message.react(emoji);
                return interaction.reply({
                    content: "Reaction role added successfully, and i reacted to the message with it :D",
                    ephemeral: true,
                });
            } else {
                return interaction.reply({
                    content: "Reaction role added, react to the message with the emoji manually, i couldnt fetch the message :/",
                    ephemeral: true,
                });
            }
        } catch (error) {
            console.error("Error fetching message:", error);
            return interaction.reply({
                content: "Reaction role added, react to the message with the emoji manually, i couldnt fetch the message :/",
                ephemeral: true,
            });
        }
    } catch (error) {
        console.error("Error adding reaction role:", error);
        return interaction.reply({
            content: "An error occurred while adding the reaction role D:",
            ephemeral: true,
        });
    }
}

export default { data, execute };