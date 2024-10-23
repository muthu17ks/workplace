const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  dueDate: { type: Date, required: false },
  timeLimit: { type: String, required: false },
});

const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);
module.exports = Task;
