<?php

namespace App\Policies;

use App\Models\Transaction;
use App\Models\User;
use App\Enums\UserRole;

/**
 * Policy to protect Transaction/Financial data
 * Critical: Prevents unauthorized access to financial records
 */
class TransactionPolicy
{
    /**
     * Determine if user can view any transactions
     */
    public function viewAny(User $user): bool
    {
        // Admin and staff can view transactions
        return in_array($user->role->value, [
            UserRole::ADMIN->value,
            UserRole::STAFF->value,
        ]);
    }

    /**
     * Determine if user can view a specific transaction
     */
    public function view(User $user, Transaction $transaction): bool
    {
        // Admin can view any transaction
        if ($user->role->value === UserRole::ADMIN->value) {
            return true;
        }

        // Staff can view transactions from their branch
        if ($user->role->value === UserRole::STAFF->value) {
            return $transaction->branch_id === $user->branch_id;
        }

        // Customer can view their own transactions
        if ($user->role->value === UserRole::CUSTOMER->value) {
            return $transaction->customer_id === $user->id;
        }

        return false;
    }

    /**
     * Determine if user can create transactions
     */
    public function create(User $user): bool
    {
        // Only staff can create transactions
        return $user->role->value === UserRole::STAFF->value;
    }

    /**
     * Determine if user can update a transaction
     */
    public function update(User $user, Transaction $transaction): bool
    {
        // Admin can update (for corrections)
        if ($user->role->value === UserRole::ADMIN->value) {
            return true;
        }

        // Staff can only update transactions from their branch and only if not completed
        if ($user->role->value === UserRole::STAFF->value) {
            return $transaction->branch_id === $user->branch_id 
                && $transaction->status !== 'completed';
        }

        return false;
    }

    /**
     * Determine if user can delete a transaction
     */
    public function delete(User $user, Transaction $transaction): bool
    {
        // Only admin can void/delete transactions (should be soft delete with audit trail)
        // And only if not completed
        return $user->role->value === UserRole::ADMIN->value 
            && $transaction->status !== 'completed';
    }

    /**
     * Determine if user can void a completed transaction
     */
    public function void(User $user, Transaction $transaction): bool
    {
        // Only admin can void completed transactions
        return $user->role->value === UserRole::ADMIN->value;
    }
}