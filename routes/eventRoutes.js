import express from "express";
import Event from "../models/Event.js";

const router = express.Router();

// CREATE
router.post("/create", async (req, res) => {
  try {
    const { title, venue, date, startTime, endTime } = req.body;

    if (!title || !venue || !date || !startTime || !endTime) {
      return res.status(400).json({ error: "All fields required" });
    }

    // ✅ validation
    if (startTime >= endTime) {
      return res.status(400).json({
        error: "End time must be after start time",
      });
    }

    const event = new Event(req.body);
    await event.save();

    res.json(event);
  } catch (err) {
  console.error("ERROR:", err);   // 👈 IMPORTANT
  res.status(500).json({ error: err.message });
}
});

// GET ALL
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json({ events });
  } catch {
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// GET ONE
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json(event);
  } catch {
    res.status(500).json({ error: "Invalid ID" });
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  try {
    const { startTime, endTime } = req.body;

    // ✅ Only validate if both exist
    if (startTime && endTime && startTime >= endTime) {
      return res.status(400).json({
        error: "End time must be after start time",
      });
    }

    // ✅ Prevent empty updates
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: "No data provided",
      });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
  req.params.id,
  req.body,
  {
    new: true,
    runValidators: true,
  }
);

    if (!updatedEvent) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json(updatedEvent);
  } catch (err) {
    console.error(err); // 👈 ADD THIS
    res.status(500).json({ error: "Update failed" });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Event.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({ message: "Event deleted" });
  } catch {
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;