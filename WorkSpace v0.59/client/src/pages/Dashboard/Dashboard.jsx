import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import Calendar from "./DashboardCalendar.jsx";
import MiniDrive from "./MiniDrive.jsx";
import DashboardTasks from "./DashboardTasks.jsx";
import DashboardMail from "./DashboardMail.jsx";
import RecentDocuments from "./RecentDocuments.jsx";
import dayjs from 'dayjs';
import axios from 'axios';

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get('http://localhost:3001/tasks');
        setTasks(response.data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setError('Failed to load tasks. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);


  const toggleTaskCompletion = async (task) => {
    try {
      const updatedTask = { ...task, completed: !task.completed };
      await axios.put(`http://localhost:3001/tasks/${task._id}`, updatedTask);
      setTasks(prevTasks =>
        prevTasks.map(t => (t._id === task._id ? updatedTask : t))
      );
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task. Please try again.');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-box box1">
        <RecentDocuments />
      </div>

      <div className="dashboard-box box2">
        <Calendar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          tasks={tasks}
          isLoading={isLoading}
          error={error}
        />
      </div>

      <div className="dashboard-box box3">
        <div className="dashboard-drive-component">
          <MiniDrive />
        </div>
      </div>

      <div className="dashboard-box box4">
        <DashboardMail />
      </div>

      <div className="dashboard-box box5">
        <DashboardTasks
          selectedDate={selectedDate}
          tasks={tasks}
          onToggleTaskCompletion={toggleTaskCompletion}
        />
      </div>
    </div>
  );
}
