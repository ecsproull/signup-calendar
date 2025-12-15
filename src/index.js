import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import './style.css';

const WeekView = ({ currentDate, onPrevWeek, onNextWeek }) => {
    debugger;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Get the start of the week (Sunday)
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    // Build array of 7 days
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        weekDays.push(day);
    }
    
    // Format date range for header
    const firstDay = weekDays[0];
    const lastDay = weekDays[6];
    const dateRange = firstDay.getMonth() === lastDay.getMonth()
        ? `${monthNames[firstDay.getMonth()]} ${firstDay.getDate()}-${lastDay.getDate()}, ${firstDay.getFullYear()}`
        : `${monthNames[firstDay.getMonth()]} ${firstDay.getDate()} - ${monthNames[lastDay.getMonth()]} ${lastDay.getDate()}, ${firstDay.getFullYear()}`;
    
    const today = new Date().toDateString();
    
    return (
        <div className="signup-calendar-container week-view">
            <div className="calendar-header">
                <button 
                    className="nav-button" 
                    onClick={onPrevWeek}
                    aria-label="Previous week"
                >
                    <span className="chevron left">‹</span>
                </button>
                <h3 className="month-year week-range">
                    {dateRange}
                </h3>
                <button 
                    className="nav-button" 
                    onClick={onNextWeek}
                    aria-label="Next week"
                >
                    <span className="chevron right">›</span>
                </button>
            </div>
            
            <div className="week-grid">
                {weekDays.map((day, index) => {
                    const isToday = day.toDateString() === today;
                    return (
                        <div key={index} className={`week-day ${isToday ? 'today' : ''}`}>
                            <div className="week-day-header">
                                <span className="day-name">{dayNames[day.getDay()]}</span>
                                <span className="day-date">{day.getDate()}</span>
                            </div>
                            <div className="week-day-events">
                                <p className="no-events">There are no events scheduled</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const CalendarView = ({ currentDate, onPrevMonth, onNextMonth, isEditor }) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Build calendar grid
    const calendarDays = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
        calendarDays.push(
            <div key={day} className={`calendar-day ${isToday ? 'today' : ''}`}>
                <span className="day-number">{day}</span>
            </div>
        );
    }
    
    return (
        <div className="signup-calendar-container">
            <div className="calendar-header">
                <button 
                    className="nav-button" 
                    onClick={onPrevMonth}
                    aria-label="Previous month"
                >
                    <span className="chevron left">‹</span>
                </button>
                <h3 className="month-year">
                    {monthNames[month]} {year}
                </h3>
                <button 
                    className="nav-button" 
                    onClick={onNextMonth}
                    aria-label="Next month"
                >
                    <span className="chevron right">›</span>
                </button>
            </div>
            
            <div className="calendar-weekdays">
                {dayNames.map(day => (
                    <div key={day} className="weekday-name">{day}</div>
                ))}
            </div>
            
            <div className="calendar-grid">
                {calendarDays}
            </div>
        </div>
    );
};

registerBlockType('signup-calendar/calendar-block', {
    title: 'Signup Calendar',
    description: 'Display a signup calendar block',
    category: 'widgets',
    icon: 'calendar-alt',
    attributes: {
        viewType: {
            type: 'string',
            default: 'month'
        }
    },
    supports: {
        html: false,
    },
    deprecated: [
        {
            attributes: {},
            save: () => {
                return (
                    <div className="wp-block-signup-calendar-calendar-block" data-calendar-block="true"></div>
                );
            },
            migrate: () => {
                return {
                    viewType: 'month'
                };
            }
        }
    ],
    edit: ({ attributes, setAttributes }) => {
        const blockProps = useBlockProps();
        const [currentDate, setCurrentDate] = useState(new Date());
        const { viewType } = attributes;
        
        const handlePrevMonth = () => {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        };
        
        const handleNextMonth = () => {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        };
        
        const handlePrevWeek = () => {
            const newDate = new Date(currentDate);
            newDate.setDate(currentDate.getDate() - 7);
            setCurrentDate(newDate);
        };
        
        const handleNextWeek = () => {
            const newDate = new Date(currentDate);
            newDate.setDate(currentDate.getDate() + 7);
            setCurrentDate(newDate);
        };
        
        return (
            <>
                <InspectorControls>
                    <PanelBody title="Calendar Settings" initialOpen={true}>
                        <SelectControl
                            label="View Type"
                            value={viewType}
                            options={[
                                { label: 'Month View', value: 'month' },
                                { label: 'Week View', value: 'week' }
                            ]}
                            onChange={(value) => setAttributes({ viewType: value })}
                        />
                    </PanelBody>
                </InspectorControls>
                <div {...blockProps}>
                    {viewType === 'week' ? (
                        <WeekView 
                            currentDate={currentDate}
                            onPrevWeek={handlePrevWeek}
                            onNextWeek={handleNextWeek}
                        />
                    ) : (
                        <CalendarView 
                            currentDate={currentDate}
                            onPrevMonth={handlePrevMonth}
                            onNextMonth={handleNextMonth}
                            isEditor={true}
                        />
                    )}
                </div>
            </>
        );
    },
    save: () => {
        return null;
    },
});
