import { SlashCommandSubcommandBuilder, ChannelType, PermissionFlagsBits } from "discord.js";
import Guild from "../../../models/Guild.js";

const data = new SlashCommandSubcommandBuilder()
    .setName("channel")
    .setDescription("Set the starboard channel for the server")
    .addChannelOption((option) =>
        option
        .setName("channel")
        .setDescription("The channel to set as the starboard")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildNews),
    );

const execute = async (interaction) => {
    const channel = interaction.options.getChannel("channel");

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({
          content: "You do not have permission to use this command >:(",
          ephemeral: true,
        });
    }

    try {
        await Guild.findOneAndUpdate(
            { id: interaction.guild.id },
            { starboard: { channel: channel.id, enabled: true } },
            { new: true, upsert: true }
        );

        return interaction.reply({
            content: `Starboard channel has been set to <#${channel.id}>!`,
            ephemeral: true,
        });
    } catch (error) {
        console.error("Error updating starboard channel:", error);
        return interaction.reply({
            content: "An error occurred while setting the starboard channel :(",
            ephemeral: true,
        });
    }
}

export default { data, execute };