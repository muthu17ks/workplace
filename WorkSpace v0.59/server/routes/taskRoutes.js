const express = require('express');
const { getTasks, createTask, updateTask, deleteTask, deleteCompletedTasks, getTasksByDate } = require('../controllers/taskController');

const router = express.Router();

router.get('/', getTasks);
router.post('/', createTask);
router.get('/date/:date', getTasksByDate);
router.put('/:id', updateTask);
router.delete('/completed', deleteCompletedTasks);
router.delete('/:id', deleteTask);

module.exports = router;
