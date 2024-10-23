import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import './DashboardTasks.css';

const DashboardTasks = ({ selectedDate, tasks, onToggleTaskCompletion }) => {
  const [tasksForSelectedDate, setTasksForSelectedDate] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const filteredTasks = tasks
        .filter(task => dayjs(task.dueDate).isSame(selectedDate, 'day'))
        .sort((a, b) => a.completed - b.completed);

      setTasksForSelectedDate(filteredTasks);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load tasks. Please try again.');
      setIsLoading(false);
    }
  }, [selectedDate, tasks]);

  if (isLoading) {
    return <div className="dashboard-tasks-loading">Loading tasks...</div>;
  }

  return (
    <div className="dashboard-tasks-container">
      <h2 className="dashboard-tasks-title">
        Tasks for {selectedDate.format('MMM DD, YYYY')}
      </h2>
      {error && <p className="dashboard-tasks-error">{error}</p>}
      {tasksForSelectedDate.length === 0 ? (
        <p className="dashboard-tasks-no-tasks">No tasks for this day.</p>
      ) : (
        <ul className="dashboard-tasks-list">
          {tasksForSelectedDate.map(task => (
            <li
              key={task._id}
              className={`dashboard-tasks-item ${task.completed ? 'dashboard-tasks-completed' : ''
                }`}
            >
              <div className="tasks-checkbox-wrapper-12">
                <div className="tasks-cbx">
                  <input
                    checked={task.completed}
                    type="checkbox"
                    id={`cbx-selected-${task._id}`}
                    onChange={() => onToggleTaskCompletion(task)}
                  />
                  <label htmlFor={`cbx-selected-${task._id}`}></label>
                  <svg fill="none" viewBox="0 0 15 14" height="14" width="15">
                    <path d="M2 8.36364L6.23077 12L13 2"></path>
                  </svg>
                </div>
              </div>
              <div className="dashboard-tasks-info">
                <span className="dashboard-tasks-text">{task.text}</span>
                <span className="dashboard-tasks-due-date">
                  {task.dueDate &&
                    dayjs(task.dueDate).format('MMM DD, YYYY HH:mm')}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DashboardTasks;
