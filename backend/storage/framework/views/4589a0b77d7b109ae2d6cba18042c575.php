<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Service Invoice</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            font-size: 12px; 
            margin: 0;
            padding: 20px;
            line-height: 1.4;
        }
        .header { 
            margin-bottom: 20px;
        }
        .clinic-info {
            float: left;
            width: 60%;
        }
        .clinic-name {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .clinic-details {
            font-size: 10px;
            margin-bottom: 5px;
        }
        .invoice-section {
            float: right;
            width: 35%;
            text-align: right;
        }
        .invoice-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .invoice-number {
            font-size: 14px;
            font-weight: bold;
            color: #d32f2f;
            margin-bottom: 10px;
        }
        .clear {
            clear: both;
        }
        .payment-type {
            margin: 15px 0;
        }
        .checkbox {
            display: inline-block;
            margin-right: 20px;
        }
        .date-section {
            float: right;
            margin-top: 10px;
        }
        .customer-info {
            margin: 20px 0;
        }
        .customer-info p {
            margin: 5px 0;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0; 
        }
        td, th { 
            border: 1.2px solid #000; 
            padding: 8px; 
            text-align: left; 
        }
        th {
            background-color: #f5f5f5;
            font-weight: bold;
            text-align: center;
        }
        .totals-section {
            margin-top: 20px;
        }
        .totals-left {
            float: left;
            width: 50%;
        }
        .totals-right {
            float: right;
            width: 45%;
        }
        .totals-table {
            width: 100%;
        }
        .totals-table td {
            border: none;
            padding: 3px 0;
            border-bottom: 1px solid #ccc;
        }
        .total-due {
            font-weight: bold;
            font-size: 14px;
            border-top: 2px solid black !important;
            border-bottom: 2px solid black !important;
            padding: 5px 0 !important;
        }
        .signature-section {
            margin-top: 30px;
            clear: both;
        }
        .signature-line {
            border-bottom: 1px solid black;
            width: 200px;
            display: inline-block;
            margin: 0 10px;
        }
        .signature-right {
            float: right;
            text-align: right;
        }
        .box {
            display: inline-block;
            width: 12px;
            height: 12px;
            border: 1.2px solid #000;
            margin-right: 6px;
            text-align: center;
            line-height: 12px;
            font-size: 10px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="clinic-info">
            <div class="clinic-name">EVERBRIGHT POLYCLINIC</div>
            <div class="clinic-details">
                Owned &amp; Operated by EVERBRIGHT POLYCLINIC OPC<br>
                VAT Reg. TIN 600-781-251-00000<br>
                47 &amp; 48 2F Unitop Balibago Commercial Complex Balibago<br>
                4025 City of Santa Rosa, Laguna, Philippines
            </div>
        </div>
        <div class="invoice-section">
            <div class="invoice-title">SERVICE INVOICE</div>
            <div class="invoice-number"><?php echo e($invoice_no); ?></div>
        </div>
        <div class="clear"></div>
    </div>

    <div class="payment-type">
        <div class="checkbox">
            <span class="box"><?php echo $sales_type === 'cash' ? '&#10003;' : '&nbsp;'; ?></span> CASH SALES
        </div>
        <div class="checkbox">
            <span class="box"><?php echo $sales_type === 'charge' ? '&#10003;' : '&nbsp;'; ?></span> CHARGE SALES
        </div>
        <div class="date-section">
            <strong>Date:</strong> <?php echo e($date); ?>

        </div>
        <div class="clear"></div>
    </div>

    <div class="customer-info">
        <p><strong>SOLD TO:</strong></p>
        <p><strong>Registered Name:</strong> <?php echo e($customer_name); ?></p>
        <p><strong>TIN:</strong> <?php echo e($tin); ?></p>
        <p><strong>Address:</strong> <?php echo e($address); ?></p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Item Description / Nature of Service</th>
                <th>QTY</th>
                <th>Unit Price</th>
                <th>AMOUNT</th>
            </tr>
        </thead>
        <tbody>
            <?php $__currentLoopData = $items; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $item): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
            <tr>
                <td><?php echo e($item['description']); ?></td>
                <td><?php echo e($item['qty']); ?></td>
                <td>PHP <?php echo e(number_format($item['unit_price'], 2)); ?></td>
                <td>PHP <?php echo e(number_format($item['amount'], 2)); ?></td>
            </tr>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
        </tbody>
    </table>

    <div class="totals-section">
        <div class="totals-left">
            <table class="totals-table">
                <tr>
                    <td><strong>Vatable Sales</strong></td>
                    <td style="text-align: right;"><?php echo e(number_format($vatable_sales, 2)); ?></td>
                </tr>
                <tr>
                    <td><strong>VAT</strong></td>
                    <td style="text-align: right;"><?php echo e(number_format($add_vat, 2)); ?></td>
                </tr>
                <tr>
                    <td><strong>Zero Rated Sales</strong></td>
                    <td style="text-align: right;"><?php echo e(number_format($zero_rated_sales, 2)); ?></td>
                </tr>
                <tr>
                    <td><strong>VAT-Exempt Sales</strong></td>
                    <td style="text-align: right;"><?php echo e(number_format($vat_exempt_sales, 2)); ?></td>
                </tr>
                <tr>
                    <td><strong>Total Sales (Net of VAT)</strong></td>
                    <td style="text-align: right;"><?php echo e(number_format($net_of_vat, 2)); ?></td>
                </tr>
                <tr>
                    <td><strong>Less: VAT</strong></td>
                    <td style="text-align: right;"><?php echo e(number_format($less_vat, 2)); ?></td>
                </tr>
                <tr>
                    <td><strong>Amount: Net of VAT</strong></td>
                    <td style="text-align: right;"><?php echo e(number_format($net_of_vat, 2)); ?></td>
                </tr>
            </table>
        </div>
        <div class="totals-right">
            <table class="totals-table">
                <tr>
                    <td><strong>Less: VAT</strong></td>
                    <td style="text-align: right;"><?php echo e(number_format($less_vat, 2)); ?></td>
                </tr>
                <tr>
                    <td><strong>Amount: Net of VAT</strong></td>
                    <td style="text-align: right;"><?php echo e(number_format($net_of_vat, 2)); ?></td>
                </tr>
                <tr>
                    <td><strong>Less: Discount/SC/PWD Discount</strong></td>
                    <td style="text-align: right;"><?php echo e(number_format($discount, 2)); ?></td>
                </tr>
                <tr>
                    <td><strong>Add: VAT</strong></td>
                    <td style="text-align: right;"><?php echo e(number_format($add_vat, 2)); ?></td>
                </tr>
                <tr>
                    <td><strong>Less: Withholding Tax</strong></td>
                    <td style="text-align: right;"><?php echo e(number_format($withholding_tax, 2)); ?></td>
                </tr>
                <tr>
                    <td class="total-due"><strong>Total Amount Due</strong></td>
                    <td class="total-due" style="text-align: right;"><strong><?php echo e(number_format($total_due, 2)); ?></strong></td>
                </tr>
            </table>
        </div>
        <div class="clear"></div>
    </div>

    <div class="signature-section">
        <p><strong>Received the amount of:</strong> <span class="signature-line"></span></p>
        <br>
        <div class="signature-right">
            <p><span class="signature-line"></span></p>
            <p><strong>Cashier/Authorized Representative</strong></p>
        </div>
        <div class="clear"></div>
    </div>
</body>
</html>
<?php /**PATH C:\Users\admin\Everbright-Optical-Clinic ni Johnro\backend\resources\views/pdf/receipt.blade.php ENDPATH**/ ?>