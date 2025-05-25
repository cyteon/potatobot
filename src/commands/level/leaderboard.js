const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../lib/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('See the top 10 users with the most xp in this server')
        .setAliases(['lb']),

    async execute(interaction) {
        const users = await db.collection('users')
            .find({ guild_id: interaction.guild.id })
            .sort({ level: -1, xp: -1 })
            .limit(10)
            .toArray();

        const embed = new EmbedBuilder()
            .setTitle('Leaderboard')
            .setColor(0xFFD700);

        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const member = interaction.guild.members.cache.get(user.id);

            if (member && !member.user.bot) {
                embed.addFields({
                    name: `${i + 1}. ${member.nickname || member.displayName || member.user.username}`,
                    value: `Level: ${user.level} - XP: ${user.xp}`,
                    inline: false
                });
            } else {
                try {
                    const fetchedUser = await interaction.client.users.fetch(user.id);
                    if (!fetchedUser.bot) {
                        embed.addFields({
                            name: `${i + 1}. ${fetchedUser.username}`,
                            value: `Level: ${user.level} - XP: ${user.xp}`,
                            inline: false
                        });
                    }
                } catch {
                    embed.addFields({
                        name: `${i + 1}. Unknown User`,
                        value: `Level: ${user.level} - XP: ${user.xp}`,
                        inline: false
                    });
                }
            }
        }

        await interaction.reply({ embeds: [embed] });
    },
}; 