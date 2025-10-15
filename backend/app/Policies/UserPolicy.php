<?php

namespace App\Policies;

use App\Models\User;
use App\Enums\UserRole;

/**
 * Policy to protect User data
 * Prevents unauthorized access to user information
 */
class UserPolicy
{
    /**
     * Determine if user can view any users
     */
    public function viewAny(User $user): bool
    {
        // Only admin can view all users
        return $user->role->value === UserRole::ADMIN->value;
    }

    /**
     * Determine if user can view a specific user
     */
    public function view(User $user, User $model): bool
    {
        // Admin can view anyone
        if ($user->role->value === UserRole::ADMIN->value) {
            return true;
        }

        // Users can view their own profile
        if ($user->id === $model->id) {
            return true;
        }

        // Staff/Optometrist can view users in their branch
        if (in_array($user->role->value, [UserRole::STAFF->value, UserRole::OPTOMETRIST->value])) {
            return $user->branch_id === $model->branch_id;
        }

        return false;
    }

    /**
     * Determine if user can create users
     */
    public function create(User $user): bool
    {
        // Only admin can create users (staff accounts)
        return $user->role->value === UserRole::ADMIN->value;
    }

    /**
     * Determine if user can update a user
     */
    public function update(User $user, User $model): bool
    {
        // Admin can update anyone
        if ($user->role->value === UserRole::ADMIN->value) {
            return true;
        }

        // Users can update their own profile (limited fields)
        return $user->id === $model->id;
    }

    /**
     * Determine if user can delete a user
     */
    public function delete(User $user, User $model): bool
    {
        // Only admin can delete users
        // Cannot delete self
        return $user->role->value === UserRole::ADMIN->value && $user->id !== $model->id;
    }

    /**
     * Determine if user can approve other users
     */
    public function approve(User $user): bool
    {
        return $user->role->value === UserRole::ADMIN->value;
    }
}


