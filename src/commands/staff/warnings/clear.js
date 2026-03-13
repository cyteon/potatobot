import { PermissionFlagsBits, SlashCommandSubcommandBuilder } from "discord.js";
import User from "../../../models/User.js";
import Guild from "../../../models/Guild.js";

const data = new SlashCommandSubcommandBuilder()
  .setName("clear")
  .setDescription("Clear a user's warnings")
  .addUserOption((option) =>
    option.setName("user").setDescription("The user to clear warnings for").setRequired(true),
  );

const execute = async function (interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return interaction.reply({
      content: "you can't do that! >:(",
      ephemeral: true,
    });
  }

  const user = interaction.options.getUser("user");

  await User.findOneAndUpdate(
    { id: user.id, guild_id: interaction.guild.id },
    { $set: { warnings: [] } },
    { upsert: true },
  );

  const embed = {
    title: "warnings cleared :broom:",
    description: `cleared all warnings for <@${user.id}>`,
    color: 0x77dd77,
  };

  await interaction.reply({ embeds: [embed] });

  const guild = await Guild.findOne({ id: interaction.guild.id });
  if (guild?.log_channel) {
    const channel = interaction.guild.channels.cache.get(guild.log_channel);
    if (channel) {
      await channel.send({
        embeds: [{
          ...embed,
          fields: [{ name: "Moderator", value: `<@${interaction.user.id}>` }],
        }],
      });
    }
  }
};

export default { data, execute };
