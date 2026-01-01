# This project is licensed under the terms of the GPL v3.0 license. Copyright 2024 Cyteon

import discord
from discord.ext import commands
from discord.ext.commands import Context
from utils import CONSTANTS, DBClient, Checks, CachedDB

from ui.starboard import JumpToMessageView

client = DBClient.client
db = client.potatobot

class Starboard(commands.Cog, name="⭐ Starboard"):
    def __init__(self, bot) -> None:
        self.bot = bot

    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload) -> None:
        channel = self.bot.get_channel(payload.channel_id)
        message = await channel.fetch_message(payload.message_id)

        if message.author.bot:
            return

        col = db["guilds"]
        guild = await CachedDB.find_one(col, {"id": payload.guild_id})

        if not guild:
            return

        if "starboard" not in guild:
            return

        if guild["starboard"]["channel"] == 0:
            return

        if "enabled" in guild["starboard"]:
            if not guild["starboard"]["enabled"]:
                return

        if "blacklisted_channels" in guild["starboard"]:
            if payload.channel_id in guild["starboard"]["blacklisted_channels"]:
                return

        starboard_col = db["starboard"]
        starboard_message = await CachedDB.find_one(starboard_col, {"message_id": message.id})
        starboard_channel = self.bot.get_channel(guild["starboard"]["channel"])

        star_reactions = 0
        for r in message.reactions:
            if r.emoji == "⭐":
                star_reactions = r.count

        if payload.emoji.name == "⭐":
            if star_reactions >= guild["starboard"]["threshold"]:
                if not starboard_message:
                    embed = discord.Embed(
                        description=message.content,
                        color=0xFFD700,
                        timestamp=message.created_at
                    )

                    embed.set_author(name=message.author, icon_url=message.author.display_avatar.url)

                    if message.attachments:
                        embed.set_image(url=message.attachments[0].url)

                    label = "⭐ " + str(star_reactions)

                    msg = await starboard_channel.send(label, embed=embed, view=JumpToMessageView(message))

                    newdata = {
                        "message_id": message.id,
                        "starboard_id": msg.id
                    }

                    starboard_col.insert_one(newdata)
                else:
                    embed = discord.Embed(
                        description=message.content,
                        color=0xFFD700,
                        timestamp=message.created_at
                    )

                    embed.set_author(name=message.author, icon_url=message.author.display_avatar.url)

                    if message.attachments:
                        embed.set_image(url=message.attachments[0].url)

                    label = "⭐ " + str(star_reactions)

                    starboard_message = await starboard_channel.fetch_message(starboard_message["starboard_id"])

                    await starboard_message.edit(content=label, embed=embed, view=JumpToMessageView(message))

    @commands.Cog.listener()
    async def on_raw_reaction_remove(self, payload) -> None:
        channel = self.bot.get_channel(payload.channel_id)
        message = await channel.fetch_message(payload.message_id)

        if message.author.bot:
            return

        col = db["guilds"]
        guild = await CachedDB.find_one(col, {"id": payload.guild_id})

        if not guild:
            return

        if "starboard" not in guild:
            return

        if guild["starboard"]["channel"] == 0:
            return

        if "enabled" in guild["starboard"]:
            if not guild["starboard"]["enabled"]:
                return
        
        if "blacklisted_channels" in guild["starboard"]:
            if payload.channel_id in guild["starboard"]["blacklisted_channels"]:
                return

        star_reactions = 0
        for r in message.reactions:
            if r.emoji == "⭐":
                star_reactions = r.count

        starboard_col = db["starboard"]
        starboard_message = await CachedDB.find_one(starboard_col, {"message_id": message.id})
        starboard_channel = self.bot.get_channel(guild["starboard"]["channel"])

        if not starboard_channel:
            return

        if not starboard_message:
            return

        if payload.emoji.name == "⭐":
            embed = discord.Embed(
                description=message.content,
                color=0xFFD700,
                timestamp=message.created_at
            )

            embed.set_author(name=message.author, icon_url=message.author.display_avatar.url)

            label = "⭐ " + str(star_reactions)

            if message.attachments:
                embed.set_image(url=message.attachments[0].url)

            starboard_message_obj = await starboard_channel.fetch_message(starboard_message["starboard_id"])

            await starboard_message_obj.edit(content=label, embed=embed, view=JumpToMessageView(message))

    @commands.hybrid_group(
        name="starboard",
        description="Commands for managing the starboard.",
        usage="starboard <subcommand>"
    )
    @commands.check(Checks.is_not_blacklisted)
    @commands.check(Checks.command_not_disabled)
    async def starboard(self, context: Context) -> None:
        prefix = await self.bot.get_prefix(context)
        subcommands = [cmd for cmd in self.starboard.walk_commands()]
        data = []

        for subcommand in subcommands:
            description = subcommand.description.partition("\n")[0]
            data.append(f"{prefix}starboard {subcommand.qualified_name.replace('starboard ', '')} - {description}")

        help_text = "\n".join(data)
        embed = discord.Embed(
            title=f"Help: Starboard", description="List of available commands:", color=0xBEBEFE
        )
        embed.add_field(
            name="Commands", value=f"```{help_text}```", inline=False
        )

        await context.send(embed=embed)

    @starboard.command(
        name="channel",
        description="Set the starboard channel.",
        usage="starboard channel <channel>"
    )
    @commands.check(Checks.is_not_blacklisted)
    @commands.check(Checks.command_not_disabled)
    @commands.has_permissions(manage_channels=True)
    async def set_starboard(self, context: Context, channel: discord.TextChannel) -> None:
        col = db["guilds"]
        guild = await CachedDB.find_one(col, {"id": context.guild.id})

        if not guild:
            await col.insert_one(CONSTANTS.guild_data_template(context.guild.id))

        newdata = {
            "$set": {
                "starboard.channel": channel.id
            }
        }

        await CachedDB.update_one(col, {"id": context.guild.id}, newdata)
        await context.send(f"Starboard channel set to {channel.mention}.")

    @starboard.command(
        name="threshold",
        description="Set the star threshold for the starboard.",
        usage="starboard threshold <threshold>"
    )
    @commands.check(Checks.is_not_blacklisted)
    @commands.check(Checks.command_not_disabled)
    @commands.has_permissions(manage_channels=True)
    async def set_threshold(self, context: Context, threshold: int) -> None:
        col = db["guilds"]
        guild = await CachedDB.find_one(col, {"id": context.guild.id})

        if not guild:
            await col.insert_one(CONSTANTS.guild_data_template(context.guild.id))

        newdata = {
            "$set": {
                "starboard.threshold": threshold
            }
        }

        await CachedDB.update_one(col, {"id": context.guild.id}, newdata)
        await context.send(f"Starboard threshold set to {threshold}.")

    @starboard.group(
        name="blacklist",
        description="Manage blacklisted channels for the starboard.",
        usage="starboard blacklist <add/remove>"
    )
    @commands.check(Checks.is_not_blacklisted)
    @commands.check(Checks.command_not_disabled)
    @commands.has_permissions(manage_channels=True)
    async def blacklist(self, context: Context) -> None:
        if context.invoked_subcommand is None:
            await context.send_help(context.command)

    @blacklist.command(
        name="add",
        description="Add a channel to the starboard blacklist.",
        usage="starboard blacklist add <channel>"
    )
    @commands.check(Checks.is_not_blacklisted)
    @commands.check(Checks.command_not_disabled)
    @commands.has_permissions(manage_channels=True)
    async def blacklist_add(self, context: Context, channel: discord.TextChannel) -> None:
        col = db["guilds"]
        guild = await CachedDB.find_one(col, {"id": context.guild.id})

        if not guild:
            await col.insert_one(CONSTANTS.guild_data_template(context.guild.id))
            guild = await CachedDB.find_one(col, {"id": context.guild.id})

        if "blacklisted_channels" not in guild["starboard"]:
            await col.update_one({"id": context.guild.id}, {"$set": {"starboard.blacklisted_channels": []}})

        await col.update_one({"id": context.guild.id}, {"$addToSet": {"starboard.blacklisted_channels": channel.id}})
        await context.send(f"{channel.mention} has been added to the starboard blacklist.")

    @blacklist.command(
        name="remove",
        description="Remove a channel from the starboard blacklist.",
        usage="starboard blacklist remove <channel>"
    )
    @commands.check(Checks.is_not_blacklisted)
    @commands.check(Checks.command_not_disabled)
    @commands.has_permissions(manage_channels=True)
    async def blacklist_remove(self, context: Context, channel: discord.TextChannel) -> None:
        col = db["guilds"]
        guild = await CachedDB.find_one(col, {"id": context.guild.id})

        if not guild or "blacklisted_channels" not in guild["starboard"]:
            return await context.send("This channel is not blacklisted.")

        await col.update_one({"id": context.guild.id}, {"$pull": {"starboard.blacklisted_channels": channel.id}})
        await context.send(f"{channel.mention} has been removed from the starboard blacklist.")

    @starboard.command(
        name="disable",
        description="Disable the starboard.",
        usage="starboard disable"
    )
    @commands.check(Checks.is_not_blacklisted)
    @commands.check(Checks.command_not_disabled)
    @commands.has_permissions(manage_channels=True)
    async def disable_starboard(self, context: Context) -> None:
        col = db["guilds"]
        newdata = {"$set": {"starboard.enabled": False}}
        await CachedDB.update_one(col, {"id": context.guild.id}, newdata)
        await context.send("Starboard disabled.")

    @starboard.command(
        name="enable",
        description="Enable the starboard.",
        usage="starboard enable"
    )
    @commands.check(Checks.is_not_blacklisted)
    @commands.check(Checks.command_not_disabled)
    @commands.has_permissions(manage_channels=True)
    async def enable_starboard(self, context: Context) -> None:
        col = db["guilds"]
        newdata = {"$set": {"starboard.enabled": True}}
        await CachedDB.update_one(col, {"id": context.guild.id}, newdata)
        await context.send("Starboard enabled.")

async def setup(bot) -> None:
    await bot.add_cog(Starboard(bot))