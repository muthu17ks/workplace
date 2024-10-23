import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { Badge, CircularProgress } from '@mui/material';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { DayCalendarSkeleton } from '@mui/x-date-pickers/DayCalendarSkeleton';
import "./DashboardCalendar.css"

function ServerDay(props) {
  const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;

  const isSelected = !outsideCurrentMonth && highlightedDays.indexOf(day.date()) >= 0;

  return (
    <Badge
      key={day.toString()}
      overlap="circular"
      badgeContent={isSelected ? (
        <span
          className="dashboard-calendar-badge"
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: 'orange',
          }}
        />
      ) : undefined}
    >
      <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} className="dashboard-calendar-day" />
    </Badge>
  );
}

const DashboardCalendar = ({ selectedDate, onDateChange, tasks, isLoading, error }) => {
  const [highlightedDays, setHighlightedDays] = useState([]);

  useEffect(() => {
    if (!isLoading && tasks.length > 0) {
      setHighlightedDays(fetchHighlightedDays(selectedDate, tasks));
    }
  }, [selectedDate, tasks, isLoading]);

  const fetchHighlightedDays = (date, tasks) => {
    return tasks
      .filter((task) => 
        dayjs(task.dueDate).isSame(date, 'month') && !task.completed 
      )
      .map((task) => dayjs(task.dueDate).date());
  };

  const handleMonthChange = (date) => {
    setHighlightedDays(fetchHighlightedDays(date, tasks));
  };

  const handleDateChange = (newDate) => {
    onDateChange(newDate);
  };

  return (
    <div className="dashboard-calendar-container">
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateCalendar
          value={selectedDate}
          onChange={handleDateChange}
          onMonthChange={handleMonthChange}
          renderLoading={() => <DayCalendarSkeleton className="dashboard-calendar-skeleton" />}
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
  );
};

DashboardCalendar.propTypes = {
  selectedDate: PropTypes.instanceOf(dayjs).isRequired,
  onDateChange: PropTypes.func.isRequired,
  tasks: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.string,
};

export default DashboardCalendar;
