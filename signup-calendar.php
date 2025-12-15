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
        "SELECT date, title, time, text_for_date 
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
        $events_by_date[$date][] = array(
            'title' => $event['title'],
            'time' => $event['time'],
            'description' => $event['text_for_date']
        );
    }
    
    return rest_ensure_response($events_by_date);
}

/**
 * Plugin activation hook
 */
function signup_calendar_activate() {
    echo '<div class="notice notice-success"><p>Signup Calendar plugin activated! Hello!</p></div>';
}
register_activation_hook(__FILE__, 'signup_calendar_activate');
