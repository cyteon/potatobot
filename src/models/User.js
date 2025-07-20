import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  id: {
    // has to be compatible with a db a discord.py bot uses too
    type: BigInt,

    set: (v) => BigInt(v),
    get: (v) => v.toString(),
  },
  guild_id: {
    type: BigInt,

    set: (v) => BigInt(v),
    get: (v) => v.toString(),
  },
  xp: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model("User", userSchema, "users");