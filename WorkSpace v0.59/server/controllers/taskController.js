const Task = require('../models/Task');

const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find().sort({
      completed: 1,
      dueDate: 1
    });
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Error fetching tasks' });
  }
};

const createTask = async (req, res) => {
  const { text, dueDate } = req.body;
  try {
    if (!text) {
      return res.status(400).json({ error: 'Task text is required' });
    }

    const task = new Task({
      text,
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    await task.save();
    res.json(task);
  } catch (err) {
    console.error('Error adding task:', err);
    res.status(500).json({ error: 'Error adding task' });
  }
};

const updateTask = async (req, res) => {
  const { text, completed, dueDate } = req.body;
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (text !== undefined) task.text = text;
    if (completed !== undefined) task.completed = completed;
    if (dueDate !== undefined) task.dueDate = new Date(dueDate);

    await task.save();
    res.json(task);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Error updating task' });
  }
};

const getTasksByDate = async (req, res) => {
  const { date } = req.params;
  try {
    const tasks = await Task.find({
      dueDate: {
        $gte: new Date(date + 'T00:00:00.000Z'),
        $lt: new Date(date + 'T23:59:59.999Z'),
      },
    }).sort({ dueDate: 1 });
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks for the specific date:', err);
    res.status(500).json({ error: 'Error fetching tasks for the specific date' });
  }
};

const deleteCompletedTasks = async (req, res) => {
  try {
    await Task.deleteMany({ completed: true });
    res.status(200).send({ message: 'All completed tasks deleted' });
  } catch (error) {
    console.error('Error deleting completed tasks:', error);
    res.status(500).send({ error: 'Error deleting completed tasks' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    await Task.findByIdAndDelete(req.params.id);
    res.sendStatus(200);
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Error deleting task' });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  deleteCompletedTasks,
  getTasksByDate,
};
