import React, { useState, useRef } from 'react';
import { Upload, FolderOpen, Image, Package, AlertCircle, CheckCircle, X, FileArchive } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Category {
  id: number;
  name: string;
  slug: string;
  color: string;
}

interface UploadResult {
  uploaded_count: number;
  error_count: number;
  products: any[];
  errors: Array<{
    file: string;
    error: string;
  }>;
}

const BulkUploadManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [brand, setBrand] = useState('');
  const [autoCategorize, setAutoCategorize] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/product-categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
        setSelectedFile(file);
        setUploadResult(null);
      } else {
        toast.error('Please select a ZIP file');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedCategory) {
      toast.error('Please select a file and category');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('folder', selectedFile);
      formData.append('category_id', selectedCategory);
      if (brand) formData.append('brand', brand);
      formData.append('auto_categorize', autoCategorize.toString());

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      const response = await fetch('/api/bulk-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        setUploadResult(result);
        toast.success(`Upload completed! ${result.uploaded_count} products created`);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Upload failed');
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
    setSelectedCategory('');
    setBrand('');
    setAutoCategorize(false);
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
        <h1 className="text-3xl font-bold text-gray-900">Bulk Product Upload</h1>
        <p className="text-gray-600 mt-2">Upload multiple products from a ZIP folder</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Upload Products
            </CardTitle>
            <CardDescription>
              Upload a ZIP file containing product images. Each image will become a product.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file">ZIP File</Label>
              <div className="mt-1">
                <input
                  ref={fileInputRef}
                  id="file"
                  type="file"
                  accept=".zip"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              {selectedFile && (
                <div className="mt-2 flex items-center text-sm text-gray-600">
                  <FileArchive className="w-4 h-4 mr-2" />
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="brand">Brand (Optional)</Label>
              <Input
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g., Ray-Ban, Oakley"
                className="mt-1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto_categorize"
                checked={autoCategorize}
                onChange={(e) => setAutoCategorize(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="auto_categorize">Auto-categorize based on filename</Label>
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            <div className="flex space-x-2">
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || !selectedCategory || uploading}
                className="flex-1"
              >
                {uploading ? 'Uploading...' : 'Upload Products'}
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

        {/* Upload Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FolderOpen className="w-5 h-5 mr-2" />
              Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">How to prepare your ZIP file:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>Create a folder with your product images</li>
                <li>Name images descriptively (e.g., "Ray-Ban Aviator Black.jpg")</li>
                <li>Compress the folder into a ZIP file</li>
                <li>Upload the ZIP file here</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Supported formats:</h4>
              <div className="flex flex-wrap gap-2">
                {['JPG', 'PNG', 'GIF', 'WEBP'].map((format) => (
                  <Badge key={format} variant="secondary">{format}</Badge>
                ))}
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Each image will become a separate product. You'll need to set prices and stock quantities manually after upload.
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
              Upload Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{uploadResult.uploaded_count}</div>
                <div className="text-sm text-gray-600">Products Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{uploadResult.error_count}</div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {uploadResult.uploaded_count + uploadResult.error_count}
                </div>
                <div className="text-sm text-gray-600">Total Files</div>
              </div>
            </div>

            {uploadResult.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Errors:</h4>
                <div className="space-y-1">
                  {uploadResult.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      <strong>{error.file}:</strong> {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadResult.products.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Created Products:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {uploadResult.products.slice(0, 6).map((product, index) => (
                    <div key={index} className="text-sm bg-green-50 p-2 rounded">
                      <strong>{product.name}</strong> - {product.sku}
                    </div>
                  ))}
                  {uploadResult.products.length > 6 && (
                    <div className="text-sm text-gray-500">
                      ... and {uploadResult.products.length - 6} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulkUploadManager;




