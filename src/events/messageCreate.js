import Guild from "../models/Guild.js";
import User from "../models/User.js";
import { LEVELS } from "../utils/levels.js";

export default {
  name: "messageCreate",
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;

    const data = await User.findOne({
      id: message.author.id,
      guild_id: message.guild.id,
    });

    if (!data) {
      await User.create({
        id: message.author.id,
        guild_id: message.guild.id,
        xp: 0,
        level: 0,
      });
      return;
    }

    const xpToAdd = Math.floor(Math.random() * 3) + 1;
    data.xp += xpToAdd;

    if (data.xp >= LEVELS[data.level + 1]) {
      data.xp = 0;
      data.level += 1;

      const guildData = await Guild.findOne({ id: message.guild.id });

      if (
        guildData &&
        guildData.level_roles &&
        guildData.level_roles.get(data.level.toString())
      ) {
        const roleId = guildData.level_roles.get(data.level.toString());
        const role = message.guild.roles.cache.get(roleId);

        if (role) {
          const member = message.guild.members.cache.get(message.author.id);

          if (member && !member.roles.cache.has(roleId)) {
            try {
              await member.roles.add(role);
              console.log(`Added role '${role.name}' to ${message.author.tag}`);
            } catch (error) {
              console.error(
                `Failed to add role '${role.name}' to ${message.author.tag}:`,
                error,
              );
            }
          }
        }
      }

      message.reply({
        content: `:tada: Congratulations ${message.author}, you leveled up to level **${data.level}**!`,
      });
    }

    await data.save().catch(console.error);
  },
};