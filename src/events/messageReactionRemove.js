import Starboard from "../models/Starboard.js";
import Guild from "../models/Guild.js";
import ReactionRole from "../models/ReactionRole.js";

export default {
    name: "messageReactionRemove",
    async execute(reaction, user) {
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error("Error fetching reaction:", error);
                return;
            }
        }

        let message = reaction.message;

        if (message.partial) {
            try {
                await message.fetch();
            } catch (error) {
                console.error("Error fetching message:", error);
                return;
            }
        }

        if (!message.guild) return;
        if (reaction.emoji.name === "⭐") {
            const data = await Guild.findOne({ id: message.guild.id });
            if (!data || !data.starboard || !data.starboard.channel || !data.starboard.enabled) return;

            const reactionCount = message.reactions.cache.get("⭐")?.count || 0;
            const channel = message.guild.channels.cache.get(data.starboard.channel);

            if (!channel) {
                console.error(`Starboard channel ${data.starboard.channel} not found in guild ${message.guild.name} :(`);
                return;
            }

            const starboardMessageData = await Starboard.findOne({
                message_id: message.id,
            });

            try {
                const starboardMessage = await channel.messages.fetch(starboardMessageData.starboard_id);

                if (starboardMessage) {
                    if (reactionCount < data.starboard.threshold) {
                        await starboardMessage.delete();
                        await Starboard.deleteOne({ message_id: message.id });
                        return;
                    } else {
                        await starboardMessage.edit({
                            content: `⭐ ${reactionCount}`,
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching starboard message:", error);
                return;
            }
        } else {
            if (message.author.bot) return;

            const reactionRoleData = await ReactionRole.findOne({
                message_id: message.id,
            });

            if (!reactionRoleData || !reactionRoleData.roles) return;

            const roleId = reactionRoleData.roles.get(reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name);
            if (!roleId) return;

            const role = message.guild.roles.cache.get(roleId);
            if (!role) return;

            let member = await message.guild.members.fetch(user.id).catch(() => null);

            try {
                await member.roles.remove(role);
                console.log(`Removed role ${role.name} from ${member.user.tag} for reaction ${reaction.emoji.name}`);
            } catch (error) {
                console.error("Error removing role:", error);
            }
        }
    }
}