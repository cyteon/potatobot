const { db } = require('../lib/database');

module.exports = [
    {
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

            const messageData = await db.collection('reactionroles').findOne({ message_id: reaction.message.id });
            if (!messageData) return;

            // Determine the emoji identifier
            const emojiId = reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name;
            if (!messageData.roles[emojiId]) return;

            const guild = reaction.message.guild;
            if (!guild) return;

            const role = guild.roles.cache.get(messageData.roles[emojiId]);
            if (!role) return;

            const member = guild.members.cache.get(user.id);
            if (!member) return;

            try {
                await member.roles.add(role);
                console.log(`Added role ${role.name} to ${member.user.tag}`);
            } catch (error) {
                console.error('Failed to add role:', error);
            }
        }
    },
    {
        name: 'messageReactionRemove',
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

            const messageData = await db.collection('reactionroles').findOne({ message_id: reaction.message.id });
            if (!messageData) return;

            // Determine the emoji identifier
            const emojiId = reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name;
            if (!messageData.roles[emojiId]) return;

            const guild = reaction.message.guild;
            if (!guild) return;

            const role = guild.roles.cache.get(messageData.roles[emojiId]);
            if (!role) return;

            const member = guild.members.cache.get(user.id);
            if (!member) return;

            try {
                await member.roles.remove(role);
                console.log(`Removed role ${role.name} from ${member.user.tag}`);
            } catch (error) {
                console.error('Failed to remove role:', error);
            }
        }
    }
]; 