jQuery(document).ready(function($) {
    'use strict';
    
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    function renderWeekView(container, date) {
        var $container = $(container);
        
        // Get the start of the week (Sunday)
        var startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        
        // Build array of 7 days
        var weekDays = [];
        for (var i = 0; i < 7; i++) {
            var day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            weekDays.push(day);
        }
        
        // Format date range for header
        var firstDay = weekDays[0];
        var lastDay = weekDays[6];
        var dateRange = firstDay.getMonth() === lastDay.getMonth()
            ? monthNames[firstDay.getMonth()] + ' ' + firstDay.getDate() + '-' + lastDay.getDate() + ', ' + firstDay.getFullYear()
            : monthNames[firstDay.getMonth()] + ' ' + firstDay.getDate() + ' - ' + monthNames[lastDay.getMonth()] + ' ' + lastDay.getDate() + ', ' + firstDay.getFullYear();
        
        var today = new Date().toDateString();
        
        var html = '<div class="signup-calendar-container week-view">' +
            '<div class="calendar-header">' +
                '<button class="nav-button prev-week" aria-label="Previous week">' +
                    '<span class="chevron left">‹</span>' +
                '</button>' +
                '<h3 class="month-year week-range">' + dateRange + '</h3>' +
                '<button class="nav-button next-week" aria-label="Next week">' +
                    '<span class="chevron right">›</span>' +
                '</button>' +
            '</div>' +
            '<div class="week-grid">';
        
        $.each(weekDays, function(index, day) {
            var isToday = day.toDateString() === today;
            html += '<div class="week-day ' + (isToday ? 'today' : '') + '">' +
                '<div class="week-day-header">' +
                    '<span class="day-name">' + dayNames[day.getDay()] + '-' + day.getDate() + '</span>' +
                '</div>' +
                '<div class="week-day-events">' +
                    '<p class="no-events">There are no events scheduled</p>' +
                '</div>' +
            '</div>';
        });
        
        html += '</div></div>';
        
        $container.html(html);
        
        // Add event listeners
        $container.find('.prev-week').on('click', function() {
            date.setDate(date.getDate() - 7);
            renderWeekView(container, date);
        });
        
        $container.find('.next-week').on('click', function() {
            date.setDate(date.getDate() + 7);
            renderWeekView(container, date);
        });
    }
    
    function renderCalendar(container, date) {
        var $container = $(container);
        var year = date.getFullYear();
        var month = date.getMonth();
        
        // Get first day of month and number of days
        var firstDay = new Date(year, month, 1).getDay();
        var daysInMonth = new Date(year, month + 1, 0).getDate();
        
        var html = '<div class="signup-calendar-container">' +
            '<div class="calendar-header">' +
                '<button class="nav-button prev-month" aria-label="Previous month">' +
                    '<span class="chevron left">‹</span>' +
                '</button>' +
                '<h3 class="month-year">' + monthNames[month] + ' ' + year + '</h3>' +
                '<button class="nav-button next-month" aria-label="Next month">' +
                    '<span class="chevron right">›</span>' +
                '</button>' +
            '</div>' +
            '<div class="calendar-weekdays">';
        
        $.each(dayNames, function(index, day) {
            html += '<div class="weekday-name">' + day + '</div>';
        });
        
        html += '</div><div class="calendar-grid">';
        
        // Empty cells for days before month starts
        for (var i = 0; i < firstDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }
        
        // Days of the month
        var today = new Date();
        for (var day = 1; day <= daysInMonth; day++) {
            var isToday = today.toDateString() === new Date(year, month, day).toDateString();
            html += '<div class="calendar-day ' + (isToday ? 'today' : '') + '">' +
                '<span class="day-number">' + day + '</span>' +
            '</div>';
        }
        
        html += '</div></div>';
        
        $container.html(html);
        
        // Add event listeners
        $container.find('.prev-month').on('click', function() {
            date.setMonth(date.getMonth() - 1);
            renderCalendar(container, date);
        });
        
        $container.find('.next-month').on('click', function() {
            date.setMonth(date.getMonth() + 1);
            renderCalendar(container, date);
        });
    }
    
    // Initialize all calendar blocks on the page
    console.log('Signup Calendar: Initializing calendars...');
    var $calendarBlocks = $('[data-calendar-block="true"]');
    console.log('Signup Calendar: Found ' + $calendarBlocks.length + ' calendar blocks');
    
    $calendarBlocks.each(function() {
        var $block = $(this);
        
        // Skip if already initialized
        if ($block.attr('data-initialized')) {
            console.log('Signup Calendar: Block already initialized, skipping');
            return;
        }
        $block.attr('data-initialized', 'true');
        
        var currentDate = new Date();
        var viewType = $block.attr('data-view-type') || 'month';
        console.log('Signup Calendar: Rendering ' + viewType + ' view');
        
        if (viewType === 'week') {
            renderWeekView(this, currentDate);
        } else {
            renderCalendar(this, currentDate);
        }
        console.log('Signup Calendar: Render complete');
    });
});
