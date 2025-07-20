import { PermissionFlagsBits, SlashCommandSubcommandBuilder } from "discord.js";
import Guild from "../../../models/Guild.js";

const data = new SlashCommandSubcommandBuilder()
    .setName("enable")
    .setDescription("Enable the starboard for the server");

const execute = async (interaction) => {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({
            content: "You do not have permission to use this command >:(", 
            ephemeral: true,
        });
    }

    try {
        const data = await Guild.findOne({ id: interaction.guild.id });

        if (!data?.starboard?.channel) {
            return interaction.reply({
                content: "You need to set a starboard channel first, using `/starboard channel` :|",
                ephemeral: true,
            });
        }

        data.starboard.enabled = true;
        await data.save();

        return interaction.reply({
            content: "Starboard has been enabled for this server :D",
            ephemeral: true,
        });
    } catch (error) {
        console.error("Error enabling starboard:", error);
        return interaction.reply({
            content: "An error occurred while enabling the starboard :c",
            ephemeral: true,
        });
    }
}

export default { data, execute };