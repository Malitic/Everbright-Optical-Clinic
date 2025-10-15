import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Palette, 
  Tag, 
  CheckCircle, 
  X, 
  Edit2,
  Download,
  Trash2,
  Eye,
  Loader2,
  FileArchive
} from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  analyzeImage, 
  batchAnalyzeImages, 
  ImageAnalysisResult 
} from '@/utils/imageUtils';

interface AnalyzedImage {
  file: File;
  preview: string;
  analysis: ImageAnalysisResult;
  category: string;
  color: string;
  brand: string;
}

interface ProductGroup {
  id: string;
  name: string;
  category: string;
  color: string;
  brand: string;
  images: AnalyzedImage[];
  primaryImageIndex: number;
}

interface ColorVariant {
  color: string;
  images: AnalyzedImage[];
  primaryImageIndex: number;
}

interface ProductWithVariants {
  id: string;
  name: string;
  category: string;
  brand: string;
  colorVariants: ColorVariant[];
  selectedColorIndex: number;
}

const CATEGORIES = [
  'Frames',
  'Sunglasses',
  'Contact Lenses',
  'Solutions',
  'Accessories',
];

const COLORS = [
  'Black',
  'White',
  'Gray',
  'Silver',
  'Gold',
  'Brown',
  'Red',
  'Pink',
  'Orange',
  'Yellow',
  'Green',
  'Cyan',
  'Blue',
  'Purple',
  'Mixed',
  'Transparent',
];

const ImageAnalyzer: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [analyzedImages, setAnalyzedImages] = useState<AnalyzedImage[]>([]);
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [productsWithVariants, setProductsWithVariants] = useState<ProductWithVariants[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [groupingMode, setGroupingMode] = useState<'none' | 'angle' | 'color'>('color');
  const [extractingZip, setExtractingZip] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractImagesFromZip = async (zipFile: File): Promise<File[]> => {
    try {
      setExtractingZip(true);
      const zip = new JSZip();
      const zipData = await zip.loadAsync(zipFile);
      const imageFiles: File[] = [];

      // Get all files in the ZIP
      const filePromises: Promise<void>[] = [];
      
      zipData.forEach((relativePath, zipEntry) => {
        // Skip directories and hidden files
        if (zipEntry.dir || relativePath.startsWith('__MACOSX') || relativePath.startsWith('.')) {
          return;
        }

        // Check if file is an image
        const ext = relativePath.toLowerCase().split('.').pop();
        if (!ext || !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
          return;
        }

        // Extract the file with folder structure information
        const promise = zipEntry.async('blob').then((blob) => {
          // Get folder name and filename
          const pathParts = relativePath.split('/').filter(p => p.length > 0);
          let fileName = pathParts[pathParts.length - 1]; // Original filename
          
          // If file is in a folder, prepend folder name to filename
          // This preserves the folder structure in the filename
          if (pathParts.length > 1) {
            const folderName = pathParts[pathParts.length - 2]; // Parent folder name
            // Create a new filename that includes folder info
            // Format: FolderName_OriginalFilename.ext
            fileName = `${folderName}_${fileName}`;
          }
          
          const file = new File([blob], fileName, { type: `image/${ext}` });
          imageFiles.push(file);
        });

        filePromises.push(promise);
      });

      await Promise.all(filePromises);
      setExtractingZip(false);
      
      return imageFiles;
    } catch (error) {
      setExtractingZip(false);
      console.error('Error extracting ZIP:', error);
      throw new Error('Failed to extract images from ZIP file');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) {
      return;
    }

    try {
      let imageFiles: File[] = [];

      // Check if it's a ZIP file
      if (files.length === 1 && (files[0].type === 'application/zip' || files[0].name.endsWith('.zip'))) {
        toast.info('Extracting images from ZIP file...');
        imageFiles = await extractImagesFromZip(files[0]);
        
        if (imageFiles.length === 0) {
          toast.error('No images found in ZIP file');
          return;
        }
        
        toast.success(`Extracted ${imageFiles.length} images from ZIP`);
      } else {
        // Regular image files
        imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
          toast.error('Please select image files or a ZIP file containing images');
          return;
        }
      }

      if (imageFiles.length > 600) {
        toast.error('Maximum 600 images at a time');
        return;
      }

      setSelectedFiles(imageFiles);
      setAnalyzedImages([]);
    } catch (error) {
      console.error('File selection error:', error);
      toast.error('Failed to process files');
    }
  };

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to analyze');
      return;
    }

    try {
      setAnalyzing(true);
      setAnalysisProgress(0);

      const results = await batchAnalyzeImages(selectedFiles, (current, total) => {
        setAnalysisProgress((current / total) * 100);
      });

      const analyzed: AnalyzedImage[] = await Promise.all(
        selectedFiles.map(async (file) => {
          const analysis = results.get(file.name) || {
            dominantColor: { name: 'Unknown', rgb: { r: 0, g: 0, b: 0 }, hex: '#000000', percentage: 0 },
            palette: [],
            suggestedCategory: 'Frames',
            suggestedColors: ['Unknown'],
            confidence: 0,
          };

          // Try to extract color from filename first (from folder name or image name)
          const colorFromFilename = extractColorFromFilename(file.name);
          const finalColor = colorFromFilename || analysis.dominantColor.name;

          return {
            file,
            preview: URL.createObjectURL(file),
            analysis,
            category: analysis.suggestedCategory,
            color: finalColor, // Use filename color if available, otherwise AI-detected color
            brand: extractBrandFromFilename(file.name),
          };
        })
      );

      setAnalyzedImages(analyzed);
      
      // Auto-group images based on grouping mode
      if (groupingMode === 'color') {
        const variants = groupImagesByColorVariants(analyzed);
        setProductsWithVariants(variants);
        const totalColors = variants.reduce((sum, p) => sum + p.colorVariants.length, 0);
        toast.success(`Successfully analyzed ${analyzed.length} images! Grouped into ${variants.length} products with ${totalColors} color variants!`);
      } else if (groupingMode === 'angle') {
        const groups = groupImagesByProduct(analyzed);
        setProductGroups(groups);
        toast.success(`Successfully analyzed ${analyzed.length} images and grouped into ${groups.length} products!`);
      } else {
        toast.success(`Successfully analyzed ${analyzed.length} images!`);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze images');
    } finally {
      setAnalyzing(false);
    }
  };

  const cycleGroupingMode = () => {
    const modes: Array<'none' | 'angle' | 'color'> = ['none', 'angle', 'color'];
    const currentIndex = modes.indexOf(groupingMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    
    setGroupingMode(nextMode);
    
    if (analyzedImages.length > 0) {
      if (nextMode === 'color') {
        const variants = groupImagesByColorVariants(analyzedImages);
        setProductsWithVariants(variants);
        setProductGroups([]);
        toast.success(`Color variant mode: ${variants.length} products`);
      } else if (nextMode === 'angle') {
        const groups = groupImagesByProduct(analyzedImages);
        setProductGroups(groups);
        setProductsWithVariants([]);
        toast.success(`Angle grouping mode: ${groups.length} products`);
      } else {
        setProductGroups([]);
        setProductsWithVariants([]);
        toast.info('Individual image mode');
      }
    }
  };

  const extractBrandFromFilename = (filename: string): string => {
    const parts = filename.replace(/\.[^/.]+$/, '').split(/[-_\s]/);
    return parts[0] || 'Generic';
  };

  // Extract color from filename (folder name or image name)
  const extractColorFromFilename = (filename: string): string | null => {
    const lowerName = filename.toLowerCase();
    
    // Check for each known color in the filename
    for (const color of COLORS) {
      const colorLower = color.toLowerCase();
      // Check if color appears as a separate word/segment
      const regex = new RegExp(`\\b${colorLower}\\b|[-_]${colorLower}[-_]|[-_]${colorLower}$|^${colorLower}[-_]`, 'i');
      if (regex.test(lowerName)) {
        return color;
      }
    }
    
    return null;
  };

  const getBaseProductName = (filename: string): string => {
    // Remove file extension
    let name = filename.replace(/\.[^/.]+$/, '');
    
    // Remove common angle/view indicators
    name = name.replace(/[-_\s]*(front|back|side|top|bottom|detail|angle|view|image|img)[-_\s]*\d*/gi, '');
    
    // Remove trailing numbers that might indicate sequence (e.g., _001, _1, -01)
    name = name.replace(/[-_\s]*\d{1,3}$/, '');
    
    // Clean up any double separators
    name = name.replace(/[-_\s]+/g, '_');
    
    return name.trim();
  };

  const getProductNameWithoutColor = (filename: string, detectedColor: string): string => {
    let name = getBaseProductName(filename);
    
    // Remove color names from the product name
    const colorPatterns = [
      detectedColor,
      ...COLORS.map(c => c.toLowerCase())
    ];
    
    colorPatterns.forEach(color => {
      const regex = new RegExp(`[-_\\s]*${color}[-_\\s]*`, 'gi');
      name = name.replace(regex, '_');
    });
    
    // Clean up any double separators
    name = name.replace(/[-_\s]+/g, '_');
    name = name.replace(/^[-_\s]+|[-_\s]+$/g, '');
    
    return name.trim();
  };

  // Helper function to detect if an image is a front view
  const isFrontView = (filename: string): boolean => {
    const lowerName = filename.toLowerCase();
    // Check for front indicators
    const frontPatterns = [
      /\bfront\b/,
      /\bf\b/,
      /^front[-_]/,
      /[-_]front[-_]/,
      /[-_]front\./,
      /\b01\b/,
      /_1\b/,
      /^1[-_]/,
    ];
    return frontPatterns.some(pattern => pattern.test(lowerName));
  };

  // Helper function to find the best front-facing image in a group
  const findFrontImageIndex = (images: AnalyzedImage[]): number => {
    // First, try to find explicit "front" in filename
    const frontIndex = images.findIndex(img => isFrontView(img.file.name));
    if (frontIndex !== -1) return frontIndex;
    
    // If no explicit front, use the first image
    return 0;
  };

  const groupImagesByProduct = (images: AnalyzedImage[]): ProductGroup[] => {
    const groups = new Map<string, AnalyzedImage[]>();

    // Group images by base product name
    images.forEach((img) => {
      const baseName = getBaseProductName(img.file.name);
      const key = `${baseName}_${img.brand}_${img.color}`.toLowerCase();
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(img);
    });

    // Convert groups to ProductGroup array
    const productGroups: ProductGroup[] = [];
    let groupId = 1;

    groups.forEach((groupImages, key) => {
      const firstImage = groupImages[0];
      const baseName = getBaseProductName(firstImage.file.name);
      
      // Automatically detect and set the front view as primary
      const frontImageIndex = findFrontImageIndex(groupImages);
      
      productGroups.push({
        id: `group_${groupId++}`,
        name: baseName || `Product ${groupId}`,
        category: firstImage.category,
        color: firstImage.color,
        brand: firstImage.brand,
        images: groupImages,
        primaryImageIndex: frontImageIndex,
      });
    });

    return productGroups;
  };

  const groupImagesByColorVariants = (images: AnalyzedImage[]): ProductWithVariants[] => {
    const productMap = new Map<string, Map<string, AnalyzedImage[]>>();

    // Group images by product (ignoring color) and then by color
    images.forEach((img) => {
      const baseNameWithoutColor = getProductNameWithoutColor(img.file.name, img.color);
      const productKey = `${baseNameWithoutColor}_${img.brand}`.toLowerCase();
      
      if (!productMap.has(productKey)) {
        productMap.set(productKey, new Map<string, AnalyzedImage[]>());
      }
      
      const colorMap = productMap.get(productKey)!;
      const colorKey = img.color.toLowerCase();
      
      if (!colorMap.has(colorKey)) {
        colorMap.set(colorKey, []);
      }
      
      colorMap.get(colorKey)!.push(img);
    });

    // Convert to ProductWithVariants array
    const productsWithVariants: ProductWithVariants[] = [];
    let productId = 1;

    productMap.forEach((colorMap, productKey) => {
      const colorVariants: ColorVariant[] = [];
      
      colorMap.forEach((colorImages, colorKey) => {
        // Automatically detect and set the front view as primary for this color
        const frontImageIndex = findFrontImageIndex(colorImages);
        
        colorVariants.push({
          color: colorImages[0].color,
          images: colorImages,
          primaryImageIndex: frontImageIndex,
        });
      });

      // Sort color variants alphabetically
      colorVariants.sort((a, b) => a.color.localeCompare(b.color));

      const firstVariant = colorVariants[0];
      const firstImage = firstVariant.images[0];
      const productName = getProductNameWithoutColor(firstImage.file.name, firstImage.color);

      productsWithVariants.push({
        id: `product_${productId++}`,
        name: productName || `Product ${productId}`,
        category: firstImage.category,
        brand: firstImage.brand,
        colorVariants,
        selectedColorIndex: 0,
      });
    });

    return productsWithVariants;
  };

  const updateImage = (index: number, field: keyof AnalyzedImage, value: string) => {
    const updated = [...analyzedImages];
    updated[index] = { ...updated[index], [field]: value };
    setAnalyzedImages(updated);
  };

  const updateProductGroup = (groupId: string, field: 'category' | 'color' | 'brand' | 'name', value: string) => {
    const updated = productGroups.map(group => {
      if (group.id === groupId) {
        return { ...group, [field]: value };
      }
      return group;
    });
    setProductGroups(updated);
  };

  const setPrimaryImage = (groupId: string, imageIndex: number) => {
    const updated = productGroups.map(group => {
      if (group.id === groupId) {
        return { ...group, primaryImageIndex: imageIndex };
      }
      return group;
    });
    setProductGroups(updated);
  };

  const removeImageFromGroup = (groupId: string, imageIndex: number) => {
    const updated = productGroups.map(group => {
      if (group.id === groupId) {
        const newImages = group.images.filter((_, idx) => idx !== imageIndex);
        if (newImages.length === 0) {
          return null; // Mark for removal
        }
        return {
          ...group,
          images: newImages,
          primaryImageIndex: group.primaryImageIndex >= imageIndex && group.primaryImageIndex > 0 
            ? group.primaryImageIndex - 1 
            : group.primaryImageIndex,
        };
      }
      return group;
    }).filter(group => group !== null) as ProductGroup[];
    
    setProductGroups(updated);
    toast.success('Image removed from group');
  };

  const removeProductGroup = (groupId: string) => {
    const updated = productGroups.filter(group => group.id !== groupId);
    setProductGroups(updated);
    toast.success('Product group removed');
  };

  const removeImage = (index: number) => {
    const updated = analyzedImages.filter((_, i) => i !== index);
    setAnalyzedImages(updated);
    toast.success('Image removed');
  };

  const exportResults = () => {
    let data;
    let filename;

    if (groupingMode === 'color' && productsWithVariants.length > 0) {
      // Export products with color variants
      data = productsWithVariants.map(product => ({
        productName: product.name,
        category: product.category,
        brand: product.brand,
        colorVariants: product.colorVariants.map(variant => ({
          color: variant.color,
          imageCount: variant.images.length,
          images: variant.images.map((img, idx) => ({
            filename: img.file.name,
            isPrimary: idx === variant.primaryImageIndex,
            dominantColor: img.analysis.dominantColor.hex,
            confidence: img.analysis.confidence,
          })),
          primaryImage: variant.images[variant.primaryImageIndex].file.name,
          palette: variant.images[variant.primaryImageIndex].analysis.palette.map(c => ({
            name: c.name,
            hex: c.hex,
            percentage: c.percentage,
          })),
        })),
      }));
      filename = `image-analysis-color-variants-${Date.now()}.json`;
    } else if (groupingMode === 'angle' && productGroups.length > 0) {
      // Export grouped products by angle
      data = productGroups.map(group => ({
        productName: group.name,
        category: group.category,
        color: group.color,
        brand: group.brand,
        imageCount: group.images.length,
        images: group.images.map((img, idx) => ({
          filename: img.file.name,
          isPrimary: idx === group.primaryImageIndex,
          dominantColor: img.analysis.dominantColor.hex,
          confidence: img.analysis.confidence,
        })),
        primaryImage: group.images[group.primaryImageIndex].file.name,
        palette: group.images[group.primaryImageIndex].analysis.palette.map(c => ({
          name: c.name,
          hex: c.hex,
          percentage: c.percentage,
        })),
      }));
      filename = `image-analysis-angle-grouped-${Date.now()}.json`;
    } else {
      // Export individual images
      data = analyzedImages.map((img, idx) => ({
        filename: img.file.name,
        category: img.category,
        color: img.color,
        brand: img.brand,
        dominantColor: img.analysis.dominantColor.hex,
        confidence: img.analysis.confidence,
        palette: img.analysis.palette.map(c => ({ name: c.name, hex: c.hex, percentage: c.percentage })),
      }));
      filename = `image-analysis-individual-${Date.now()}.json`;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Results exported!');
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Frames': 'bg-blue-100 text-blue-800',
      'Sunglasses': 'bg-yellow-100 text-yellow-800',
      'Contact Lenses': 'bg-green-100 text-green-800',
      'Solutions': 'bg-purple-100 text-purple-800',
      'Accessories': 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const updateProductWithVariants = (productId: string, field: 'category' | 'brand' | 'name', value: string) => {
    const updated = productsWithVariants.map(product => {
      if (product.id === productId) {
        return { ...product, [field]: value };
      }
      return product;
    });
    setProductsWithVariants(updated);
  };

  const selectColorVariant = (productId: string, colorIndex: number) => {
    const updated = productsWithVariants.map(product => {
      if (product.id === productId) {
        return { ...product, selectedColorIndex: colorIndex };
      }
      return product;
    });
    setProductsWithVariants(updated);
  };

  const setPrimaryImageInVariant = (productId: string, colorIndex: number, imageIndex: number) => {
    const updated = productsWithVariants.map(product => {
      if (product.id === productId) {
        const updatedVariants = product.colorVariants.map((variant, idx) => {
          if (idx === colorIndex) {
            return { ...variant, primaryImageIndex: imageIndex };
          }
          return variant;
        });
        return { ...product, colorVariants: updatedVariants };
      }
      return product;
    });
    setProductsWithVariants(updated);
  };

  const removeProductWithVariants = (productId: string) => {
    const updated = productsWithVariants.filter(p => p.id !== productId);
    setProductsWithVariants(updated);
    toast.success('Product removed');
  };

  const uploadToGallery = async () => {
    if (groupingMode === 'color' && productsWithVariants.length === 0 && 
        groupingMode === 'angle' && productGroups.length === 0 && 
        analyzedImages.length === 0) {
      toast.error('No products to upload');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Get token from sessionStorage (auth system uses sessionStorage with key 'auth_token')
      const token = sessionStorage.getItem('auth_token');
      if (!token) {
        toast.error('Please login to upload products');
        setUploading(false);
        return;
      }

      let uploadedCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      if (groupingMode === 'color' && productsWithVariants.length > 0) {
        // Upload products with color variants
        const totalProducts = productsWithVariants.length;
        
        for (let i = 0; i < productsWithVariants.length; i++) {
          const product = productsWithVariants[i];
          
          try {
            // Create FormData for this product with all color variants
            const formData = new FormData();
            formData.append('name', product.name);
            formData.append('brand', product.brand);
            formData.append('category', product.category);
            formData.append('has_color_variants', 'true');
            
            // Add color variants data
            const colorVariantsData = product.colorVariants.map((variant, variantIdx) => ({
              color: variant.color,
              primaryImageIndex: variant.primaryImageIndex,
              imageCount: variant.images.length,
            }));
            formData.append('color_variants', JSON.stringify(colorVariantsData));

            // Add all images for all color variants
            let imageIndex = 0;
            product.colorVariants.forEach((variant, variantIdx) => {
              variant.images.forEach((img, imgIdx) => {
                formData.append('images[]', img.file);
                formData.append(`image_color_${imageIndex}`, variant.color);
                formData.append(`image_is_primary_${imageIndex}`, (imgIdx === variant.primaryImageIndex).toString());
                formData.append(`image_variant_index_${imageIndex}`, variantIdx.toString());
                imageIndex++;
              });
            });

            // Set default price and stock
            formData.append('price', '0');
            formData.append('stock_quantity', '0');
            formData.append('description', `${product.brand} ${product.name} - Available in ${product.colorVariants.length} colors`);

            // Get API base URL (backend server)
            const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            
            const response = await fetch(`${apiBaseUrl}/products/create-with-variants`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              body: formData,
            });

            if (response.ok) {
              uploadedCount++;
            } else {
              const error = await response.json();
              errors.push(`${product.name}: ${error.message || 'Upload failed'}`);
              errorCount++;
            }
          } catch (err) {
            errors.push(`${product.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            errorCount++;
          }

          setUploadProgress(((i + 1) / totalProducts) * 100);
        }
      } else if (groupingMode === 'angle' && productGroups.length > 0) {
        // Upload products grouped by angle
        const totalProducts = productGroups.length;

        for (let i = 0; i < productGroups.length; i++) {
          const group = productGroups[i];

          try {
            const formData = new FormData();
            formData.append('name', group.name);
            formData.append('brand', group.brand);
            formData.append('category', group.category);
            formData.append('color', group.color);
            formData.append('price', '0');
            formData.append('stock_quantity', '0');
            formData.append('description', `${group.brand} ${group.name} in ${group.color}`);

            // Add all images
            group.images.forEach((img, idx) => {
              formData.append('images[]', img.file);
              if (idx === group.primaryImageIndex) {
                formData.append('primary_image_index', idx.toString());
              }
            });

            // Get API base URL (backend server)
            const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            
            const response = await fetch(`${apiBaseUrl}/products`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              body: formData,
            });

            if (response.ok) {
              uploadedCount++;
            } else {
              const error = await response.json();
              errors.push(`${group.name}: ${error.message || 'Upload failed'}`);
              errorCount++;
            }
          } catch (err) {
            errors.push(`${group.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            errorCount++;
          }

          setUploadProgress(((i + 1) / totalProducts) * 100);
        }
      } else {
        // Upload individual images as separate products
        const totalImages = analyzedImages.length;

        for (let i = 0; i < analyzedImages.length; i++) {
          const img = analyzedImages[i];

          try {
            const formData = new FormData();
            formData.append('name', img.file.name.replace(/\.[^/.]+$/, ''));
            formData.append('brand', img.brand);
            formData.append('category', img.category);
            formData.append('color', img.color);
            formData.append('price', '0');
            formData.append('stock_quantity', '0');
            formData.append('description', `${img.brand} product in ${img.color}`);
            formData.append('images[]', img.file);

            // Get API base URL (backend server)
            const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            
            const response = await fetch(`${apiBaseUrl}/products`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              body: formData,
            });

            if (response.ok) {
              uploadedCount++;
            } else {
              const error = await response.json();
              errors.push(`${img.file.name}: ${error.message || 'Upload failed'}`);
              errorCount++;
            }
          } catch (err) {
            errors.push(`${img.file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            errorCount++;
          }

          setUploadProgress(((i + 1) / totalImages) * 100);
        }
      }

      // Show results
      if (uploadedCount > 0) {
        toast.success(`Successfully uploaded ${uploadedCount} product(s) to gallery!`);
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to upload ${errorCount} product(s). Check console for details.`);
        console.error('Upload errors:', errors);
      }

      // Reset after successful upload
      if (uploadedCount > 0 && errorCount === 0) {
        setTimeout(() => {
          resetAll();
        }, 2000);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload products');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const resetAll = () => {
    setSelectedFiles([]);
    setAnalyzedImages([]);
    setProductGroups([]);
    setProductsWithVariants([]);
    setAnalysisProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Image Analyzer</h1>
        <p className="text-gray-600 mt-2">
          Upload up to 600 images to automatically detect colors and categories
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ImageIcon className="w-5 h-5 mr-2 text-blue-600" />
            Upload Images
          </CardTitle>
          <CardDescription>
            Select multiple images or upload a ZIP file to analyze colors and suggest categories
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="images">Select Images or ZIP File (max 600 images)</Label>
            <div className="mt-1">
              <input
                ref={fileInputRef}
                id="images"
                type="file"
                accept="image/*,.zip"
                multiple
                onChange={handleFileSelect}
                disabled={extractingZip || analyzing}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            {selectedFiles.length > 0 && (
              <div className="mt-2 flex items-center text-sm text-gray-600">
                <ImageIcon className="w-4 h-4 mr-2" />
                {selectedFiles.length} image(s) selected
              </div>
            )}
          </div>

          {extractingZip && (
            <div className="space-y-2">
              <div className="flex items-center text-sm text-blue-600">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Extracting images from ZIP file...</span>
              </div>
              <Progress value={50} className="w-full" />
            </div>
          )}

          {analyzing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing images with AI...
                </span>
                <span>{Math.round(analysisProgress)}%</span>
              </div>
              <Progress value={analysisProgress} className="w-full" />
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              onClick={handleAnalyze}
              disabled={selectedFiles.length === 0 || analyzing || extractingZip}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {analyzing ? 'Analyzing...' : extractingZip ? 'Extracting...' : `Analyze ${selectedFiles.length} Image(s)`}
            </Button>
            <Button
              onClick={resetAll}
              variant="outline"
              disabled={analyzing || extractingZip}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center">
                  <Upload className="w-4 h-4 mr-2 animate-pulse text-green-600" />
                  Uploading products to gallery...
                </span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-gray-600">
                Products will be available in both Admin and Customer Product Gallery after upload.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      {analyzedImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{analyzedImages.length}</div>
                <div className="text-sm text-gray-600 mt-1">Total Images</div>
              </div>
            </CardContent>
          </Card>
          {groupingMode === 'color' && productsWithVariants.length > 0 && (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{productsWithVariants.length}</div>
                    <div className="text-sm text-gray-600 mt-1">Products</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {productsWithVariants.reduce((sum, p) => sum + p.colorVariants.length, 0)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Color Variants</div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          {groupingMode === 'angle' && productGroups.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{productGroups.length}</div>
                  <div className="text-sm text-gray-600 mt-1">Products</div>
                </div>
              </CardContent>
            </Card>
          )}
          {CATEGORIES.slice(0, 2).map((cat) => (
            <Card key={cat}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-800">
                    {groupingMode === 'color' && productsWithVariants.length > 0
                      ? productsWithVariants.filter(p => p.category === cat).length
                      : groupingMode === 'angle' && productGroups.length > 0
                      ? productGroups.filter(group => group.category === cat).length
                      : analyzedImages.filter(img => img.category === cat).length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{cat}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results */}
      {analyzedImages.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Analysis Results
              </CardTitle>
              <div className="flex space-x-2">
                <Button
                  onClick={cycleGroupingMode}
                  variant={groupingMode !== 'none' ? "default" : "outline"}
                  size="sm"
                  disabled={uploading}
                >
                  <Tag className="w-4 h-4 mr-2" />
                  {groupingMode === 'color' ? 'Color Variants' : groupingMode === 'angle' ? 'Angle Groups' : 'Individual'}
                </Button>
                <Button
                  onClick={uploadToGallery}
                  variant="default"
                  size="sm"
                  disabled={uploading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? `Uploading ${Math.round(uploadProgress)}%` : 'Upload to Gallery'}
                </Button>
                <Button
                  onClick={exportResults}
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export JSON
                </Button>
                <Button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                >
                  {viewMode === 'grid' ? 'List View' : 'Grid View'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {groupingMode === 'color' && productsWithVariants.length > 0 ? (
              /* Color Variant Products View */
              <div className="space-y-4">
                {productsWithVariants.map((product) => {
                  const selectedVariant = product.colorVariants[product.selectedColorIndex];
                  
                  return (
                    <div key={product.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <Input
                            value={product.name}
                            onChange={(e) => updateProductWithVariants(product.id, 'name', e.target.value)}
                            className="font-medium text-lg mb-2"
                          />
                          <div className="flex items-center space-x-2">
                            <Badge className={getCategoryColor(product.category)}>
                              {product.category}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {product.colorVariants.length} color{product.colorVariants.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => removeProductWithVariants(product.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Color Selector */}
                      <div className="mb-3">
                        <Label className="text-xs mb-2 block">Select Color:</Label>
                        <div className="flex flex-wrap gap-2">
                          {product.colorVariants.map((variant, variantIdx) => (
                            <button
                              key={variantIdx}
                              onClick={() => selectColorVariant(product.id, variantIdx)}
                              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                                variantIdx === product.selectedColorIndex
                                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                  : 'border-gray-300 hover:border-blue-300'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-6 h-6 rounded-full border-2 border-gray-300"
                                  style={{ backgroundColor: variant.images[0].analysis.dominantColor.hex }}
                                  title={variant.images[0].analysis.dominantColor.hex}
                                />
                                <span className="text-sm font-medium">{variant.color}</span>
                                <span className="text-xs text-gray-500">({variant.images.length})</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Selected Color Images */}
                      <div className="mb-3">
                        <Label className="text-xs mb-2 block">
                          Images for {selectedVariant.color}:
                        </Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {selectedVariant.images.map((img, imgIdx) => (
                            <div
                              key={imgIdx}
                              className={`relative group border-2 rounded overflow-hidden ${
                                imgIdx === selectedVariant.primaryImageIndex
                                  ? 'border-blue-500 ring-2 ring-blue-200'
                                  : 'border-gray-200'
                              }`}
                            >
                              <img
                                src={img.preview}
                                alt={img.file.name}
                                className="w-full h-32 object-contain bg-gray-50"
                              />
                              {imgIdx === selectedVariant.primaryImageIndex && (
                                <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                                  Primary
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                {imgIdx !== selectedVariant.primaryImageIndex && (
                                  <button
                                    onClick={() => setPrimaryImageInVariant(product.id, product.selectedColorIndex, imgIdx)}
                                    className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    title="Set as primary"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 truncate">
                                {img.file.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Category</Label>
                          <select
                            value={product.category}
                            onChange={(e) => updateProductWithVariants(product.id, 'category', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                          >
                            {CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs">Brand</Label>
                          <Input
                            value={product.brand}
                            onChange={(e) => updateProductWithVariants(product.id, 'brand', e.target.value)}
                            className="mt-1 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : groupingMode === 'angle' && productGroups.length > 0 ? (
              /* Angle Grouped Products View */
              <div className="space-y-4">
                {productGroups.map((group) => (
                  <div key={group.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <Input
                          value={group.name}
                          onChange={(e) => updateProductGroup(group.id, 'name', e.target.value)}
                          className="font-medium text-lg mb-2"
                        />
                        <Badge className={getCategoryColor(group.category)}>
                          {group.category}
                        </Badge>
                        <span className="ml-2 text-sm text-gray-600">
                          {group.images.length} image{group.images.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <Button
                        onClick={() => removeProductGroup(group.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Image Gallery */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
                      {group.images.map((img, imgIdx) => (
                        <div
                          key={imgIdx}
                          className={`relative group border-2 rounded overflow-hidden ${
                            imgIdx === group.primaryImageIndex
                              ? 'border-blue-500 ring-2 ring-blue-200'
                              : 'border-gray-200'
                          }`}
                        >
                          <img
                            src={img.preview}
                            alt={img.file.name}
                            className="w-full h-32 object-contain bg-gray-50"
                          />
                          {imgIdx === group.primaryImageIndex && (
                            <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                              Primary
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex space-x-1">
                              {imgIdx !== group.primaryImageIndex && (
                                <button
                                  onClick={() => setPrimaryImage(group.id, imgIdx)}
                                  className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                  title="Set as primary"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                onClick={() => removeImageFromGroup(group.id, imgIdx)}
                                className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                                title="Remove"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 truncate">
                            {img.file.name}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Product Details */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Category</Label>
                        <select
                          value={group.category}
                          onChange={(e) => updateProductGroup(group.id, 'category', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Color</Label>
                        <select
                          value={group.color}
                          onChange={(e) => updateProductGroup(group.id, 'color', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        >
                          {COLORS.map(color => (
                            <option key={color} value={color}>{color}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Brand</Label>
                        <Input
                          value={group.brand}
                          onChange={(e) => updateProductGroup(group.id, 'brand', e.target.value)}
                          className="mt-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : viewMode === 'grid' ? (
              /* Individual Images Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyzedImages.map((img, idx) => (
                  <div key={idx} className="border rounded-lg overflow-hidden bg-white">
                    {/* Image Preview */}
                    <div className="relative h-48 bg-gray-100">
                      <img
                        src={img.preview}
                        alt={img.file.name}
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Details */}
                    <div className="p-4 space-y-3">
                      <div className="text-xs text-gray-500 truncate">
                        {img.file.name}
                      </div>

                      {/* Color Palette */}
                      <div>
                        <Label className="text-xs">Detected Colors</Label>
                        <div className="flex space-x-1 mt-1">
                          {img.analysis.palette.slice(0, 5).map((color, colorIdx) => (
                            <div
                              key={colorIdx}
                              className="w-8 h-8 rounded border border-gray-300"
                              style={{ backgroundColor: color.hex }}
                              title={`${color.name} (${color.percentage.toFixed(1)}%)`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Category */}
                      <div>
                        <Label className="text-xs">Category</Label>
                        <select
                          value={img.category}
                          onChange={(e) => updateImage(idx, 'category', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      {/* Color */}
                      <div>
                        <Label className="text-xs">Primary Color</Label>
                        <select
                          value={img.color}
                          onChange={(e) => updateImage(idx, 'color', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        >
                          {COLORS.map(color => (
                            <option key={color} value={color}>{color}</option>
                          ))}
                        </select>
                      </div>

                      {/* Brand */}
                      <div>
                        <Label className="text-xs">Brand</Label>
                        <Input
                          value={img.brand}
                          onChange={(e) => updateImage(idx, 'brand', e.target.value)}
                          className="mt-1 text-sm"
                        />
                      </div>

                      {/* Confidence */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">AI Confidence</span>
                        <Badge variant="outline">
                          {(img.analysis.confidence * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {analyzedImages.map((img, idx) => (
                  <div key={idx} className="border rounded-lg p-4 bg-white flex items-center space-x-4">
                    {/* Thumbnail */}
                    <img
                      src={img.preview}
                      alt={img.file.name}
                      className="w-20 h-20 object-contain bg-gray-100 rounded"
                    />

                    {/* Info */}
                    <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                      <div className="truncate text-sm">
                        {img.file.name}
                      </div>
                      
                      <Badge className={getCategoryColor(img.category)}>
                        {img.category}
                      </Badge>

                      <div className="flex items-center space-x-2">
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: img.analysis.dominantColor.hex }}
                        />
                        <span className="text-sm">{img.color}</span>
                      </div>

                      <span className="text-sm text-gray-600">{img.brand}</span>

                      <div className="flex justify-end space-x-2">
                        <Button
                          onClick={() => removeImage(idx)}
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {analyzedImages.length === 0 && !analyzing && !extractingZip && (
        <Alert>
          <Palette className="h-4 w-4" />
          <AlertDescription>
            <strong>How it works:</strong> Upload individual images or a ZIP file containing images. 
            Our AI will automatically detect the dominant colors and suggest appropriate categories. 
            <div className="mt-2 space-y-1 text-xs text-gray-600">
              <div className="flex items-center">
                <FileArchive className="w-3 h-3 mr-1" />
                <span>ZIP files are automatically extracted and processed</span>
              </div>
              <div className="flex items-center">
                <Tag className="w-3 h-3 mr-1" />
                <span><strong>Color Variant Grouping (Default):</strong> Same eyewear in different colors grouped into one product card (e.g., RayBan_Aviator_Black + RayBan_Aviator_Brown = 1 product with 2 color options)</span>
              </div>
              <div className="flex items-center">
                <Tag className="w-3 h-3 mr-1" />
                <span><strong>Angle Grouping:</strong> Multiple angles of same product grouped together (e.g., Product_front, Product_side)</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ImageAnalyzer;

