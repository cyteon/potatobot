import { SlashCommandSubcommandBuilder, ChannelType, PermissionFlagsBits } from "discord.js";
import Guild from "../../../models/Guild.js";

const data = new SlashCommandSubcommandBuilder()
    .setName("threshold")
    .setDescription("Set the starboard threshold for the server")
    .addIntegerOption((option) =>
        option
            .setName("threshold")
            .setDescription("The number of stars required to add a message to the starboard")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100),
    );

const execute = async (interaction) => {
    const threshold = interaction.options.getInteger("threshold");

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({
            content: "You do not have permission to use this command >:(",
            ephemeral: true,
        });
    }

    try {
        await Guild.findOneAndUpdate(
            { id: interaction.guild.id },
            { "starboard.threshold": threshold },
            { new: true, upsert: true }
        );

        return interaction.reply({
            content: `Starboard threshold has been set to ${threshold} stars :D`,
            ephemeral: true,
        });
    } catch (error) {
        console.error("Error updating starboard threshold:", error);
        return interaction.reply({
            content: "An error occurred while setting the starboard threshold :(",
            ephemeral: true,
        });
    }
}

export default { data, execute };