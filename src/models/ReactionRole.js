import mongoose from "mongoose";

const reactionRoleSchema = new mongoose.Schema({
    message_id: {
        type: BigInt,
        set: (v) => BigInt(v),
        get: (v) => v.toString(),
    },
    roles: Map,
});

export default mongoose.model("ReactionRole", reactionRoleSchema, "reaction_roles");