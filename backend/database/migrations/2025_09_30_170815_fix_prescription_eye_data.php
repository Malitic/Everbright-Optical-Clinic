<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Fix prescription eye data that might be double-encoded JSON
        $prescriptions = DB::table('prescriptions')->get();
        
        foreach ($prescriptions as $prescription) {
            $rightEye = $prescription->right_eye;
            $leftEye = $prescription->left_eye;
            
            // Check if the data is a JSON string that needs to be decoded
            if (is_string($rightEye) && $this->isJson($rightEye)) {
                $decodedRight = json_decode($rightEye, true);
                if (is_array($decodedRight)) {
                    DB::table('prescriptions')
                        ->where('id', $prescription->id)
                        ->update(['right_eye' => json_encode($decodedRight)]);
                }
            }
            
            if (is_string($leftEye) && $this->isJson($leftEye)) {
                $decodedLeft = json_decode($leftEye, true);
                if (is_array($decodedLeft)) {
                    DB::table('prescriptions')
                        ->where('id', $prescription->id)
                        ->update(['left_eye' => json_encode($decodedLeft)]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse this data fix
    }
    
    /**
     * Check if a string is valid JSON
     */
    private function isJson($string): bool
    {
        json_decode($string);
        return json_last_error() === JSON_ERROR_NONE;
    }
};