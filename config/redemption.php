<?php

return [
    'secret' => env('REDEMPTION_SECRET', env('JWT_SECRET', '')),
];
