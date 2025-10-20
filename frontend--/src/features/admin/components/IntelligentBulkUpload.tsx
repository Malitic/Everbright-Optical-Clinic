import React, { useState, useRef } from 'react';
import { Upload, FolderOpen, Package, AlertCircle, CheckCircle, X, FileArchive, Brain, Tag, Eye, Sun, Droplet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UploadResult {
  uploaded_count: number;
  error_count: number;
  categories_created: any[];
  products: any[];
  errors: Array<{
    file: string;
    error: string;
  }>;
  summary: {
    branded_frames: number;
    non_branded_frames: number;
    contact_lenses: number;
    solutions: number;
    sunglasses: number;
  };
  processed_groups?: number;
  total_groups?: number;
}

const IntelligentBulkUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [defaultPrice, setDefaultPrice] = useState('');
  const [defaultStock, setDefaultStock] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [precheckNote, setPrecheckNote] = useState<string>('');
  const [isTooLarge, setIsTooLarge] = useState<boolean>(false);
  const [maxProducts, setMaxProducts] = useState<string>('25');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
        setSelectedFile(file);
        setUploadResult(null);
        // Pre-check: estimate and warn for large archives
        const sizeMB = file.size / (1024 * 1024);
        const warnThresholdMB = 400; // soft warn
        const hardThresholdMB = 1500; // optional hard stop
        // Rough estimate: network (30–80 MB/s LAN) + disk/processing cost
        const estMinutes = Math.max(0.5, Math.round((sizeMB / 80 + sizeMB / 300) * 10) / 10);
        const note = `Selected ZIP size: ${sizeMB.toFixed(1)} MB. Estimated processing time ~ ${estMinutes.toFixed(1)} min. ` +
          (sizeMB > warnThresholdMB ? 'Consider splitting into 100–200 images for faster turnaround.' : '');
        setPrecheckNote(note);
        setIsTooLarge(sizeMB > hardThresholdMB);
        if (sizeMB > warnThresholdMB) {
          toast.warning('Large ZIP detected. Splitting into smaller batches (100–200 images) will be faster.');
        }
      } else {
        toast.error('Please select a ZIP file');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    const token = sessionStorage.getItem('auth_token') || localStorage.getItem('token') || '';
    if (!token) {
      toast.error('Not authenticated. Please log in again.');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('folder', selectedFile);
      if (defaultPrice) formData.append('default_price', defaultPrice);
      if (defaultStock) formData.append('default_stock', defaultStock);
      formData.append('auto_categorize', 'true');
      if (maxProducts) formData.append('max_products', maxProducts);

      // Client-side progressive feedback based on file size (rough)
      const fileSizeMB = selectedFile.size / (1024 * 1024);
      const start = Date.now();
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 99) return prev;
          const elapsed = (Date.now() - start) / 1000;
          const est = Math.min(95, Math.max(prev + 1, (elapsed / Math.max(5, fileSizeMB / 3)) * 60));
          return est;
        });
      }, 250);

      // Use configured API base URL to avoid hitting Vite dev server
      const response = await fetch(`${apiBase}/intelligent-bulk-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        setUploadResult(result);
        toast.success(`Intelligent upload completed! ${result.uploaded_count} products created`);
      } else {
        let message = `Upload failed (${response.status})`;
        try {
          const error = await response.json();
          if (error?.message) message = error.message;
        } catch {
          try {
            const text = await response.text();
            if (text) message = `${message}: ${text.substring(0, 200)}`;
          } catch {}
        }
        toast.error(message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setDefaultPrice('');
    setDefaultStock('');
    setUploadResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Intelligent Bulk Upload</h1>
        <p className="text-gray-600 mt-2">AI-powered product upload from organized folder structure</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="w-5 h-5 mr-2 text-purple-600" />
              Intelligent Upload
            </CardTitle>
            <CardDescription>
              Upload your organized folder structure and let AI categorize products automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file">Organized ZIP File</Label>
              <div className="mt-1">
                <input
                  ref={fileInputRef}
                  id="file"
                  type="file"
                  accept=".zip"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
              </div>
              {selectedFile && (
                <div className="mt-2 flex items-center text-sm text-gray-600">
                  <FileArchive className="w-4 h-4 mr-2" />
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
              {precheckNote && (
                <Alert className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{precheckNote}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="default_price">Default Price (₱)</Label>
                <Input
                  id="default_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={defaultPrice}
                  onChange={(e) => setDefaultPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="default_stock">Default Stock</Label>
                <Input
                  id="default_stock"
                  type="number"
                  min="0"
                  value={defaultStock}
                  onChange={(e) => setDefaultStock(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Optional: Cap per-request processing for speed */}
            <div>
              <Label htmlFor="max_products">Process up to (products per run)</Label>
              <Input
                id="max_products"
                type="number"
                min="0"
                placeholder="e.g., 25 (0 = all)"
                value={maxProducts}
                onChange={(e) => setMaxProducts(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Use 25–50 for faster completion; run multiple times to finish all.</p>
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing with AI...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            <div className="flex space-x-2">
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading || isTooLarge}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {isTooLarge ? 'File too large (split first)' : (uploading ? 'Processing...' : 'Start Intelligent Upload')}
              </Button>
              <Button
                onClick={resetUpload}
                variant="outline"
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Folder Structure Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FolderOpen className="w-5 h-5 mr-2" />
              Expected Folder Structure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Your folder should contain:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Tag className="w-4 h-4 mr-2 text-blue-600" />
                  <span><strong>Branded/</strong> - Brand → Shape → Color</span>
                </div>
                <div className="flex items-center">
                  <Package className="w-4 h-4 mr-2 text-gray-600" />
                  <span><strong>Non-Branded/</strong> - Shape → Color</span>
                </div>
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-2 text-green-600" />
                  <span><strong>Contact Lenses/</strong> - Numbered images</span>
                </div>
                <div className="flex items-center">
                  <Droplet className="w-4 h-4 mr-2 text-purple-600" />
                  <span><strong>Solution/</strong> - Numbered images</span>
                </div>
                <div className="flex items-center">
                  <Sun className="w-4 h-4 mr-2 text-yellow-600" />
                  <span><strong>SUNGLASSES/</strong> - Branded & Non-Branded</span>
                </div>
              </div>
            </div>

            <Alert>
              <Brain className="h-4 w-4" />
              <AlertDescription>
                The AI will automatically detect your folder structure and create products with proper categorization, SKUs, and attributes.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Upload Results */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Intelligent Upload Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{uploadResult.uploaded_count}</div>
                <div className="text-sm text-gray-600">Total Products</div>
              </div>
              {typeof uploadResult.processed_groups !== 'undefined' && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{uploadResult.processed_groups}/{uploadResult.total_groups}</div>
                  <div className="text-sm text-gray-600">Processed Groups</div>
                </div>
              )}
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{uploadResult.summary.branded_frames}</div>
                <div className="text-sm text-gray-600">Branded Frames</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{uploadResult.summary.non_branded_frames}</div>
                <div className="text-sm text-gray-600">Non-Branded Frames</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{uploadResult.summary.contact_lenses}</div>
                <div className="text-sm text-gray-600">Contact Lenses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{uploadResult.summary.sunglasses}</div>
                <div className="text-sm text-gray-600">Sunglasses</div>
              </div>
            </div>

            {/* Error Summary */}
            {uploadResult.error_count > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Errors ({uploadResult.error_count}):</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {uploadResult.errors.slice(0, 5).map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      <strong>{error.file}:</strong> {error.error}
                    </div>
                  ))}
                  {uploadResult.errors.length > 5 && (
                    <div className="text-sm text-gray-500">
                      ... and {uploadResult.errors.length - 5} more errors
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sample Products */}
            {uploadResult.products.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Sample Created Products:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {uploadResult.products.slice(0, 8).map((product, index) => (
                    <div key={index} className="text-sm bg-green-50 p-2 rounded">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-gray-500 text-xs">
                        {product.brand} • {product.sku} • {product.category?.name || 'Uncategorized'}
                      </div>
                    </div>
                  ))}
                  {uploadResult.products.length > 8 && (
                    <div className="text-sm text-gray-500">
                      ... and {uploadResult.products.length - 8} more products
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Success Message */}
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <h4 className="font-medium text-green-900">Upload Successful!</h4>
                  <p className="text-sm text-green-700">
                    {uploadResult.uploaded_count} products have been created and are ready for pricing and stock setup.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IntelligentBulkUpload;




