import { SlashCommandBuilder } from "@discordjs/builders";
import { PermissionFlagsBits } from "discord.js";
import Guild from "../../models/Guild.js";

const data = new SlashCommandBuilder()
  .setName("nick")
  .setDescription("Change or reset a user's nickname")
  .setIntegrationTypes(0)
  .addUserOption((option) =>
    option.setName("user").setDescription("The user to nickname").setRequired(true),
  )
  .addStringOption((option) =>
    option.setName("nickname").setDescription("The new nickname (leave empty to reset)"),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames);

const execute = async function (interaction) {
  const user = interaction.options.getUser("user");
  const nickname = interaction.options.getString("nickname") || null;
  const member = interaction.guild.members.cache.get(user.id);

  if (!member) {
    return interaction.reply({
      embeds: [{ title: "couldn't find that member :O", color: 0xfdfd96 }],
    });
  }

  if (
    interaction.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 &&
    interaction.user.id !== interaction.guild.ownerId
  ) {
    return interaction.reply({
      embeds: [{ title: "you can't nick someone with a higher or equal role! >:(", color: 0xfdfd96 }],
    });
  }

  try {
    await member.setNickname(nickname, `Changed by ${interaction.user.tag}`);
  } catch (_) {
    return interaction.reply({
      embeds: [{ title: "i can't change that user's nickname :c", color: 0xfdfd96 }],
    });
  }

  const embed = {
    title: nickname ? "nickname changed :D" : "nickname reset :D",
    description: nickname
      ? `<@${user.id}>'s nickname is now **${nickname}**`
      : `<@${user.id}>'s nickname has been reset`,
    color: 0x56b3fa,
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
