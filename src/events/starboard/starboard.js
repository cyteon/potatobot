const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { db } = require('../lib/database');

module.exports = {
    name: 'messageReactionAdd',
    async execute(reaction, user) {
        // Handle partial reactions
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Error fetching reaction:', error);
                return;
            }
        }

        // Handle partial messages
        if (reaction.message.partial) {
            try {
                await reaction.message.fetch();
            } catch (error) {
                console.error('Error fetching message:', error);
                return;
            }
        }

        const { message } = reaction;
        if (message.author.bot) return;

        const guild = await db.collection('guilds').findOne({ id: message.guild.id });
        if (!guild || !guild.starboard || !guild.starboard.enabled || guild.starboard.channel === 0) return;

        if (reaction.emoji.name === '⭐') {
            const starboardChannel = message.guild.channels.cache.get(guild.starboard.channel);
            if (!starboardChannel) return;

            const starReactions = message.reactions.cache.get('⭐')?.count || 0;
            if (starReactions >= guild.starboard.threshold) {
                const starboardMessage = await db.collection('starboard').findOne({ message_id: message.id });

                const embed = new EmbedBuilder()
                    .setDescription(message.content)
                    .setColor(0xFFD700)
                    .setTimestamp(message.createdAt)
                    .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() });

                if (message.attachments.size > 0) {
                    embed.setImage(message.attachments.first().url);
                }

                const jumpButton = new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setLabel('Jump to message')
                    .setURL(`https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`);

                const row = new ActionRowBuilder().addComponents(jumpButton);

                if (!starboardMessage) {
                    const msg = await starboardChannel.send({
                        content: `⭐ ${starReactions}`,
                        embeds: [embed],
                        components: [row]
                    });

                    await db.collection('starboard').insertOne({
                        message_id: message.id,
                        starboard_id: msg.id
                    });
                } else {
                    const starboardMsg = await starboardChannel.messages.fetch(starboardMessage.starboard_id);
                    await starboardMsg.edit({
                        content: `⭐ ${starReactions}`,
                        embeds: [embed],
                        components: [row]
                    });
                }
            }
        }
    },
}; 