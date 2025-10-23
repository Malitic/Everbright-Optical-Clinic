import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Product } from '../types/product.types';
import { getProducts } from '../../../services/productApi';
import { useQuery } from '@tanstack/react-query';
import { getActiveBranches, Branch } from '@/services/branchApi';
import { getProductAvailability } from '@/services/branchAnalyticsApi';
import ReservationModal from './ReservationModal';
import { getStorageUrl, getFallbackImageUrl } from '../../../utils/imageUtils';
import { RefreshCw } from 'lucide-react';
import { shouldSkipRefresh, clearDeletionProtection } from '../../../utils/deletionProtection';

interface ProductWithAvailability extends Product {
  // Product interface remains the same
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  product_count: number;
  is_active: boolean;
}

const ProductGallery: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  // Fetch real branches from API
  const { data: branches = [] } = useQuery({
    queryKey: ['activeBranches'],
    queryFn: getActiveBranches,
  });

  const getBranchLabel = (branch: Branch) => branch.name;

  const [products, setProducts] = useState<ProductWithAvailability[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'frames' | 'contact_lenses' | 'eye_care' | 'sunglasses'>('all');
  const [frameShape, setFrameShape] = useState<'all' | 'round' | 'square' | 'rectangle' | 'cat-eye' | 'aviator'>('all');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithAvailability | null>(null);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState<boolean>(false);
  const [selectedImageIndices, setSelectedImageIndices] = useState<{[productId: number]: number}>({});
  const [showAvailability, setShowAvailability] = useState<{[productId: number]: boolean}>({});
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [zoomState, setZoomState] = useState<{[productId: number]: {isZooming: boolean, x: number, y: number}}>({});

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = (productId: number, imageCount: number) => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = selectedImageIndices[productId] || 0;
      let newIndex = currentIndex;
      
      if (isLeftSwipe) {
        // Swipe left - next image
        newIndex = currentIndex < imageCount - 1 ? currentIndex + 1 : 0;
      } else if (isRightSwipe) {
        // Swipe right - previous image
        newIndex = currentIndex > 0 ? currentIndex - 1 : imageCount - 1;
      }
      
      setSelectedImageIndices(prev => ({ ...prev, [productId]: newIndex }));
    }
  };

  // Simplified zoom functionality handlers
  const handleMouseEnter = (productId: number) => {
    setZoomState(prev => ({ 
      ...prev, 
      [productId]: { isZooming: true, x: 50, y: 50 } 
    }));
  };

  const handleMouseLeave = (productId: number) => {
    setZoomState(prev => ({ 
      ...prev, 
      [productId]: { isZooming: false, x: 50, y: 50 } 
    }));
  };

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Load products on mount and poll for updates (reduced frequency)
  useEffect(() => {
    fetchProducts(false);
    const intervalId = setInterval(() => {
      // Only auto-refresh if no products have been deleted recently (to prevent reappearing)
      if (!shouldSkipRefresh()) {
        fetchProducts(true);
      }
    }, 30000); // Reduced from 5 seconds to 30 seconds
    
    // Listen for product deletion events to refresh immediately
    const handleProductDeletion = (event: CustomEvent) => {
      console.log('Product deleted, refreshing gallery:', event.detail.productId);
      // Immediately refresh products to reflect deletion
      fetchProducts(true);
    };
    
    window.addEventListener('productDeleted', handleProductDeletion as EventListener);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('productDeleted', handleProductDeletion as EventListener);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/product-categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };


  const fetchProducts = async (silent: boolean = false) => {
    try {
      if (!silent && !hasLoadedOnce) {
        setLoading(true);
        setError(null);
      }
      
      const startTime = Date.now();
      const data = await getProducts(searchQuery);
      const loadTime = Date.now() - startTime;
      
      console.log(`Products loaded in ${loadTime}ms`);
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setError('Failed to load products. Please try again.');
    } finally {
      if (!silent && !hasLoadedOnce) setLoading(false);
      if (!hasLoadedOnce) setHasLoadedOnce(true);
    }
  };

  // Handle search with longer debounce to reduce API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only refresh if no products have been deleted recently (to prevent reappearing)
      if (!shouldSkipRefresh()) {
        fetchProducts(true);
      }
    }, 500); // Increased from 300ms to 500ms
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);


  // Filter products by search query and category
  const filteredProducts = React.useMemo(() => {
    return products.filter(product => {
      const matchesSearch = searchQuery === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || 
        product.category_id?.toString() === selectedCategory;

      // Derive normalized category name text for heuristics
      const categoryName = (product.category_details?.name || (product as any).category || '').toString().toLowerCase();
      const productText = `${product.name} ${product.model || ''} ${product.description || ''}`.toLowerCase();

      // High-level type filter
      let matchesType = true;
      if (typeFilter === 'frames') {
        matchesType = categoryName.includes('frame') || productText.includes('frame');
      } else if (typeFilter === 'contact_lenses') {
        matchesType = categoryName.includes('contact') || productText.includes('contact lens') || productText.includes('contacts');
      } else if (typeFilter === 'eye_care') {
        matchesType = categoryName.includes('care') || categoryName.includes('solution') || productText.includes('solution') || productText.includes('drop') || productText.includes('cleaner');
      } else if (typeFilter === 'sunglasses') {
        matchesType = categoryName.includes('sunglass') || productText.includes('sunglass') || productText.includes('sun glasses');
      }

      // Frame shape refinement (only when frames selected)
      let matchesShape = true;
      if (typeFilter === 'frames' && frameShape !== 'all') {
        if (frameShape === 'cat-eye') {
          matchesShape = productText.includes('cat eye') || productText.includes('cateye');
        } else {
          matchesShape = productText.includes(frameShape);
        }
      }
      
      return matchesSearch && matchesCategory && matchesType && matchesShape;
    });
  }, [products, searchQuery, selectedCategory, typeFilter, frameShape]);

  // Use real branches from API
  const availableBranches: Branch[] = branches;

  const getBranchStockText = (product: ProductWithAvailability, branchCode: string) => {
    if (!product.branch_availability) return 'Not available';
    const branchAvailability = product.branch_availability.find(ba => ba.branch.code === branchCode);
    if (!branchAvailability) return 'Not available';
    if (!branchAvailability.is_available) return 'Out of Stock';
    return `${branchAvailability.available_quantity} pcs`;
  };

  const getBranchStockClass = (product: ProductWithAvailability, branchCode: string) => {
    if (!product.branch_availability) return 'text-gray-500';
    
    const branchAvailability = product.branch_availability.find(
      ba => ba.branch.code === branchCode
    );
    
    if (!branchAvailability || !branchAvailability.is_available) {
      return 'text-red-500 font-semibold';
    }
    
    if (branchAvailability.available_quantity < 5) {
      return 'text-yellow-600 font-semibold';
    }
    
    return 'text-green-600 font-semibold';
  };

  const handleReserveProduct = (product: ProductWithAvailability) => {
    setSelectedProduct(product);
    setIsReservationModalOpen(true);
  };

  const handleReservationSuccess = () => {
    // Only refresh if no products have been deleted recently (to prevent reappearing)
    if (!shouldSkipRefresh()) {
      fetchProducts();
    }
  };

  const handleManualRefresh = async () => {
    // Clear deletion timestamp to allow refresh
    clearDeletionProtection();
    await fetchProducts(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .cursor-zoom-in {
          cursor: pointer;
        }
        .cursor-zoom-in:hover {
          cursor: zoom-in;
        }
      `}</style>
      
      {error && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          </div>
        )}

      {/* Enhanced Search Controls */}
      <div className="max-w-7xl mx-auto mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search for glasses, lenses, or eye care products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleManualRefresh}
                  disabled={loading}
                  className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-3 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
      </div>

      {/* Quick Type Filter (Frames, Contact Lenses, Eye Care) */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setTypeFilter('all'); setFrameShape('all'); }}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${typeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('frames')}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${typeFilter === 'frames' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              Frames
            </button>
            <button
              onClick={() => { setTypeFilter('contact_lenses'); setFrameShape('all'); }}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${typeFilter === 'contact_lenses' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              Contact Lenses
            </button>
            <button
              onClick={() => { setTypeFilter('eye_care'); setFrameShape('all'); }}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${typeFilter === 'eye_care' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              Eye Care Products
            </button>
            <button
              onClick={() => { setTypeFilter('sunglasses'); setFrameShape('all'); }}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${typeFilter === 'sunglasses' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              Sunglasses
            </button>
          </div>
          {typeFilter === 'frames' && (
            <div className="flex flex-wrap gap-2 mt-3">
              {['all','round','square','rectangle','cat-eye','aviator'].map(shape => (
                <button
                  key={shape}
                  onClick={() => setFrameShape(shape as any)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${frameShape === shape ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                >
                  {shape === 'all' ? 'All Shapes' : shape.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="max-w-7xl mx-auto mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center mb-4">
              <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-800">Browse by Category</h3>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                }`}
              >
                All Products
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id.toString())}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                    selectedCategory === category.id.toString()
                      ? 'text-white shadow-lg transform scale-105'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                  }`}
                  style={{
                    backgroundColor: selectedCategory === category.id.toString() ? category.color : undefined,
                  }}
                >
                  <span className="text-lg">{category.icon}</span>
                  <span>{category.name}</span>
                  {category.product_count > 0 && (
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                      selectedCategory === category.id.toString()
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {category.product_count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-6">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Loading Products</h3>
              <p className="text-gray-500">Discovering the perfect eye care solutions for you...</p>
            </div>
          </div>
      )}

      {/* Enhanced Products Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map(product => (
            <div key={product.id} className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1">
                {/* Enhanced Product Images with Navigation */}
                {product.image_paths && product.image_paths.length > 0 ? (
                  <div className="relative">
                    {/* Main Image Display */}
                    <div 
                      className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-2xl focus-within:ring-2 focus-within:ring-blue-500 select-none cursor-zoom-in"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (product.image_paths.length > 1) {
                          const currentIndex = selectedImageIndices[product.id] || 0;
                          if (e.key === 'ArrowLeft') {
                            e.preventDefault();
                            const newIndex = currentIndex > 0 ? currentIndex - 1 : product.image_paths.length - 1;
                            setSelectedImageIndices(prev => ({ ...prev, [product.id]: newIndex }));
                          } else if (e.key === 'ArrowRight') {
                            e.preventDefault();
                            const newIndex = currentIndex < product.image_paths.length - 1 ? currentIndex + 1 : 0;
                            setSelectedImageIndices(prev => ({ ...prev, [product.id]: newIndex }));
                          }
                        }
                      }}
                      onTouchStart={onTouchStart}
                      onTouchMove={onTouchMove}
                      onTouchEnd={() => onTouchEnd(product.id, product.image_paths.length)}
                      onMouseEnter={() => handleMouseEnter(product.id)}
                      onMouseLeave={() => handleMouseLeave(product.id)}
                    >
                      {/* Main Image with Subtle Zoom */}
                      <img
                        src={getStorageUrl(product.image_paths[selectedImageIndices[product.id] || 0])}
                        alt={`${product.name} cover`}
                        className="w-full h-full object-contain transition-all duration-300"
                        style={{
                          transform: zoomState[product.id]?.isZooming 
                            ? 'scale(1.25)'
                            : 'scale(1)',
                          transformOrigin: 'center center'
                        }}
                        onError={(e) => {
                          // Show placeholder image instead of hiding
                          e.currentTarget.src = getFallbackImageUrl(product.name, '400x300');
                        }}
                      />
                      
                      {/* Subtle Overlay Effect */}
                      {zoomState[product.id]?.isZooming && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none transition-opacity duration-300" />
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Navigation Arrows - Only show if multiple images */}
                      {product.image_paths.length > 1 && (
                        <>
                          {/* Previous Image Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentIndex = selectedImageIndices[product.id] || 0;
                              const newIndex = currentIndex > 0 ? currentIndex - 1 : product.image_paths.length - 1;
                              setSelectedImageIndices(prev => ({ ...prev, [product.id]: newIndex }));
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/95 text-gray-700 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          
                          {/* Next Image Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentIndex = selectedImageIndices[product.id] || 0;
                              const newIndex = currentIndex < product.image_paths.length - 1 ? currentIndex + 1 : 0;
                              setSelectedImageIndices(prev => ({ ...prev, [product.id]: newIndex }));
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/95 text-gray-700 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          
                          {/* Image Counter */}
                          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                            {(selectedImageIndices[product.id] || 0) + 1} / {product.image_paths.length}
                          </div>
                        </>
                      )}
                      
                      {/* Subtle Zoom Indicator */}
                      {!zoomState[product.id]?.isZooming && (
                        <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm text-gray-700 text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center space-x-1 shadow-sm">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v6m3-3H9" />
                          </svg>
                          <span>Hover to zoom</span>
                        </div>
                      )}
                      
                      {zoomState[product.id]?.isZooming && (
                        <div className="absolute top-3 right-3 bg-blue-500/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md flex items-center space-x-1 shadow-lg">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          <span>1.25x Zoom</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Enhanced Thumbnail Navigation */}
                    {product.image_paths.length > 1 && (
                      <div className="px-4 py-3 bg-gray-50/50">
                        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
                          {product.image_paths.map((imagePath, index) => (
                            <button
                              key={index}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImageIndices(prev => ({ ...prev, [product.id]: index }));
                              }}
                              className={`flex-shrink-0 relative group/thumb transition-all duration-200 ${
                                (selectedImageIndices[product.id] || 0) === index 
                                  ? 'transform scale-110' 
                                  : 'hover:scale-105'
                              }`}
                            >
                              <img
                                src={getStorageUrl(imagePath)}
                                alt={`${product.name} ${index + 1}`}
                                className={`w-16 h-16 object-cover rounded-lg border-2 transition-all duration-200 ${
                                  (selectedImageIndices[product.id] || 0) === index 
                                    ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg' 
                                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                                }`}
                                onError={(e) => {
                                  // Show small placeholder thumbnail
                                  e.currentTarget.src = getFallbackImageUrl('N/A', '64x64');
                                }}
                              />
                              {/* Active indicator */}
                              {(selectedImageIndices[product.id] || 0) === index && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">No Image Available</p>
                    </div>
                  </div>
                )}

                {/* Enhanced Product Info */}
                <div className="p-6">
                  <div className="mb-4">
                    {/* Category Badge */}
                    {product.category_id && categories.find(c => c.id === product.category_id) && (
                      <div className="mb-3">
                        {(() => {
                          const category = categories.find(c => c.id === product.category_id);
                          return category ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm"
                              style={{ backgroundColor: category.color }}
                            >
                              <span>{category.icon}</span>
                              <span>{category.name}</span>
                            </span>
                          ) : null;
                        })()}
                      </div>
                    )}
                    <h3 className="font-bold text-xl text-gray-800 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-3">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          ₱{Number(product.price || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-500">Available</span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Branch Availability */}
                  <div className="mb-6">
                    <button
                      onClick={() => setShowAvailability(prev => ({ ...prev, [product.id]: !prev[product.id] }))}
                      className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-sm font-medium text-gray-700"
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{showAvailability[product.id] ? 'Hide branch availability' : 'Check branch availability'}</span>
                      </div>
                      <svg className={`w-4 h-4 transition-transform duration-200 ${showAvailability[product.id] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showAvailability[product.id] && (
                      <div className="mt-3 space-y-2 bg-white border border-gray-100 rounded-lg p-3">
                        {availableBranches.map(branch => (
                          <div key={branch.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-b-0">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              <span className="text-sm font-medium text-gray-700">{getBranchLabel(branch)}</span>
                            </div>
                            <span className={`text-sm font-semibold px-2 py-1 rounded-full ${getBranchStockClass(product, branch.code)}`}>
                              {getBranchStockText(product, branch.code)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Enhanced Action Buttons */}
                  {role === 'customer' && (
                    <div className="space-y-3">
                      {product.branch_availability && product.branch_availability.some(ba => ba.is_available) ? (
                        <button 
                          onClick={() => handleReserveProduct(product)}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          <span>Reserve Product</span>
                        </button>
                      ) : (
                        <button 
                          disabled 
                          className="w-full bg-gray-300 text-gray-500 font-semibold py-3 px-6 rounded-xl cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                          </svg>
                          <span>Out of Stock</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
          ))}
        </div>
      </div>

      {filteredProducts.length === 0 && !loading && (
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-3">No Products Found</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchQuery 
                ? `We couldn't find any products matching "${searchQuery}". Try adjusting your search terms.`
                : "No products are currently available. Please check back later."
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Clear Search
              </button>
            )}
          </div>
        </div>
      )}

      {/* Reservation Modal */}
      {selectedProduct && (
        <ReservationModal
          product={selectedProduct}
          isOpen={isReservationModalOpen}
          onClose={() => {
            setIsReservationModalOpen(false);
            setSelectedProduct(null);
          }}
          onReservationSuccess={handleReservationSuccess}
        />
      )}
    </div>
  );
};

export default ProductGallery;

