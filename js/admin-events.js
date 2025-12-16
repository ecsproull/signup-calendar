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
    
    // Calculate repeating dates
    function calculateRepeatingDates(startDateStr, repeatCount, frequency) {
        var dates = [];
        var startDate = new Date(startDateStr);
        dates.push(formatDate(startDate));
        
        if (frequency === 'weekly') {
            for (var i = 1; i <= repeatCount; i++) {
                var nextDate = new Date(startDate);
                nextDate.setDate(nextDate.getDate() + (i * 7));
                dates.push(formatDate(nextDate));
            }
        } else if (frequency === 'monthly') {
            var dayOfWeek = startDate.getDay();
            var occurrence = Math.ceil(startDate.getDate() / 7);
            
            for (var i = 1; i <= repeatCount; i++) {
                var nextDate = findNthDayOfWeekInMonth(startDate.getMonth() + i, startDate.getFullYear(), dayOfWeek, occurrence);
                if (nextDate) {
                    dates.push(formatDate(nextDate));
                }
            }
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
            var dateObj = new Date(date);
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
