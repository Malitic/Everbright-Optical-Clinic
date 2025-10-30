<?php

namespace App\Enums;

enum UserRole: string
{
    case CUSTOMER = 'customer';
    case OPTOMETRIST = 'optometrist';
    case STAFF = 'staff';
    case ADMIN = 'admin';
}