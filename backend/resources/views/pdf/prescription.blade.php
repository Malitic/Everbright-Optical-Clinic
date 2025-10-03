<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Prescription</title>
    <style>
        body { 
            font-family: DejaVu Sans, sans-serif; 
            font-size: 12px; 
            margin: 0;
            padding: 20px;
        }
        .header { 
            text-align: center; 
            font-weight: bold; 
            margin-bottom: 20px;
        }
        .clinic-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .clinic-details {
            font-size: 10px;
            margin-bottom: 10px;
        }
        .prescription-title {
            font-size: 16px;
            font-weight: bold;
            margin: 15px 0;
        }
        .patient-info {
            margin-bottom: 20px;
        }
        .prescription-details {
            margin-bottom: 20px;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px; 
        }
        td, th { 
            border: 1px solid black; 
            padding: 8px; 
            text-align: left; 
        }
        th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
        .medication-item {
            margin-bottom: 15px;
        }
        .signature-section {
            margin-top: 30px;
        }
        .signature-line {
            border-bottom: 1px solid black;
            width: 200px;
            display: inline-block;
            margin: 0 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="clinic-name">EVERBRIGHT POLYCLINIC</div>
        <div class="clinic-details">
            Owned & Operated by: EVERBRIGHT POLYCLINIC OPC.<br>
            VAT Reg. TIN: 000-781-251-00002<br>
            47 & 48 2/F Unitop Balibago Commercial Complex Balibago 4026 City of Santa Rosa Laguna Philippines
        </div>
        <div class="prescription-title">PRESCRIPTION</div>
    </div>

    <div class="patient-info">
        <p><strong>Patient Name:</strong> {{ $patient_name }}</p>
        <p><strong>Date of Birth:</strong> {{ $patient_dob }}</p>
        <p><strong>Address:</strong> {{ $patient_address }}</p>
        <p><strong>Contact:</strong> {{ $patient_contact }}</p>
    </div>

    <div class="prescription-details">
        <p><strong>Prescription Date:</strong> {{ $prescription_date }}</p>
        <p><strong>Optometrist:</strong> {{ $optometrist_name }}</p>
        <p><strong>Branch:</strong> {{ $branch_name }}</p>
    </div>

    <div class="medication-section">
        <h4>Prescribed Medications:</h4>
        @foreach($medications as $medication)
        <div class="medication-item">
            <p><strong>{{ $medication['name'] }}</strong></p>
            <p><strong>Dosage:</strong> {{ $medication['dosage'] }}</p>
            <p><strong>Instructions:</strong> {{ $medication['instructions'] }}</p>
            <p><strong>Quantity:</strong> {{ $medication['quantity'] }}</p>
            @if(isset($medication['notes']))
            <p><strong>Notes:</strong> {{ $medication['notes'] }}</p>
            @endif
            <hr>
        </div>
        @endforeach
    </div>

    @if(isset($eye_exam_results))
    <div class="exam-results">
        <h4>Eye Examination Results:</h4>
        <table>
            <tr>
                <th>Eye</th>
                <th>Sphere</th>
                <th>Cylinder</th>
                <th>Axis</th>
                <th>Prism</th>
                <th>Base</th>
            </tr>
            <tr>
                <td>Right Eye (OD)</td>
                <td>{{ $eye_exam_results['right_sphere'] ?? 'N/A' }}</td>
                <td>{{ $eye_exam_results['right_cylinder'] ?? 'N/A' }}</td>
                <td>{{ $eye_exam_results['right_axis'] ?? 'N/A' }}</td>
                <td>{{ $eye_exam_results['right_prism'] ?? 'N/A' }}</td>
                <td>{{ $eye_exam_results['right_base'] ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td>Left Eye (OS)</td>
                <td>{{ $eye_exam_results['left_sphere'] ?? 'N/A' }}</td>
                <td>{{ $eye_exam_results['left_cylinder'] ?? 'N/A' }}</td>
                <td>{{ $eye_exam_results['left_axis'] ?? 'N/A' }}</td>
                <td>{{ $eye_exam_results['left_prism'] ?? 'N/A' }}</td>
                <td>{{ $eye_exam_results['left_base'] ?? 'N/A' }}</td>
            </tr>
        </table>
    </div>
    @endif

    <div class="signature-section">
        <p><strong>Optometrist Signature:</strong> <span class="signature-line"></span></p>
        <p><strong>License Number:</strong> {{ $optometrist_license ?? 'N/A' }}</p>
        <p><strong>Date:</strong> {{ $prescription_date }}</p>
    </div>
</body>
</html>
