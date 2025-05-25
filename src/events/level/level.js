const { db } = require('../lib/database');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (!message.guild || message.author.bot) return;

        const userData = await db.collection('users').findOne({
            id: message.author.id,
            guild_id: message.guild.id
        });

        if (!userData) {
            await db.collection('users').insertOne({
                id: message.author.id,
                guild_id: message.guild.id,
                xp: 0,
                level: 0
            });
            return;
        }

        // Add random XP between 1-3
        const xpGain = Math.floor(Math.random() * 3) + 1;
        userData.xp += xpGain;

        // Calculate XP needed for next level
        const xpForNextLevel = Math.floor(100 * Math.pow(1.1, userData.level));

        // Check for level up
        if (userData.xp >= xpForNextLevel) {
            userData.level += 1;
            userData.xp = 0;

            // Get guild data for level roles and announcements
            const guildData = await db.collection('guilds').findOne({ id: message.guild.id });
            if (guildData) {
                // Handle level roles
                if (guildData.level_roles && guildData.level_roles[userData.level]) {
                    const role = message.guild.roles.cache.get(guildData.level_roles[userData.level]);
                    if (role) {
                        try {
                            await message.member.roles.add(role);
                        } catch (error) {
                            console.error('Error adding level role:', error);
                        }
                    }
                }

                // Handle level up announcements
                let announceChannel = message.channel;
                if (guildData.level_announce_channel) {
                    const channel = message.guild.channels.cache.get(guildData.level_announce_channel);
                    if (channel) announceChannel = channel;
                }

                if (guildData.should_announce_levelup !== false) {
                    await announceChannel.send(`${message.author} leveled up to level ${userData.level}!`);
                }
            }
        }

        // Update user data in database
        await db.collection('users').updateOne(
            { id: message.author.id, guild_id: message.guild.id },
            { $set: { xp: userData.xp, level: userData.level } }
        );
    },
}; 