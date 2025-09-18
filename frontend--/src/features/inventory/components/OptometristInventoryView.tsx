import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Package, Eye, Banknote, AlertCircle, CheckCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface InventoryItem {
  id: string;
  name: string;
  category: 'frames' | 'lenses' | 'contact-lenses' | 'solutions' | 'accessories';
  brand: string;
  price: number;
  stock: number;
  minStock: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  description: string;
}

const mockInventory: InventoryItem[] = [
  {
    id: '1',
    name: 'Ray-Ban Classic Frames',
    category: 'frames',
    brand: 'Ray-Ban',
    price: 199.99,
    stock: 15,
    minStock: 5,
    status: 'in-stock',
    description: 'Classic aviator style frames'
  },
  {
    id: '2',
    name: 'Progressive Lenses',
    category: 'lenses',
    brand: 'Essilor',
    price: 299.99,
    stock: 25,
    minStock: 10,
    status: 'in-stock',
    description: 'High-quality progressive lenses'
  },
  {
    id: '3',
    name: 'Acuvue Oasys Contacts',
    category: 'contact-lenses',
    brand: 'Johnson & Johnson',
    price: 89.99,
    stock: 3,
    minStock: 10,
    status: 'low-stock',
    description: 'Daily disposable contact lenses'
  },
  {
    id: '4',
    name: 'Contact Lens Solution',
    category: 'solutions',
    brand: 'Bausch & Lomb',
    price: 12.99,
    stock: 0,
    minStock: 5,
    status: 'out-of-stock',
    description: 'Multi-purpose contact lens solution'
  },
  {
    id: '5',
    name: 'Cleaning Cloth',
    category: 'accessories',
    brand: 'Generic',
    price: 4.99,
    stock: 50,
    minStock: 20,
    status: 'in-stock',
    description: 'Microfiber cleaning cloth'
  }
];

const OptometristInventoryView: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'bg-green-100 text-green-800';
      case 'low-stock': return 'bg-yellow-100 text-yellow-800';
      case 'out-of-stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in-stock': return <CheckCircle className="h-4 w-4" />;
      case 'low-stock': return <AlertCircle className="h-4 w-4" />;
      case 'out-of-stock': return <AlertCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'frames': return <Eye className="h-4 w-4" />;
      case 'lenses': return <Eye className="h-4 w-4" />;
      case 'contact-lenses': return <Eye className="h-4 w-4" />;
      case 'solutions': return <Package className="h-4 w-4" />;
      case 'accessories': return <Package className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const totalValue = inventory.reduce((sum, item) => sum + (item.price * item.stock), 0);
  const lowStockItems = inventory.filter(item => item.status === 'low-stock').length;
  const outOfStockItems = inventory.filter(item => item.status === 'out-of-stock').length;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory View</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
                    <div className="text-2xl font-bold">₱{totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockItems}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>View available products and their stock levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="frames">Frames</SelectItem>
                <SelectItem value="lenses">Lenses</SelectItem>
                <SelectItem value="contact-lenses">Contact Lenses</SelectItem>
                <SelectItem value="solutions">Solutions</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center">
                      {getCategoryIcon(item.category)}
                      <span className="ml-2 font-medium">{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {item.category.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.brand}</TableCell>
                  <TableCell>₱{item.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={item.stock <= item.minStock ? 'text-red-600 font-medium' : ''}>
                      {item.stock}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(item.status)}>
                      <div className="flex items-center">
                        {getStatusIcon(item.status)}
                        <span className="ml-1 capitalize">{item.status.replace('-', ' ')}</span>
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default OptometristInventoryView;
