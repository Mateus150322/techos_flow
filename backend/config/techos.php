<?php

return [
    'backup' => [
        'enabled' => env('TECHOS_BACKUP_ENABLED', true),
        'path' => env('TECHOS_BACKUP_PATH') ?: storage_path('app/backups'),
        'retention_days' => (int) env('TECHOS_BACKUP_RETENTION_DAYS', 30),
        'schedule' => env('TECHOS_BACKUP_SCHEDULE', '02:00'),
        'pg_dump_path' => env('PG_DUMP_PATH'),
        'pg_restore_path' => env('PG_RESTORE_PATH'),
    ],
    'pulse' => [
        'username' => env('PULSE_USERNAME'),
        'password' => env('PULSE_PASSWORD'),
    ],
];
