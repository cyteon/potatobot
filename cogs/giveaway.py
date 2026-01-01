# This project is licensed under the terms of the GPL v3.0 license. Copyright 2024 Cyteon

import discord
import random
import datetime
import asyncio
import re

from discord.ext import commands, tasks
from discord.ext.commands import Context

from utils import Checks, DBClient

client = DBClient.client
db = client.potatobot

class Giveaway(commands.Cog, name="🎁 Giveaway"):
    def __init__(self, bot) -> None:
        self.bot = bot
        self.check_giveaways.start()

    def cog_unload(self):
        self.check_giveaways.cancel()

    def parse_duration(self, duration: str):
        time_dict = {"s": 1, "m": 60, "h": 3600, "d": 86400}
        pattern = re.compile(r"(\d+)([smhd])")
        matches = pattern.findall(duration.lower())
        if not matches:
            return None
        total_seconds = 0
        for amount, unit in matches:
            total_seconds += int(amount) * time_dict[unit]
        return total_seconds

    @tasks.loop(minutes=1.0)
    async def check_giveaways(self):
        col = db["giveaways"]
        now = datetime.datetime.now(datetime.timezone.utc).timestamp()
        
        active_giveaways = col.find({"ended": False, "end_at": {"$lte": now}})
        
        for g in active_giveaways:
            channel = self.bot.get_channel(g["channel_id"])
            if not channel:
                continue
            
            try:
                message = await channel.fetch_message(g["message_id"])
                await self.end_giveaway_logic(message)
                col.update_one({"message_id": g["message_id"]}, {"$set": {"ended": True}})
            except Exception:
                col.update_one({"message_id": g["message_id"]}, {"$set": {"ended": True}})

    async def end_giveaway_logic(self, message: discord.Message):
        users = []
        reaction = discord.utils.get(message.reactions, emoji="🎁")
        if not reaction:
            return await message.reply("Giveaway reaction not found.")

        async for u in reaction.users():
            if not u.bot:
                users.append(u)

        if not users:
            return await message.reply("No one entered the giveaway!")

        winner = random.choice(users)
        embed = discord.Embed(title="Giveaway ended!", description="The winner is: {0} 🎉🎉🎉".format(winner.mention), color=0xBEBEFE)
        await message.reply(winner.mention, embed=embed)

    @commands.hybrid_group(
        name="giveaway",
        description="Command to start or end giveaways",
        usage="giveaway"
    )
    @commands.check(Checks.is_not_blacklisted)
    @commands.check(Checks.command_not_disabled)
    @commands.has_permissions(manage_messages=True)
    async def giveaway(self, context: Context) -> None:
        prefix = await self.bot.get_prefix(context)

        cmds = "\n".join([f"{prefix}giveaway {cmd.name} - {cmd.description}" for cmd in self.giveaway.walk_commands()])

        embed = discord.Embed(
            title=f"Help: Giveaway", description="List of available commands:", color=0xBEBEFE
        )
        embed.add_field(
            name="Commands", value=f"```{cmds}```", inline=False
        )

        await context.send(embed=embed)

    @giveaway.command(
        name="start",
        description="Start a giveaway!",
        usage="giveaway start <time> <reward>"
    )
    @commands.check(Checks.is_not_blacklisted)
    @commands.check(Checks.command_not_disabled)
    @commands.has_permissions(manage_messages=True)
    async def giveaway_start(self, context: Context, duration: str, *, reward: str) -> None:
        seconds = self.parse_duration(duration)
        if not seconds:
            return await context.send("Invalid time format! Use e.g. 1h, 30m, 1d.")

        end_time = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=seconds)
        
        embed = discord.Embed(title="Giveaway!", description=reward, color=0xBEBEFE)
        embed.add_field(name="Ends At", value=f"<t:{int(end_time.timestamp())}:R>")
        embed.set_footer(text="React with 🎁 to enter!")

        message = await context.send(embed=embed)
        await message.add_reaction("🎁")

        db["giveaways"].insert_one({
            "guild_id": context.guild.id,
            "channel_id": context.channel.id,
            "message_id": message.id,
            "reward": reward,
            "end_at": end_time.timestamp(),
            "ended": False
        })

    @giveaway.command(
        name = "end",
        description = "Ends a giveaway manually using message id",
        usage = "giveaway end <message_id>"
    )
    @commands.check(Checks.is_not_blacklisted)
    @commands.check(Checks.command_not_disabled)
    @commands.has_permissions(manage_messages=True)
    async def giveaway_end(self, context: Context, message_id: int) -> None:
        message = await context.channel.fetch_message(message_id)
        await self.end_giveaway_logic(message)
        db["giveaways"].update_one({"message_id": message_id}, {"$set": {"ended": True}})

async def setup(bot) -> None:
    await bot.add_cog(Giveaway(bot))