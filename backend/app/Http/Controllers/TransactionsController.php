<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Receipt;
use App\Models\Reservation;

class TransactionsController extends Controller
{
    /**
     * Get all transactions (staff/admin)
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        if (!$user || !in_array($user->role?->value, ['staff', 'optometrist', 'admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Receipt::with(['patient', 'branch', 'appointment']);

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        // Restrict branch staff to their branch
        if ($user->role->value === 'staff') {
            $query->where('branch_id', $user->branch_id);
        }

        $transactions = $query->orderBy('created_at', 'desc')->paginate(15);

        $transformedTransactions = $transactions->getCollection()->map(function ($receipt) {
            return $this->transformReceiptToTransaction($receipt);
        });

        return response()->json([
            'transactions' => [
                'data' => $transformedTransactions,
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ]
        ]);
    }

    /**
     * Get transaction details
     */
    public function show(Request $request, $id)
    {
        $user = Auth::user();

        if (!$user || !in_array($user->role?->value, ['staff', 'optometrist', 'admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $receipt = Receipt::with(['patient', 'branch', 'appointment.optometrist', 'appointment.patient'])->find($id);

        if (!$receipt) {
            return response()->json(['message' => 'Transaction not found'], 404);
        }

        return response()->json(['transaction' => $this->transformReceiptToTransaction($receipt)]);
    }

    /**
     * Create new transaction
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if (!$user || !in_array($user->role?->value, ['staff', 'optometrist', 'admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'appointment_id' => 'nullable|exists:appointments,id',
            'reservation_id' => 'nullable|exists:reservations,id',
            'customer_id' => 'required|integer',
            'branch_id' => 'required|integer',
            'total_amount' => 'required|numeric',
            'payment_method' => 'required|in:Cash,Credit Card,Debit Card,Online Payment',
            'notes' => 'nullable|string',
        ]);

        // For receipts, we'll create the receipt but map the frontend format
        $receiptData = [
            'appointment_id' => $validated['appointment_id'],
            'patient_id' => $validated['customer_id'],
            'branch_id' => $validated['branch_id'],
            'staff_id' => $user->id,
            'invoice_no' => str_pad((time() + rand(0, 999)) % 10000, 4, '0', STR_PAD_LEFT),
            'date' => now()->format('Y-m-d'),
            'sales_type' => strtolower($validated['payment_method']),
            'customer_name' => User::find($validated['customer_id'])->name ?? 'Unknown Customer',
            'total_due' => $validated['total_amount'],
            // Basic receipt structure
            'items' => [],
            'total_sales' => $validated['total_amount'],
            'vatable_sales' => 0,
            'less_vat' => 0,
            'add_vat' => 0,
            'zero_rated_sales' => 0,
            'net_of_vat' => 0,
            'vat_exempt_sales' => 0,
            'discount' => 0,
            'withholding_tax' => 0,
        ];

        $receipt = Receipt::create($receiptData);

        return response()->json(['transaction' => $this->transformReceiptToTransaction($receipt)], 201);
    }

    /**
     * Finalize transaction
     */
    public function finalize(Request $request, $id)
    {
        $receipt = Receipt::find($id);

        if (!$receipt) {
            return response()->json(['message' => 'Transaction not found'], 404);
        }

        $validated = $request->validate([
            'sales_type' => 'required|in:cash,charge',
            'customer_name' => 'required|string',
            'tin' => 'nullable|string',
            'address' => 'nullable|string',
            'eye_exam_fee' => 'required|numeric',
        ]);

        $receipt->update([
            'sales_type' => $validated['sales_type'],
            'customer_name' => $validated['customer_name'],
            'tin' => $validated['tin'] ?? null,
            'address' => $validated['address'] ?? null,
            'total_due' => $validated['eye_exam_fee'],
            'status' => 'Completed',
            'completed_at' => now(),
        ]);

        return response()->json(['transaction' => $this->transformReceiptToTransaction($receipt)]);
    }

    /**
     * Get customer transactions
     */
    public function getCustomerTransactions(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $query = Receipt::where('patient_id', $user->id)->with(['branch']);

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $transactions = $query->orderBy('created_at', 'desc')->paginate(15);

        $transformedTransactions = $transactions->getCollection()->map(function ($receipt) {
            return $this->transformReceiptToTransaction($receipt);
        });

        return response()->json([
            'transactions' => [
                'data' => $transformedTransactions,
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ]
        ]);
    }

    /**
     * Get transaction analytics (admin only)
     */
    public function getAnalytics(Request $request)
    {
        $user = Auth::user();

        if (!$user || $user->role?->value !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Receipt::query();

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        $totalIncome = $query->sum('total_due');
        $totalTransactions = $query->count();
        $completedTransactions = $query->where('status', 'Completed')->count();
        $pendingTransactions = $query->where('status', 'Pending')->count();
        $cancelledTransactions = $query->where('status', 'Cancelled')->count();
        $averageTransactionValue = $totalTransactions > 0 ? $totalIncome / $totalTransactions : 0;

        // Group by branch
        $salesByBranch = $query->select('branch_id', DB::raw('SUM(total_due) as total_sales'))
            ->groupBy('branch_id')
            ->with('branch')
            ->get()
            ->map(function ($row) {
                return [
                    'name' => $row->branch->name ?? 'Unknown',
                    'total_sales' => $row->total_sales,
                ];
            });

        // Group by payment method
        $salesByPaymentMethod = $query->select('sales_type', DB::raw('SUM(total_due) as total_sales, COUNT(*) as transaction_count'))
            ->groupBy('sales_type')
            ->get()
            ->map(function ($row) {
                return [
                    'payment_method' => ucwords($row->sales_type),
                    'total_sales' => $row->total_sales,
                    'transaction_count' => $row->transaction_count,
                ];
            });

        return response()->json([
            'total_income' => $totalIncome,
            'total_transactions' => $totalTransactions,
            'completed_transactions' => $completedTransactions,
            'pending_transactions' => $pendingTransactions,
            'cancelled_transactions' => $cancelledTransactions,
            'average_transaction_value' => $averageTransactionValue,
            'sales_by_branch' => $salesByBranch,
            'sales_by_payment_method' => $salesByPaymentMethod,
        ]);
    }

    /**
     * Download receipt PDF
     */
    public function downloadReceipt(Request $request, $id)
    {
        // Use existing PDF controller
        $pdfController = new PdfController();
        return $pdfController->downloadReceipt($id);
    }

    /**
     * Get linked transactions (legacy method)
     */
    public function getLinkedTransactions(Request $request)
    {
        // Return empty for compatibility
        return response()->json(['data' => []]);
    }

    /**
     * Complete transaction (legacy method)
     */
    public function completeTransaction(Request $request)
    {
        $validated = $request->validate([
            'appointment_id' => 'required|integer',
            'reservation_id' => 'required|integer',
            'sales_type' => 'required|in:cash,charge',
            'customer_name' => 'required|string',
            'tin' => 'nullable|string',
            'address' => 'nullable|string',
            'eye_exam_fee' => 'required|numeric',
        ]);

        $appointment = \App\Models\Appointment::find($validated['appointment_id']);
        $reservation = Reservation::find($validated['reservation_id']);

        if (!$appointment && !$reservation) {
            return response()->json(['message' => 'Appointment or reservation required'], 400);
        }

        $receipt = Receipt::create([
            'appointment_id' => $validated['appointment_id'],
            'patient_id' => $appointment->patient_id ?? $reservation->user_id,
            'branch_id' => $appointment->branch_id ?? $reservation->branch_id,
            'staff_id' => Auth::id(),
            'invoice_no' => str_pad(time() % 10000, 4, '0', STR_PAD_LEFT),
            'date' => now()->format('Y-m-d'),
            'sales_type' => $validated['sales_type'],
            'customer_name' => $validated['customer_name'],
            'tin' => $validated['tin'],
            'address' => $validated['address'],
            'total_due' => $validated['eye_exam_fee'],
            'status' => 'Completed',
            'completed_at' => now(),
        ]);

        return response()->json(['transaction' => $this->transformReceiptToTransaction($receipt)]);
    }

    /**
     * Get patients with transaction data
     */
    public function getPatients(Request $request)
    {
        $user = Auth::user();

        if (!$user || !in_array($user->role?->value, ['staff', 'optometrist', 'admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Get all customers with transaction summaries
        $patients = User::where('role', 'customer')
            ->select([
                'id',
                'name',
                'email',
                DB::raw('COUNT(r.id) as total_transactions'),
                DB::raw('COALESCE(SUM(r.total_due), 0) as total_spent'),
                DB::raw('COUNT(DISTINCT res.id) as reserved_products'),
                DB::raw('MAX(r.created_at) as last_transaction_date')
            ])
            ->leftJoin('receipts as r', 'users.id', '=', 'r.patient_id')
            ->leftJoin('reservations as res', 'users.id', '=', 'res.user_id')
            ->groupBy('users.id', 'users.name', 'users.email')
            ->orderBy('total_spent', 'desc')
            ->get();

        $transformedPatients = $patients->map(function ($patient) {
            // Get detailed transactions for this patient
            $transactions = Receipt::with(['branch'])
                ->where('patient_id', $patient->id)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($receipt) {
                    return $this->transformReceiptToTransaction($receipt);
                });

            return [
                'id' => $patient->id,
                'name' => $patient->name,
                'email' => $patient->email,
                'phone' => $patient->phone ?? null,
                'total_transactions' => (int) $patient->total_transactions,
                'total_spent' => (float) $patient->total_spent,
                'reserved_products' => (int) $patient->reserved_products,
                'transactions' => $transactions,
                'last_transaction_date' => $patient->last_transaction_date,
            ];
        });

        return response()->json([
            'data' => $transformedPatients,
            'total' => $transformedPatients->count(),
        ]);
    }

    /**
     * Transform Receipt to Transaction format (frontend compatibility)
     */
    private function transformReceiptToTransaction($receipt)
    {
        $appointment = $receipt->appointment;
        $reservation = $receipt->reservation ?? (!$appointment ? Reservation::where('user_id', $receipt->patient_id)->first() : null);

        return [
            'id' => $receipt->id,
            'transaction_code' => $receipt->invoice_no ?? $receipt->id,
            'customer_id' => $receipt->patient_id,
            'branch_id' => $receipt->branch_id,
            'appointment_id' => $receipt->appointment_id,
            'reservation_id' => $reservation ? $reservation->id : null,
            'total_amount' => $receipt->total_due,
            'status' => $receipt->status ?? 'Completed',
            'payment_method' => strtoupper($receipt->sales_type ?? 'cash'),
            'notes' => $receipt->notes ?? null,
            'completed_at' => $receipt->completed_at ?? $receipt->created_at,
            'created_at' => $receipt->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $receipt->updated_at->format('Y-m-d H:i:s'),
            'customer' => $receipt->patient ? [
                'id' => $receipt->patient->id,
                'name' => $receipt->patient->name,
                'email' => $receipt->patient->email,
            ] : null,
            'branch' => $receipt->branch ? [
                'id' => $receipt->branch->id,
                'name' => $receipt->branch->name,
                'code' => $receipt->branch->code,
            ] : null,
            'appointment' => $appointment ? [
                'id' => $appointment->id,
                'appointment_date' => $appointment->appointment_date,
                'start_time' => $appointment->start_time,
                'end_time' => $appointment->end_time,
                'type' => $appointment->type,
                'status' => $appointment->status,
                'patient' => $appointment->patient ? [
                    'id' => $appointment->patient->id,
                    'name' => $appointment->patient->name,
                ] : null,
                'optometrist' => $appointment->optometrist ? [
                    'id' => $appointment->optometrist->id,
                    'name' => $appointment->optometrist->name,
                ] : null,
            ] : null,
            'reservation' => $reservation ? [
                'id' => $reservation->id,
                'quantity' => $reservation->quantity,
                'status' => $reservation->status,
                'product' => $reservation->product ? [
                    'id' => $reservation->product->id,
                    'name' => $reservation->product->name,
                    'price' => $reservation->product->price,
                ] : null,
            ] : null,
            'receipt' => [
                'id' => $receipt->id,
                'sales_type' => $receipt->sales_type,
                'total_due' => $receipt->total_due,
                'items' => $receipt->items ?? [],
            ],
        ];
    }
}
