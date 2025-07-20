import mongoose from "mongoose";

const starboardSchema = new mongoose.Schema({
    message_id: {
        type: BigInt,
        set: (v) => BigInt(v),
        get: (v) => v.toString(),
    },
    starboard_id: {
        type: BigInt,
        set: (v) => BigInt(v),
        get: (v) => v.toString(),
    },
});

export default mongoose.model("Starboard", starboardSchema, "starboard");