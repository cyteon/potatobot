import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from "discord.js";
import Starboard from "../models/Starboard.js";
import Guild from "../models/Guild.js";
import ReactionRole from "../models/ReactionRole.js";

export default {
    name: "messageReactionAdd",
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

        if (reaction.emoji.name == "⭐") {
            const data = await Guild.findOne({ id: message.guild.id });
            if (!data || !data.starboard || !data.starboard.channel || !data.starboard.enabled) return;

            const reactionCount = message.reactions.cache.get("⭐")?.count || 0;
            if (reactionCount < data.starboard.threshold) return;

            const channel = message.guild.channels.cache.get(data.starboard.channel);

            if (!channel) {
                console.error(`Starboard channel ${data.starboard.channel} not found in guild ${message.guild.name} :(`);
                return;
            }

            const starboardMessageData = await Starboard.findOne({
                message_id: message.id,
            });

            if (starboardMessageData) {
                try {
                    const starboardMessage = await channel.messages.fetch(starboardMessageData.starboard_id);

                    if (starboardMessage) {
                        await starboardMessage.edit({
                            content: `⭐ ${reactionCount}`,
                        });

                        return;
                    }
                } catch (error) {
                    console.error("Error fetching or editing starboard message:", error);
                }
            }

            try {
                const embed = new EmbedBuilder()
                    .setAuthor({
                        name: message.author.tag,
                        iconURL: message.author.displayAvatarURL({ dynamic: true }),
                    })
                    .setDescription(message.content || "No content")
                    .setColor("#FFD700")
                    .setTimestamp(message.createdAt);
                
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel("Jump to Message")
                            .setStyle("Link")
                            .setURL(`https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`),
                    );

                const starboardMessage = await channel.send({
                    content: `⭐ ${reactionCount}`,
                    embeds: [embed],
                    files: message.attachments.map((attachment) => attachment.url),
                    components: [row],
                });

                await Starboard.create({
                    message_id: message.id,
                    starboard_id: starboardMessage.id,
                });
            } catch (error) {
                console.error("Error sending starboard message:", error);
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

            if (!member.roles.cache.has(role.id)) {
                try {
                    await member.roles.add(role);
                    console.log(`Added role ${role.name} to ${member.user.tag} for reaction ${reaction.emoji.name}`);
                } catch (error) {
                    console.error(`Failed to add role ${role.name} to ${member.user.tag}:`, error);
                }
            }
        }
    }
}