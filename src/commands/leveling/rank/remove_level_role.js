import { SlashCommandSubcommandBuilder } from "discord.js";
import Guild from "../../../models/Guild.js";

const data = new SlashCommandSubcommandBuilder()
    .setName("remove_level_role")
    .setDescription("Remove a level role from the server")
    .addIntegerOption((option) =>
        option
        .setName("level")
        .setDescription("The level to remove the role for")
        .setRequired(true),
    );

const execute = async (interaction) => {
    const level = interaction.options.getInteger("level");

    if (level < 0) {
        return interaction.reply({
            content: "Level cannot be negative :p",
            ephemeral: true,
        });
    }

    try {
        const guildData = await Guild.findOneAndUpdate(
            { id: interaction.guild.id },
            { $unset: { [`level_roles.${level}`]: "" } },
            { new: true, upsert: true },
        );

        if (!guildData) {
            return interaction.reply({
                content: "Failed to remove the level role :c",
                ephemeral: true,
            });
        }

        return interaction.reply({
            content: `Successfully removed the role for level **${level}**!`,
        });
    } catch (error) {
        console.error("Error removing level role:", error);
        return interaction.reply({
            content: "An error occurred while removing the level role :c",
            ephemeral: true,
        });
    }
}

export default { data, execute };