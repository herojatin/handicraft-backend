import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    venue: { type: String, required: true },
    
   startDate: {
  type: Date,
  required: true,
},
endDate: {
  type: Date,
  required: true,
},
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    description: String,
  },
  { timestamps: true }
);


export default mongoose.model("Event", eventSchema);