<?php
/**
 * Plugin Name: Signup Calendar
 * Plugin URI: https://scwwoodshop.com
 * Description: A Gutenberg block for displaying signup calendars
 * Version: 1.0.0
 * Author: Your Name
 * License: GPL v2 or later
 * Text Domain: signup-calendar
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('SIGNUP_CALENDAR_VERSION', '1.0.1');
define('SIGNUP_CALENDAR_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SIGNUP_CALENDAR_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Initialize the plugin
 */
function signup_calendar_init() {
    // Register the block with render callback
    register_block_type(__DIR__ . '/block.json', array(
        'render_callback' => 'signup_calendar_render_block'
    ));
}
add_action('init', 'signup_calendar_init');

/**
 * Render callback for the block
 */
function signup_calendar_render_block($attributes) {
    // Enqueue frontend assets
    wp_enqueue_style(
        'signup-calendar-frontend',
        SIGNUP_CALENDAR_PLUGIN_URL . 'build/style-index.css',
        array(),
        SIGNUP_CALENDAR_VERSION
    );
    
    wp_enqueue_script(
        'signup-calendar-frontend',
        SIGNUP_CALENDAR_PLUGIN_URL . 'js/calendar-frontend.js',
        array('jquery'),
        SIGNUP_CALENDAR_VERSION,
        true
    );
    
    // Also try inline script as fallback
    wp_add_inline_script(
        'signup-calendar-frontend',
        'console.log("Signup Calendar script loaded");',
        'before'
    );
    
    $view_type = isset($attributes['viewType']) ? esc_attr($attributes['viewType']) : 'month';
    
    $output = sprintf(
        '<!-- Signup Calendar Block: view=%s -->
<div class="wp-block-signup-calendar-calendar-block" data-calendar-block="true" data-view-type="%s"></div>
<!-- End Signup Calendar Block -->',
        $view_type,
        $view_type
    );
    
    return $output;
}

/**
 * Enqueue block editor assets
 */
function signup_calendar_enqueue_block_editor_assets() {
    wp_enqueue_script(
        'signup-calendar-editor',
        SIGNUP_CALENDAR_PLUGIN_URL . 'build/index.js',
        array('wp-blocks', 'wp-element', 'wp-editor', 'wp-components', 'wp-i18n'),
        SIGNUP_CALENDAR_VERSION,
        true
    );

    wp_enqueue_style(
        'signup-calendar-editor',
        SIGNUP_CALENDAR_PLUGIN_URL . 'build/style-index.css',
        array('wp-edit-blocks'),
        SIGNUP_CALENDAR_VERSION
    );
}
add_action('enqueue_block_editor_assets', 'signup_calendar_enqueue_block_editor_assets');



/**
 * Register REST API endpoint for events
 */
function signup_calendar_register_rest_routes() {
    register_rest_route('signup-calendar/v1', '/events', array(
        'methods' => 'GET',
        'callback' => 'signup_calendar_get_events',
        'permission_callback' => '__return_true',
        'args' => array(
            'year' => array(
                'required' => true,
                'validate_callback' => function($param) {
                    return is_numeric($param);
                }
            ),
            'month' => array(
                'required' => true,
                'validate_callback' => function($param) {
                    return is_numeric($param) && $param >= 1 && $param <= 12;
                }
            ),
            'view' => array(
                'required' => false,
                'default' => 'month'
            )
        )
    ));
}
add_action('rest_api_init', 'signup_calendar_register_rest_routes');

/**
 * Get events for a specific month
 */
function signup_calendar_get_events($request) {
    global $wpdb;
    
    $year = intval($request['year']);
    $month = intval($request['month']);
    $view = $request['view'];
    
    // Calculate date range based on view type
    if ($view === 'week') {
        // For week view, get events for the entire month to simplify
        // The frontend will filter to the correct week
        $start_date = sprintf('%04d-%02d-01', $year, $month);
        $end_date = date('Y-m-t', strtotime($start_date));
    } else {
        // Month view
        $start_date = sprintf('%04d-%02d-01', $year, $month);
        $end_date = date('Y-m-t', strtotime($start_date));
    }
    
    $table_name = $wpdb->prefix . 'spidercalendar_event';
    
    $query = $wpdb->prepare(
        "SELECT date, title, time, text_for_date, category 
        FROM {$table_name} 
        WHERE date >= %s AND date <= %s 
        ORDER BY date, time",
        $start_date,
        $end_date
    );
    
    $results = $wpdb->get_results($query, ARRAY_A);
    
    if ($wpdb->last_error) {
        return new WP_Error('database_error', 'Failed to fetch events', array('status' => 500));
    }
    
    // Group events by date
    $events_by_date = array();
    foreach ($results as $event) {
        $date = $event['date'];
        if (!isset($events_by_date[$date])) {
            $events_by_date[$date] = array();
        }
        // Process shortcodes in the description
        $description = do_shortcode($event['text_for_date']);
        
        $events_by_date[$date][] = array(
            'title' => $event['title'],
            'time' => $event['time'],
            'description' => $description,
            'category' => $event['category']
        );
    }
    
    return rest_ensure_response($events_by_date);
}

/**
 * Format time range from 24-hour format to AM/PM range
 */
function signup_calendar_format_time_range($start_time, $end_time) {
    $start = DateTime::createFromFormat('H:i', $start_time);
    $end = DateTime::createFromFormat('H:i', $end_time);
    
    if (!$start || !$end) {
        return $start_time . '-' . $end_time;
    }
    
    return $start->format('g:iA') . '-' . $end->format('g:iA');
}

/**
 * Add admin menu
 */
function signup_calendar_admin_menu() {
    add_menu_page(
        'Calendar Events',
        'Calendar Events',
        'manage_options',
        'signup-calendar-events',
        'signup_calendar_admin_page',
        'dashicons-calendar-alt',
        30
    );
}
add_action('admin_menu', 'signup_calendar_admin_menu');

/**
 * Enqueue admin assets
 */
function signup_calendar_admin_assets($hook) {
    if ($hook !== 'toplevel_page_signup-calendar-events') {
        return;
    }
    
    wp_enqueue_style('wp-jquery-ui-dialog');
    
    wp_enqueue_style(
        'signup-calendar-admin',
        SIGNUP_CALENDAR_PLUGIN_URL . 'css/admin-style.css',
        array(),
        SIGNUP_CALENDAR_VERSION
    );
    
    wp_enqueue_script(
        'signup-calendar-admin',
        SIGNUP_CALENDAR_PLUGIN_URL . 'js/admin-events.js',
        array('jquery', 'jquery-ui-datepicker'),
        SIGNUP_CALENDAR_VERSION,
        true
    );
    
    wp_localize_script('signup-calendar-admin', 'signupCalendarAdmin', array(
        'ajaxurl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('signup_calendar_admin')
    ));
}
add_action('admin_enqueue_scripts', 'signup_calendar_admin_assets');

/**
 * Admin page content
 */
function signup_calendar_admin_page() {
    // Handle form submission
    if (isset($_POST['signup_calendar_add_event']) && check_admin_referer('signup_calendar_add_event')) {
        signup_calendar_process_event_submission();
    }
    
    ?>
    <div class="wrap">
        <h1>Add Calendar Event</h1>
        
        <form method="post" id="signup-calendar-event-form">
            <?php wp_nonce_field('signup_calendar_add_event'); ?>
            
            <table class="form-table">
                <tr>
                    <th scope="row"><label for="event_title">Title *</label></th>
                    <td>
                        <input type="text" id="event_title" name="event_title" class="regular-text" required />
                    </td>
                </tr>
                
                <tr>
                    <th scope="row"><label for="event_date">Date *</label></th>
                    <td>
                        <input type="text" id="event_date" name="event_date" class="regular-text datepicker" required />
                        <p class="description">Click to select a date</p>
                    </td>
                </tr>
                
                <tr>
                    <th scope="row"><label for="event_time">Start Time *</label></th>
                    <td>
                        <input type="time" id="event_time" name="event_time" class="regular-text" required />
                    </td>
                </tr>
                
                <tr>
                    <th scope="row"><label for="event_end_time">End Time *</label></th>
                    <td>
                        <input type="time" id="event_end_time" name="event_end_time" class="regular-text" required />
                    </td>
                </tr>
                
                <tr>
                    <th scope="row"><label for="event_description">Description</label></th>
                    <td>
                        <?php 
                        wp_editor('', 'event_description', array(
                            'textarea_name' => 'event_description',
                            'textarea_rows' => 10,
                            'media_buttons' => true,
                            'teeny' => false
                        )); 
                        ?>
                        <p class="description">HTML content for event details</p>
                    </td>
                </tr>
                
                <tr>
                    <th scope="row"><label for="event_category">Category *</label></th>
                    <td>
                        <select id="event_category" name="event_category" class="regular-text" required>
                            <option value="1">Social Event</option>
                            <option value="2">Meeting</option>
                            <option value="4">Shop Activity</option>
                            <option value="7">Class</option>
                            <option value="8">Closed</option>
                        </select>
                        <p class="description">Select event category</p>
                    </td>
                </tr>
                
                <tr>
                    <th scope="row"><label for="repeat_count">Repeat</label></th>
                    <td>
                        <input type="number" id="repeat_count" name="repeat_count" min="0" max="52" value="0" style="width: 80px;" />
                        <select id="repeat_frequency" name="repeat_frequency">
                            <option value="none">No Repeat</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly (Same Day of Week)</option>
                        </select>
                        <p class="description">Number of times to repeat and frequency</p>
                    </td>
                </tr>
            </table>
            
            <div id="repeat-dates-preview" style="display:none; margin: 20px 0; padding: 15px; background: #f0f0f0; border-radius: 4px;">
                <h3>Events to be Created:</h3>
                <div id="dates-list"></div>
                <p><button type="button" id="edit-dates-btn" class="button">Edit Dates</button></p>
            </div>
            
            <p class="submit">
                <button type="button" id="preview-events-btn" class="button button-secondary">Preview Events</button>
                <input type="submit" name="signup_calendar_add_event" class="button button-primary" value="Save Event(s)" id="save-events-btn" />
            </p>
        </form>
        
        <hr style="margin: 40px 0;" />
        
        <h2>Event Management</h2>
        
        <div style="background: #f9f9f9; padding: 15px; margin-bottom: 20px; border: 1px solid #ddd; border-radius: 4px;">
            <h3 style="margin-top: 0;">Filter Events</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; align-items: end;">
                <div>
                    <label for="filter_category"><strong>Category</strong></label><br>
                    <select id="filter_category" style="width: 100%;">
                        <option value="">All Categories</option>
                        <option value="1">Social Events</option>
                        <option value="2">Meetings</option>
                        <option value="4">Shop Activities</option>
                        <option value="7">Classes</option>
                        <option value="8">Closed</option>
                    </select>
                </div>
                <div>
                    <label for="filter_start_date"><strong>Start Date</strong></label><br>
                    <input type="date" id="filter_start_date" style="width: 100%;" />
                </div>
                <div>
                    <label for="filter_end_date"><strong>End Date</strong></label><br>
                    <input type="date" id="filter_end_date" style="width: 100%;" />
                </div>
                <div>
                    <button type="button" id="apply-filters-btn" class="button button-primary">Apply Filters</button>
                    <button type="button" id="reset-filters-btn" class="button">Reset</button>
                </div>
            </div>
        </div>
        
        <div id="events-list-container">
            <?php signup_calendar_display_recent_events(); ?>
        </div>
    </div>
    <?php
}

/**
 * Process event submission
 */
function signup_calendar_process_event_submission() {
    global $wpdb;
    
    $title = sanitize_text_field(wp_unslash($_POST['event_title']));
    $date = sanitize_text_field(wp_unslash($_POST['event_date']));
    $start_time = sanitize_text_field(wp_unslash($_POST['event_time']));
    $end_time = sanitize_text_field(wp_unslash($_POST['event_end_time']));
    $description = wp_kses_post(wp_unslash($_POST['event_description']));
    $category = intval($_POST['event_category']);
    
    // Format time as range (e.g., "8:00AM-10:00AM")
    $time = signup_calendar_format_time_range($start_time, $end_time);
    $repeat_count = intval($_POST['repeat_count']);
    $repeat_frequency = sanitize_text_field(wp_unslash($_POST['repeat_frequency']));
    
    $table_name = $wpdb->prefix . 'spidercalendar_event';
    
    // Check if this is an update
    if (isset($_POST['event_id']) && !empty($_POST['event_id'])) {
        $event_id = intval($_POST['event_id']);
        
        $result = $wpdb->update(
            $table_name,
            array(
                'title' => $title,
                'date' => $date,
                'time' => $time,
                'text_for_date' => $description,
                'category' => $category
            ),
            array('id' => $event_id),
            array('%s', '%s', '%s', '%s', '%d'),
            array('%d')
        );
        
        if ($result !== false) {
            echo '<div class="notice notice-success is-dismissible"><p>Event updated successfully</p></div>';
        } else {
            echo '<div class="notice notice-error is-dismissible"><p>Failed to update event</p></div>';
        }
        return;
    }
    
    // Calculate all dates to insert
    $dates_to_insert = array();
    $start_date = DateTime::createFromFormat('Y-m-d', $date);
    
    if (!$start_date) {
        add_settings_error('signup_calendar', 'invalid_date', 'Invalid date format', 'error');
        return;
    }
    
    // Calculate repeat dates - repeat_count represents total number of events
    if ($repeat_count > 0 && $repeat_frequency !== 'none') {
        if ($repeat_frequency === 'weekly') {
            for ($i = 0; $i < $repeat_count; $i++) {
                $next_date = clone $start_date;
                $next_date->modify("+{$i} weeks");
                $dates_to_insert[] = $next_date->format('Y-m-d');
            }
        } elseif ($repeat_frequency === 'monthly') {
            // Get the day of week and which occurrence (1st, 2nd, 3rd, etc.)
            $day_of_week = $start_date->format('w'); // 0-6
            $day_of_month = $start_date->format('j');
            $occurrence = ceil($day_of_month / 7); // 1st, 2nd, 3rd, 4th, or 5th occurrence
            
            for ($i = 0; $i < $repeat_count; $i++) {
                $next_month = clone $start_date;
                $next_month->modify("+{$i} months");
                $next_month->modify('first day of this month');
                
                // Find the Nth occurrence of the day of week
                $found = false;
                $count = 0;
                while (!$found && $count < 31) {
                    if ($next_month->format('w') == $day_of_week) {
                        $count++;
                        if ($count == $occurrence) {
                            $dates_to_insert[] = $next_month->format('Y-m-d');
                            $found = true;
                        }
                    }
                    if (!$found) {
                        $next_month->modify('+1 day');
                    }
                }
            }
        }
    } else {
        // No repeat - just add the original date
        $dates_to_insert[] = $start_date->format('Y-m-d');
    }
    
    // Check if we have edited dates from the form
    if (isset($_POST['event_dates']) && is_array($_POST['event_dates'])) {
        $dates_to_insert = array_map('sanitize_text_field', $_POST['event_dates']);
    }
    
    // Insert all events
    $inserted = 0;
    foreach ($dates_to_insert as $event_date) {
        $result = $wpdb->insert(
            $table_name,
            array(
                'title' => $title,
                'date' => $event_date,
                'time' => $time,
                'text_for_date' => $description,
                'category' => $category
            ),
            array('%s', '%s', '%s', '%s', '%d')
        );
        
        if ($result) {
            $inserted++;
        }
    }
    
    if ($inserted > 0) {
        echo '<div class="notice notice-success is-dismissible"><p>' . esc_html($inserted) . ' event(s) added successfully</p></div>';
    } else {
        echo '<div class="notice notice-error is-dismissible"><p>Failed to add events</p></div>';
    }
}

/**
 * Render events table
 */
function signup_calendar_render_events_table($events) {
    if (empty($events)) {
        echo '<p>No events found.</p>';
        return;
    }
    
    $category_names = array(
        1 => 'Social Events',
        2 => 'Meetings',
        4 => 'Shop Activities',
        7 => 'Classes',
        8 => 'Closed'
    );
    
    echo '<table class="wp-list-table widefat fixed striped">';
    echo '<thead><tr><th>Date</th><th>Time</th><th>Title</th><th>Category</th><th>Actions</th></tr></thead>';
    echo '<tbody>';
    
    foreach ($events as $event) {
        // Parse time range back to start/end times for editing
        $time_parts = explode('-', $event['time']);
        $start_time = '';
        $end_time = '';
        if (count($time_parts) === 2) {
            $start_time = date('H:i', strtotime($time_parts[0]));
            $end_time = date('H:i', strtotime($time_parts[1]));
        }
        
        $event_data = array(
            'id' => $event['id'],
            'title' => $event['title'],
            'date' => $event['date'],
            'start_time' => $start_time,
            'end_time' => $end_time,
            'description' => $event['text_for_date'],
            'category' => $event['category']
        );
        
        $category_label = isset($category_names[$event['category']]) ? $category_names[$event['category']] : 'Unknown';
        
        echo '<tr data-event="' . esc_attr(json_encode($event_data)) . '">';
        echo '<td>' . esc_html($event['date']) . '</td>';
        echo '<td>' . esc_html($event['time']) . '</td>';
        echo '<td>' . esc_html($event['title']) . '</td>';
        echo '<td>' . esc_html($category_label) . '</td>';
        echo '<td>';
        echo '<button class="button button-small edit-event-btn" data-event-id="' . esc_attr($event['id']) . '">Edit</button> ';
        echo '<button class="button button-small delete-event-btn" data-event-id="' . esc_attr($event['id']) . '">Delete</button>';
        echo '</td>';
        echo '</tr>';
    }
    
    echo '</tbody></table>';
}

/**
 * Display recent events (default view)
 */
function signup_calendar_display_recent_events() {
    global $wpdb;
    
    $table_name = $wpdb->prefix . 'spidercalendar_event';
    
    $events = $wpdb->get_results(
        "SELECT * FROM {$table_name} 
        WHERE date >= CURDATE() 
        ORDER BY date ASC, time ASC 
        LIMIT 20",
        ARRAY_A
    );
    
    signup_calendar_render_events_table($events);
}

/**
 * Handle fetch filtered events AJAX request
 */
function signup_calendar_fetch_filtered_events() {
    check_ajax_referer('signup_calendar_admin', 'nonce');
    
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Insufficient permissions');
    }
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'spidercalendar_event';
    
    $category = isset($_POST['category']) ? sanitize_text_field($_POST['category']) : '';
    $start_date = isset($_POST['start_date']) ? sanitize_text_field($_POST['start_date']) : '';
    $end_date = isset($_POST['end_date']) ? sanitize_text_field($_POST['end_date']) : '';
    
    $where_clauses = array();
    $where_values = array();
    
    if ($category !== '') {
        $where_clauses[] = 'category = %d';
        $where_values[] = intval($category);
    }
    
    if ($start_date) {
        $where_clauses[] = 'date >= %s';
        $where_values[] = $start_date;
    }
    
    if ($end_date) {
        $where_clauses[] = 'date <= %s';
        $where_values[] = $end_date;
    }
    
    $where_sql = '';
    if (!empty($where_clauses)) {
        $where_sql = 'WHERE ' . implode(' AND ', $where_clauses);
    }
    
    $query = "SELECT * FROM {$table_name} {$where_sql} ORDER BY date ASC, time ASC LIMIT 100";
    
    if (!empty($where_values)) {
        $query = $wpdb->prepare($query, $where_values);
    }
    
    $events = $wpdb->get_results($query, ARRAY_A);
    
    if ($wpdb->last_error) {
        wp_send_json_error('Database error: ' . $wpdb->last_error);
    }
    
    ob_start();
    signup_calendar_render_events_table($events);
    $html = ob_get_clean();
    
    wp_send_json_success(array('html' => $html, 'count' => count($events)));
}
add_action('wp_ajax_signup_calendar_fetch_filtered_events', 'signup_calendar_fetch_filtered_events');

/**
 * Handle delete event AJAX request
 */
function signup_calendar_delete_event() {
    check_ajax_referer('signup_calendar_admin', 'nonce');
    
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Insufficient permissions');
    }
    
    global $wpdb;
    $event_id = intval($_POST['event_id']);
    $table_name = $wpdb->prefix . 'spidercalendar_event';
    
    $result = $wpdb->delete(
        $table_name,
        array('id' => $event_id),
        array('%d')
    );
    
    if ($result) {
        wp_send_json_success('Event deleted successfully');
    } else {
        wp_send_json_error('Failed to delete event');
    }
}
add_action('wp_ajax_signup_calendar_delete_event', 'signup_calendar_delete_event');

/**
 * Plugin activation hook
 */
function signup_calendar_activate() {
    echo '<div class="notice notice-success"><p>Signup Calendar plugin activated! Hello!</p></div>';
}
register_activation_hook(__FILE__, 'signup_calendar_activate');
