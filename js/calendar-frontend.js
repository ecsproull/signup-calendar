jQuery(document).ready(function($) {
    'use strict';
    
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var eventCache = {}; // Cache events by 'YYYY-MM' key
    
    /**
     * Load events for a specific month
     */
    function loadEvents(year, month, viewType) {
        var key = year + '-' + String(month).padStart(2, '0');
        
        if (eventCache[key]) {
            console.log('Signup Calendar: Using cached events for ' + key);
            return Promise.resolve(eventCache[key]);
        }
        
        console.log('Signup Calendar: Fetching events for ' + key);
        return $.ajax({
            url: '/wp-json/signup-calendar/v1/events',
            method: 'GET',
            data: {
                year: year,
                month: month,
                view: viewType || 'month'
            }
        }).then(function(data) {
            eventCache[key] = data;
            console.log('Signup Calendar: Cached ' + Object.keys(data).length + ' days of events');
            return data;
        }).fail(function(error) {
            console.error('Signup Calendar: Failed to load events', error);
            return {};
        });
    }
    
    /**
     * Format event list HTML
     */
    function formatEventList(events) {
        if (!events || events.length === 0) {
            return '<p class="no-events">There are no events scheduled</p>';
        }
        
        if (events.length === 1) {
            var event = events[0];
            // Store description as base64 to avoid HTML attribute issues
            var encodedDescription = btoa(unescape(encodeURIComponent(event.description || '')));
            return '<div class="event-item" data-description="' + encodedDescription + '" data-title="' + event.title + '" data-time="' + event.time + '">' +
                '<div class="event-title">' + event.title + '</div>' +
            '</div>';
        }
        
        var html = '<ol class="event-list">';
        $.each(events, function(index, event) {
            var encodedDescription = btoa(unescape(encodeURIComponent(event.description || '')));
            html += '<li class="event-item" data-description="' + encodedDescription + '" data-title="' + event.title + '" data-time="' + event.time + '">' +
                '<span class="event-title">' + event.title + '</span>' +
            '</li>';
        });
        html += '</ol>';
        
        return html;
    }
    
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
        
        // Load events for the month
        loadEvents(firstDay.getFullYear(), firstDay.getMonth() + 1, 'week').then(function(eventsData) {
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
                var dateKey = day.getFullYear() + '-' + 
                              String(day.getMonth() + 1).padStart(2, '0') + '-' + 
                              String(day.getDate()).padStart(2, '0');
                var dayEvents = eventsData[dateKey] || [];
                
                html += '<div class="week-day ' + (isToday ? 'today' : '') + '" data-date="' + dateKey + '">' +
                    '<div class="week-day-header">' +
                        '<span class="day-name">' + dayNames[day.getDay()] + '-' + day.getDate() + '</span>' +
                    '</div>' +
                    '<div class="week-day-events">' +
                        formatEventList(dayEvents) +
                    '</div>' +
                '</div>';
            });
            
            html += '</div></div>';
            
            $container.html(html);
            attachEventHandlers($container);
            
            // Add navigation listeners
            $container.find('.prev-week').on('click', function() {
                date.setDate(date.getDate() - 7);
                renderWeekView(container, date);
            });
            
            $container.find('.next-week').on('click', function() {
                date.setDate(date.getDate() + 7);
                renderWeekView(container, date);
            });
        });
    }
    
    function renderCalendar(container, date) {
        var $container = $(container);
        var year = date.getFullYear();
        var month = date.getMonth();
        
        // Get first day of month and number of days
        var firstDay = new Date(year, month, 1).getDay();
        var daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Load events for the month
        loadEvents(year, month + 1, 'month').then(function(eventsData) {
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
                var dateKey = year + '-' + 
                              String(month + 1).padStart(2, '0') + '-' + 
                              String(day).padStart(2, '0');
                var dayEvents = eventsData[dateKey] || [];
                var hasEvents = dayEvents.length > 0;
                
                html += '<div class="calendar-day ' + (isToday ? 'today' : '') + 
                        (hasEvents ? ' has-events' : '') + '" data-date="' + dateKey + '">' +
                    '<span class="day-number">' + day + '</span>';
                
                if (hasEvents) {
                    html += '<div class="day-events">';
                    $.each(dayEvents, function(index, event) {
                        // Store description as base64 to avoid HTML attribute issues
                        var encodedDescription = btoa(unescape(encodeURIComponent(event.description || '')));
                        html += '<div class="month-event-item" data-description="' + encodedDescription + '" data-title="' + event.title + '" data-time="' + event.time + '">' +
                            '<div class="event-time">' + event.time + '</div>' +
                            '<div class="event-title">' + event.title + '</div>' +
                        '</div>';
                    });
                    html += '</div>';
                }
                
                html += '</div>';
            }
            
            html += '</div></div>';
            
            $container.html(html);
            attachEventHandlers($container);
            
            // Add navigation listeners
            $container.find('.prev-month').on('click', function() {
                date.setMonth(date.getMonth() - 1);
                renderCalendar(container, date);
            });
            
            $container.find('.next-month').on('click', function() {
                date.setMonth(date.getMonth() + 1);
                renderCalendar(container, date);
            });
        });
    }
    
    /**
     * Attach event handlers
     */
    function attachEventHandlers($container) {
        // Left-click on events to show description
        $container.on('click', '.event-item, .month-event-item', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            var encodedDescription = $(this).data('description');
            var title = $(this).data('title');
            var time = $(this).data('time');
            
            if (encodedDescription) {
                // Decode from base64
                var description = decodeURIComponent(escape(atob(encodedDescription)));
                showEventModal(title, time, description);
            }
            
            return false;
        });
    }
    
    /**
     * Get events for a specific date from cache
     */
    function getEventsForDate(dateKey) {
        var parts = dateKey.split('-');
        var cacheKey = parts[0] + '-' + parts[1];
        
        if (eventCache[cacheKey] && eventCache[cacheKey][dateKey]) {
            return eventCache[cacheKey][dateKey];
        }
        
        return null;
    }
    
    /**
     * Show event modal
     */
    function showEventModal(title, time, content) {
        // Remove existing modal
        $('#signup-calendar-modal').remove();
        
        var modal = $('<div id="signup-calendar-modal" class="signup-calendar-modal">' +
            '<div class="modal-overlay"></div>' +
            '<div class="modal-content">' +
                '<button class="modal-close">&times;</button>' +
                '<div class="modal-header">' +
                    '<h2 class="modal-title">' + title + '</h2>' +
                    '<div class="modal-time">' + time + '</div>' +
                '</div>' +
                '<div class="modal-body">' + content + '</div>' +
            '</div>' +
        '</div>');
        
        $('body').append(modal);
        
        // Close on overlay click or close button
        modal.find('.modal-overlay, .modal-close').on('click', function() {
            modal.fadeOut(200, function() {
                modal.remove();
            });
        });
        
        // Close on ESC key
        $(document).on('keydown.signupCalendar', function(e) {
            if (e.key === 'Escape') {
                modal.fadeOut(200, function() {
                    modal.remove();
                });
                $(document).off('keydown.signupCalendar');
            }
        });
        
        modal.fadeIn(200);
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
