import { PermissionFlagsBits, SlashCommandSubcommandBuilder } from "discord.js";
import ReactionRole from "../../../models/ReactionRole.js";

const data = new SlashCommandSubcommandBuilder()
    .setName("remove")
    .setDescription("Remove a reaction role from a message")
    .addStringOption((option) =>
        option
            .setName("message_id")
            .setDescription("The ID of the message to remove the reaction role from")
            .setRequired(true)
    )
    .addStringOption((option) =>
        option
            .setName("emoji")
            .setDescription("The emoji to remove the reaction role for")
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
                $unset: {
                    [`roles.${emoji}`]: "",
                },
            },
            { new: true }
        );

        if (!data) {
            return interaction.reply({
                content: "No reaction role found for this message and emoji :p",
                ephemeral: true,
            });
        }

        if (Object.keys(data.roles).length === 0) {
            await ReactionRole.deleteOne({ message_id: messageId });
        }

        try {
            const message = await interaction.channel.messages.fetch(messageId);
            
            if (message) {
                await message.reactions.cache.get(emoji)?.remove();
            }
        } catch (error) {
            console.error("Error fetching message or removing reaction:", error);
        }

        return interaction.reply({
            content: `Removed reaction role for emoji \`${emoji}\` from message \`${messageId}\` :)`,
            ephemeral: true,
        });
    } catch (error) {
        console.error("Error removing reaction role:", error);
        return interaction.reply({
            content: "Failed to remove reaction role :(",
            ephemeral: true,
        });
    }
}

export default { data, execute };