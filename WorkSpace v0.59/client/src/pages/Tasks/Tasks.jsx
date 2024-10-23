import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Tasks.css';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar, DatePicker, TimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { IconButton, Menu, MenuItem } from '@mui/material';
import { Badge } from '@mui/material';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { DayCalendarSkeleton } from '@mui/x-date-pickers/DayCalendarSkeleton';


function ServerDay(props) {
  const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;

  const isSelected =
    !outsideCurrentMonth && highlightedDays.indexOf(day.date()) >= 0;

  return (
    <Badge
      key={day.toString()}
      overlap="circular"
      badgeContent={isSelected ? (
        <span style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: 'orange',
        }} />
      ) : undefined}
    >
      <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
    </Badge>
  );
}

const TasksManager = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(null);
  const [newTaskTime, setNewTaskTime] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [editingTaskDate, setEditingTaskDate] = useState(null);
  const [editingTaskTime, setEditingTaskTime] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuTaskId, setMenuTaskId] = useState(null);
  const inputRef = useRef(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [highlightedDays, setHighlightedDays] = React.useState([]);

  useEffect(() => {
    const tasksListContainer = document.querySelector('.tasks-list-incomplete');
    const tasksContainer = document.querySelector('.tasks-manager-container');
    if (tasksListContainer) {
      const hasCompletedTasks = tasks.some(task => task.completed);
      if (!hasCompletedTasks) {
        tasksListContainer.classList.add('no-completed-tasks');
        tasksContainer.classList.add('completed-tasks');
      } else {
        tasksListContainer.classList.remove('no-completed-tasks');
        tasksContainer.classList.remove('completed-tasks');
      }
    }
  }, [tasks]);

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('http://localhost:3001/tasks');
        setTasks(response.data);
        setHighlightedDays(fetchHighlightedDays(selectedDate, response.data));
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, [selectedDate]);

  const fetchHighlightedDays = (date, tasks) => {
    return tasks
    .filter((task) => !task.completed && dayjs(task.dueDate).isSame(date, 'month'))
    .map((task) => dayjs(task.dueDate).date());
  };

  const handleMonthChange = (date) => {
    setHighlightedDays(fetchHighlightedDays(date, tasks));
  };
  useEffect(() => {
    setHighlightedDays(fetchHighlightedDays(selectedDate, tasks));
  }, [tasks, selectedDate]); 

  const tasksForSelectedDate = tasks.filter((task) =>
    task.dueDate && dayjs(task.dueDate).isSame(selectedDate, 'day')
  );

  const handleInputChange = (e) => {
    setNewTask(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const deleteAllCompletedTasks = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete all completed tasks? This action cannot be undone.");

    if (confirmDelete) {
      try {
        await axios.delete('http://localhost:3001/tasks/completed');
        setTasks(tasks.filter(task => !task.completed));
      } catch (error) {
        console.error('Error deleting completed tasks:', error);
      }
    }
  };

  const addTask = async () => {
    if (newTask.trim() !== '') {
      try {
        let dueDate = null;
        if (newTaskDate) {
          dueDate = dayjs(newTaskDate)
            .set('hour', newTaskTime ? dayjs(newTaskTime).hour() : 0)
            .set('minute', newTaskTime ? dayjs(newTaskTime).minute() : 0)
            .toISOString();
        }
        const response = await axios.post('http://localhost:3001/tasks', {
          text: newTask,
          dueDate,
        });
        setTasks([...tasks, response.data]);
        setNewTask('');
        setNewTaskDate(null);
        setNewTaskTime(null);
        inputRef.current.focus();
      } catch (error) {
        console.error('Error adding task:', error);
      }
    }
  };


  const startEditing = (task) => {
    setEditingTaskId(task._id);
    setEditingTaskText(task.text);
    setEditingTaskDate(task.dueDate ? dayjs(task.dueDate) : null);
    setEditingTaskTime(task.dueDate ? dayjs(task.dueDate) : null);
    inputRef.current.focus();
  };

  const saveEdit = async () => {
    if (editingTaskText.trim() !== '') {
      try {
        let dueDate = null;
        if (editingTaskDate) {
          dueDate = dayjs(editingTaskDate)
            .set('hour', editingTaskTime ? dayjs(editingTaskTime).hour() : 0)
            .set('minute', editingTaskTime ? dayjs(editingTaskTime).minute() : 0)
            .toISOString();
        }
        const response = await axios.put(`http://localhost:3001/tasks/${editingTaskId}`, {
          text: editingTaskText,
          dueDate,
        });
        setTasks(tasks.map(task => (task._id === editingTaskId ? response.data : task)));
        setEditingTaskId(null);
        setEditingTaskText('');
        setEditingTaskDate(null);
        setEditingTaskTime(null);
        inputRef.current.focus();
      } catch (error) {
        console.error('Error updating task:', error);
      }
    }
  };


  const toggleTaskCompletion = async (id, completed) => {
    try {
      const response = await axios.put(`http://localhost:3001/tasks/${id}`, { completed: !completed });

      const updatedTask = response.data;

      setTasks(prevTasks => {
        const remainingTasks = prevTasks.filter(task => task._id !== id);

        if (updatedTask.completed) {
          return [...remainingTasks, updatedTask];
        } else {
          return [...remainingTasks, { ...updatedTask, completed: false }];
        }
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };


  const deleteTask = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/tasks/${id}`);
      setTasks(tasks.filter(task => task._id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const sortTasksByDate = (tasksArray) => {
    return tasksArray.sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate) : new Date();
      const dateB = b.dueDate ? new Date(b.dueDate) : new Date();
      return dateA - dateB;
    });
  };

  const incompleteTasks = sortTasksByDate(tasks.filter(task => !task.completed));
  const completedTasks = sortTasksByDate(tasks.filter(task => task.completed));

  const handleClick = (event, taskId) => {
    setAnchorEl(event.currentTarget);
    setMenuTaskId(taskId);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setMenuTaskId(null);
  };

  const handleEditClick = (task) => {
    startEditing(task);
    handleClose();
  };

  const handleDeleteClick = (taskId) => {
    deleteTask(taskId);
    handleClose();
  };

  const handleNotCompletedClick = async (taskId) => {
    await toggleTaskCompletion(taskId, true);
    handleClose();
  };

  return (
    <div className="tasks-manager-container">
      <div className="tasks-calendar">
        <div className='tasks-month-calendar'>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar
              value={selectedDate}
              onChange={(newValue) => {
                setSelectedDate(newValue);
              }}
              onMonthChange={handleMonthChange}
              renderLoading={() => <DayCalendarSkeleton />}
              slots={{
                day: ServerDay,
              }}
              slotProps={{
                day: {
                  highlightedDays,
                },
              }}
            />
          </LocalizationProvider>
        </div>
        <div className="tasks-for-selected-date">
          <h3 className="tasks-side-heading">Tasks for {selectedDate.format('MMM DD, YYYY')}</h3>
          {tasksForSelectedDate.length === 0 ? (
            <p className='tasks-for-the-selected-date-text'>No tasks for this day</p>
          ) : (
            <div className="tasks-table">
              <div className="tasks-table-header">
                <span className="tasks-header-title">Today's Tasks</span>
                <span className="tasks-header-due-date">Due Date</span>
              </div>
              <ul className="tasks-list tasks-for-selected-date">
                {tasksForSelectedDate.map((task) => (
                  <li key={task._id} className="daily-task-item">
                    <div className="tasks-checkbox-wrapper-12">
                      <div className="tasks-cbx">
                        <input
                          checked={task.completed}
                          type="checkbox"
                          id={`cbx-selected-${task._id}`}
                          onChange={() => toggleTaskCompletion(task._id, task.completed)}
                        />
                        <label htmlFor={`cbx-selected-${task._id}`}></label>
                        <svg fill="none" viewBox="0 0 15 14" height="14" width="15">
                          <path d="M2 8.36364L6.23077 12L13 2"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="daily-task-item-content">
                      <span className={task.completed ? "daily-task-text completed" : "daily-task-text"}>
                        {task.text}
                      </span>
                      <span className="daily-task-due-date">
                        {task.dueDate ? dayjs(task.dueDate).format('MMM DD, YYYY HH:mm') : 'No due date'}
                      </span>
                    </div>
                    <div className="daily-task-more-ver">
                      <IconButton onClick={(event) => handleClick(event, task._id)} size="small">
                        <MoreVertIcon />
                      </IconButton>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="tasks-list-container">
        <h2 className="tasks-heading tasks-tasks-heading">Tasks</h2>
        <div className="tasks-input-container">
          <div className="tasks-date-time-picker">
            <input
              ref={inputRef}
              type="text"
              value={editingTaskId ? editingTaskText : newTask}
              onChange={editingTaskId ? (e) => setEditingTaskText(e.target.value) : handleInputChange}
              placeholder={editingTaskId ? "Edit task" : "Enter a new task"}
              className="tasks-input"
            />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                value={editingTaskId ? editingTaskDate : newTaskDate}
                onChange={(newValue) => {
                  if (editingTaskId) {
                    setEditingTaskDate(newValue);
                  } else {
                    setNewTaskDate(newValue);
                  }
                  setSelectedDate(newValue || selectedDate);
                }}
                className="tasks-date-picker"
                label="Select Date"
              />
              <TimePicker
                value={editingTaskId ? editingTaskTime : newTaskTime}
                onChange={(newValue) => editingTaskId ? setEditingTaskTime(newValue) : setNewTaskTime(newValue)}
                className="tasks-time-picker"
                label="Select Time"
              />
            </LocalizationProvider>
          </div>
          {editingTaskId ? (
            <button onClick={saveEdit} className="tasks-button tasks-save-button">
              Save
            </button>
          ) : (
            <button onClick={addTask} className="tasks-button tasks-add-button">
              Add Task
            </button>
          )}
        </div>
        <div className="tasks-table">
          <div className="tasks-table-header">
            <span className="tasks-header-title">Task</span>
            <span className="tasks-header-due-date">Due Date</span>
          </div>

          <ul className="tasks-list tasks-list-incomplete">
            {incompleteTasks.length === 0 ? (
              <li className="tasks-item add-task-item">
                <span className="tasks-text">All your tasks have been completed. Please add a new task.</span>
              </li>
            ) : (
              incompleteTasks.map((task) => (
                <li key={task._id} className="tasks-item">
                  <div className="tasks-checkbox-wrapper-12">
                    <div className="tasks-cbx">
                      <input
                        checked={task.completed}
                        type="checkbox"
                        id={`cbx-${task._id}`}
                        onChange={() => toggleTaskCompletion(task._id, task.completed)}
                      />
                      <label htmlFor={`cbx-${task._id}`}></label>
                      <svg fill="none" viewBox="0 0 15 14" height="14" width="15">
                        <path d="M2 8.36364L6.23077 12L13 2"></path>
                      </svg>
                    </div>
                  </div>
                  <span className={task.completed ? "tasks-text completed" : "tasks-text"}>
                    {task.text}
                  </span>
                  <span className="tasks-due-date">
                    {task.dueDate ? dayjs(task.dueDate).format('MMM DD, YYYY HH:mm') : 'No due date'}
                  </span>
                  <IconButton onClick={(event) => handleClick(event, task._id)} size="small">
                    <MoreVertIcon />
                  </IconButton>
                </li>
              ))
            )}
          </ul>

          {completedTasks.length > 0 && (
            <>
              <div className="tasks-header">
                <h3 className="tasks-heading tasks-completed-heading">
                  Completed Tasks
                  <button className="tasks-button tasks-delete-completed-button" onClick={deleteAllCompletedTasks}>
                    Delete All Completed
                  </button>
                </h3>
              </div>
              <ul className="tasks-list tasks-list-completed">
                {completedTasks.map((task) => (
                  <li key={task._id} className="tasks-item">
                    <div className="tasks-checkbox-wrapper-12">
                      <div className="tasks-cbx">
                        <input
                          checked={task.completed}
                          type="checkbox"
                          id={`cbx-completed-${task._id}`}
                          onChange={() => toggleTaskCompletion(task._id, task.completed)}
                        />
                        <label htmlFor={`cbx-completed-${task._id}`}></label>
                        <svg fill="none" viewBox="0 0 15 14" height="14" width="15">
                          <path d="M2 8.36364L6.23077 12L13 2"></path>
                        </svg>
                      </div>
                    </div>
                    <span className={task.completed ? "tasks-text completed" : "tasks-text"}>
                      {task.text}
                    </span>
                    <span className="tasks-due-date">
                      {task.dueDate ? dayjs(task.dueDate).format('MMM DD, YYYY HH:mm') : 'No due date'}
                    </span>
                    <IconButton onClick={(event) => handleClick(event, task._id)} size="small">
                      <MoreVertIcon />
                    </IconButton>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          {completedTasks.some(task => task._id === menuTaskId) && (
            <MenuItem onClick={() => handleNotCompletedClick(menuTaskId)}>
              Mark as Not Completed
            </MenuItem>
          )}
          <MenuItem onClick={() => handleEditClick(tasks.find(task => task._id === menuTaskId))}>
            Edit
          </MenuItem>
          <MenuItem onClick={() => handleDeleteClick(menuTaskId)}>
            Delete
          </MenuItem>
        </Menu>
      </div>
    </div>
  );
};

export default TasksManager;
