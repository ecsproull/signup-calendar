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
 * Plugin activation hook
 */
function signup_calendar_activate() {
    echo '<div class="notice notice-success"><p>Signup Calendar plugin activated! Hello!</p></div>';
}
register_activation_hook(__FILE__, 'signup_calendar_activate');
