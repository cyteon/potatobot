import { PermissionFlagsBits, SlashCommandSubcommandBuilder } from "discord.js";
import Guild from "../../../models/Guild.js";

const data = new SlashCommandSubcommandBuilder()
    .setName("disable")
    .setDescription("Disable the starboard for the server");

const execute = async (interaction) => {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({
            content: "You do not have permission to use this command >:(",
            ephemeral: true,
        });
    }

    try {
        await Guild.findOneAndUpdate(
            { id: interaction.guild.id },
            { "starboard.enabled": false },
            { new: true, upsert: true }
        );

        return interaction.reply({
            content: "Starboard has been disabled for this server :(",
            ephemeral: true,
        });
    } catch (error) {
        console.error("Error disabling starboard:", error);
        return interaction.reply({
            content: "An error occurred while disabling the starboard D:",
            ephemeral: true,
        });
    }
}

export default { data, execute };