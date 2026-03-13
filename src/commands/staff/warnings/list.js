import { PermissionFlagsBits, SlashCommandSubcommandBuilder } from "discord.js";
import User from "../../../models/User.js";

const data = new SlashCommandSubcommandBuilder()
  .setName("list")
  .setDescription("Get a user's warnings")
  .addUserOption((option) =>
    option.setName("user").setDescription("The user to check warnings for").setRequired(true),
  );

const execute = async function (interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return interaction.reply({
      content: "you can't do that! >:(",
      ephemeral: true,
    });
  }

  const user = interaction.options.getUser("user");

  const userData = await User.findOne({ id: user.id, guild_id: interaction.guild.id });

  const warnings = userData?.warnings ?? [];

  if (warnings.length === 0) {
    return interaction.reply({
      embeds: [{
        title: `warnings for ${user.username}`,
        description: "no warnings! what a good egg :3",
        color: 0x77dd77,
      }],
    });
  }

  const embed = {
    title: `warnings for ${user.username} (${warnings.length})`,
    fields: warnings.map((w, i) => ({
      name: `#${i + 1} — ${w.time}`,
      value: w.reason,
      inline: false,
    })),
    color: 0xff6961,
  };

  await interaction.reply({ embeds: [embed] });
};

export default { data, execute };
