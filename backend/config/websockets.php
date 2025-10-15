<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default Connection Name
    |--------------------------------------------------------------------------
    |
    | Here you may specify which of the connections below you wish to use as
    | your default connection for all work. Of course, you may use many
    | connections at once using the manager class.
    |
    */

    'default' => env('WEBSOCKETS_CONNECTION', 'pusher'),

    /*
    |--------------------------------------------------------------------------
    | Socket.IO Configuration
    |--------------------------------------------------------------------------
    |
    | This configuration is for Socket.IO server.
    |
    */

    'socketio' => [
        'enabled' => env('SOCKETIO_ENABLED', true),
        'port' => env('SOCKETIO_PORT', 6001),
        'host' => env('SOCKETIO_HOST', '127.0.0.1'),
        'cors' => [
            'origin' => ['http://localhost:5173', 'http://127.0.0.1:5173'],
            'methods' => ['GET', 'POST'],
            'credentials' => true,
        ],
        'redis' => [
            'host' => env('REDIS_HOST', '127.0.0.1'),
            'port' => env('REDIS_PORT', 6379),
            'password' => env('REDIS_PASSWORD', null),
            'database' => env('REDIS_DATABASE', 0),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Pusher Configuration
    |--------------------------------------------------------------------------
    |
    | This configuration is for Pusher.
    |
    */

    'pusher' => [
        'driver' => 'pusher',
        'key' => env('PUSHER_APP_KEY'),
        'secret' => env('PUSHER_APP_SECRET'),
        'app_id' => env('PUSHER_APP_ID'),
        'options' => [
            'cluster' => env('PUSHER_APP_CLUSTER'),
            'useTLS' => true,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Channels Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may define the channels that will be used by your application
    | for broadcasting events.
    |
    */

    'channels' => [
        'notifications' => [
            'driver' => 'redis',
            'connection' => 'default',
        ],
        'appointments' => [
            'driver' => 'redis',
            'connection' => 'default',
        ],
        'inventory' => [
            'driver' => 'redis',
            'connection' => 'default',
        ],
        'analytics' => [
            'driver' => 'redis',
            'connection' => 'default',
        ],
    ],
];
