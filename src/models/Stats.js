import mongoose from "mongoose";

const statsSchema = new mongoose.Schema({
  commands_ran: { type: Number, default: 0 },
  ai_requests: { type: Number, default: 0 },
});

export default mongoose.model("Stats", statsSchema, "stats");
