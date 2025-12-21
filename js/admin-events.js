jQuery(document).ready(function($) {
    'use strict';
    
    // Initialize datepicker
    $('.datepicker').datepicker({
        dateFormat: 'yy-mm-dd',
        minDate: 0
    });
    
    // Preview events button
    $('#preview-events-btn').on('click', function() {
        var startDate = $('#event_date').val();
        var repeatCount = parseInt($('#repeat_count').val());
        var repeatFrequency = $('#repeat_frequency').val();
        
        if (!startDate) {
            alert('Please select a start date');
            return;
        }
        
        // Calculate dates - include the first date
        var dates = calculateRepeatingDates(startDate, repeatCount, repeatFrequency);
        displayDatesList(dates);
        
        $('#repeat-dates-preview').show();
    });
    
    // Edit dates button
    $('#edit-dates-btn').on('click', function() {
        var datesList = $('#dates-list');
        datesList.find('.date-item').each(function() {
            var $item = $(this);
            var currentDate = $item.data('date');
            $item.html('<input type="date" class="edit-date-input" value="' + currentDate + '" /> ' +
                      '<button type="button" class="button button-small remove-date">Remove</button>');
        });
        
        $(this).hide();
        $('#dates-list').append('<p><button type="button" id="save-dates-btn" class="button button-primary">Save Changes</button></p>');
    });
    
    // Save edited dates
    $(document).on('click', '#save-dates-btn', function() {
        var dates = [];
        $('.edit-date-input').each(function() {
            var date = $(this).val();
            if (date) {
                dates.push(date);
            }
        });
        
        displayDatesList(dates);
        $('#edit-dates-btn').show();
    });
    
    // Remove date
    $(document).on('click', '.remove-date', function() {
        $(this).closest('.date-item').remove();
    });
    
    // Update repeat preview when fields change
    $('#repeat_count, #repeat_frequency').on('change', function() {
        $('#repeat-dates-preview').hide();
    });
    
    // Apply filters button
    $('#apply-filters-btn').on('click', function() {
        var search = $('#filter_search').val();
        var category = $('#filter_category').val();
        var startDate = $('#filter_start_date').val();
        var endDate = $('#filter_end_date').val();
        
        $.ajax({
            url: signupCalendarAdmin.ajaxurl,
            type: 'POST',
            data: {
                action: 'signup_calendar_fetch_filtered_events',
                search: search,
                category: category,
                start_date: startDate,
                end_date: endDate,
                nonce: signupCalendarAdmin.nonce
            },
            beforeSend: function() {
                $('#events-list-container').html('<p>Loading events...</p>');
            },
            success: function(response) {
                if (response.success) {
                    $('#events-list-container').html(response.data.html);
                } else {
                    alert('Error: ' + response.data);
                }
            },
            error: function() {
                alert('Failed to fetch events. Please try again.');
                $('#events-list-container').html('<p>Error loading events.</p>');
            }
        });
    });
    
    // Reset filters button
    $('#reset-filters-btn').on('click', function() {
        $('#filter_search').val('');
        $('#filter_category').val('');
        $('#filter_start_date').val('');
        $('#filter_end_date').val('');
        $('#apply-filters-btn').trigger('click');
    });
    
    // Edit event button
    $(document).on('click', '.edit-event-btn', function(e) {
        e.preventDefault();
        var $row = $(this).closest('tr');
        var eventData = $row.data('event');
        
        // Populate form fields
        $('#event_title').val(eventData.title);
        $('#event_date').val(eventData.date);
        $('#event_time').val(eventData.start_time);
        $('#event_end_time').val(eventData.end_time);
        $('#event_category').val(eventData.category);
        
        // Set the editor content
        if (typeof tinymce !== 'undefined' && tinymce.get('event_description')) {
            tinymce.get('event_description').setContent(eventData.description);
        } else {
            $('#event_description').val(eventData.description);
        }
        
        // Reset repeat fields
        $('#repeat_count').val(0);
        $('#repeat_frequency').val('none');
        $('#repeat-dates-preview').hide();
        
        // Add hidden field for event ID to update existing event
        $('#signup-calendar-event-form input[name="event_id"]').remove();
        $('#signup-calendar-event-form').append('<input type="hidden" name="event_id" value="' + eventData.id + '" />');
        
        // Scroll to form
        $('html, body').animate({
            scrollTop: $('#signup-calendar-event-form').offset().top - 50
        }, 500);
    });
    
    // Delete event button
    $(document).on('click', '.delete-event-btn', function(e) {
        e.preventDefault();
        
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
            return;
        }
        
        var eventId = $(this).data('event-id');
        var $row = $(this).closest('tr');
        var $button = $(this);
        
        $button.prop('disabled', true).text('Deleting...');
        
        $.ajax({
            url: signupCalendarAdmin.ajaxurl,
            type: 'POST',
            data: {
                action: 'signup_calendar_delete_event',
                event_id: eventId,
                nonce: signupCalendarAdmin.nonce
            },
            success: function(response) {
                if (response.success) {
                    $row.fadeOut(300, function() {
                        $(this).remove();
                    });
                } else {
                    alert('Error: ' + response.data);
                    $button.prop('disabled', false).text('Delete');
                }
            },
            error: function() {
                alert('Failed to delete event. Please try again.');
                $button.prop('disabled', false).text('Delete');
            }
        });
    });
    
    // Calculate repeating dates
    function calculateRepeatingDates(startDateStr, repeatCount, frequency) {
        var dates = [];
        // Parse date correctly by adding time component to avoid timezone shift
        var startDate = new Date(startDateStr + 'T12:00:00');
        
        // repeatCount represents total number of events to create
        if (frequency === 'weekly' && repeatCount > 0) {
            for (var i = 0; i < repeatCount; i++) {
                var nextDate = new Date(startDate);
                nextDate.setDate(nextDate.getDate() + (i * 7));
                dates.push(formatDate(nextDate));
            }
        } else if (frequency === 'monthly' && repeatCount > 0) {
            var dayOfWeek = startDate.getDay();
            var occurrence = Math.ceil(startDate.getDate() / 7);
            
            for (var i = 0; i < repeatCount; i++) {
                var nextDate = findNthDayOfWeekInMonth(startDate.getMonth() + i, startDate.getFullYear(), dayOfWeek, occurrence);
                if (nextDate) {
                    dates.push(formatDate(nextDate));
                }
            }
        } else {
            // No repeat or frequency is 'none' - just add the original date
            dates.push(formatDate(startDate));
        }
        
        return dates;
    }
    
    // Find the Nth occurrence of a day of week in a month
    function findNthDayOfWeekInMonth(month, year, dayOfWeek, occurrence) {
        // Adjust month/year if needed
        while (month > 11) {
            month -= 12;
            year++;
        }
        
        var date = new Date(year, month, 1);
        var count = 0;
        
        while (date.getMonth() === month) {
            if (date.getDay() === dayOfWeek) {
                count++;
                if (count === occurrence) {
                    return date;
                }
            }
            date.setDate(date.getDate() + 1);
        }
        
        return null;
    }
    
    // Format date as YYYY-MM-DD
    function formatDate(date) {
        var year = date.getFullYear();
        var month = String(date.getMonth() + 1).padStart(2, '0');
        var day = String(date.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
    }
    
    // Display dates list
    function displayDatesList(dates) {
        var html = '<div style="max-height: 300px; overflow-y: auto;">';
        
        dates.forEach(function(date) {
            // Parse date correctly by adding time component to avoid timezone shift
            var dateObj = new Date(date + 'T12:00:00');
            var dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dateObj.getDay()];
            html += '<div class="date-item" data-date="' + date + '" style="padding: 8px; margin: 4px 0; background: white; border: 1px solid #ddd; border-radius: 3px;">';
            html += '<input type="hidden" name="event_dates[]" value="' + date + '" />';
            html += '<strong>' + dayName + ', ' + date + '</strong>';
            html += '</div>';
        });
        
        html += '</div>';
        html += '<p><strong>Total: ' + dates.length + ' events</strong></p>';
        
        $('#dates-list').html(html);
    }
});
