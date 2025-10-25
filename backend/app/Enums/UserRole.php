<?php

namespace App\Enums;

enum UserRole: string
{
    case CUSTOMER = 'Customer';
    case OPTOMETRIST = 'Optometrist';
    case STAFF = 'Staff';
    case ADMIN = 'Admin';
}
