import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  Phone, 
  Mail, 
  MessageCircle, 
  MapPin, 
  Clock, 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin,
  Save,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  getAllBranchContacts, 
  saveBranchContact, 
  updateBranchContact, 
  deleteBranchContact,
  BranchContact,
  BranchContactFormData
} from '@/services/branchContactApi';

interface Branch {
  id: number;
  name: string;
}

const BranchContactManagement: React.FC = () => {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<BranchContact[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingContact, setEditingContact] = useState<BranchContact | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState<BranchContactFormData>({
    branch_id: 0,
    phone_number: '',
    email: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    linkedin_url: '',
    whatsapp_number: '',
    address: '',
    operating_hours: '',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load contacts
      const contactsResponse = await getAllBranchContacts();
      setContacts(contactsResponse.contacts);

      // Load branches (using MySQL API)
      const branchesResponse = await fetch('http://127.0.0.1:8000/api-mysql.php/branches', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (branchesResponse.ok) {
        const branchesData = await branchesResponse.json();
        setBranches(branchesData.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load contact information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof BranchContactFormData, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEdit = (contact: BranchContact) => {
    setEditingContact(contact);
    setIsCreating(false);
    setFormData({
      branch_id: contact.branch_id,
      phone_number: contact.phone_number || '',
      email: contact.email || '',
      facebook_url: contact.social_media.facebook || '',
      instagram_url: contact.social_media.instagram || '',
      twitter_url: contact.social_media.twitter || '',
      linkedin_url: contact.social_media.linkedin || '',
      whatsapp_number: contact.whatsapp_number || '',
      address: contact.address || '',
      operating_hours: contact.operating_hours || '',
      is_active: contact.is_active
    });
  };

  const handleCreate = () => {
    setEditingContact(null);
    setIsCreating(true);
    setFormData({
      branch_id: 0,
      phone_number: '',
      email: '',
      facebook_url: '',
      instagram_url: '',
      twitter_url: '',
      linkedin_url: '',
      whatsapp_number: '',
      address: '',
      operating_hours: '',
      is_active: true
    });
  };

  const handleCancel = () => {
    setEditingContact(null);
    setIsCreating(false);
    setFormData({
      branch_id: 0,
      phone_number: '',
      email: '',
      facebook_url: '',
      instagram_url: '',
      twitter_url: '',
      linkedin_url: '',
      whatsapp_number: '',
      address: '',
      operating_hours: '',
      is_active: true
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (editingContact) {
        // Update existing contact
        await updateBranchContact(editingContact.id, formData);
        toast({
          title: "Success",
          description: "Contact information updated successfully",
        });
      } else {
        // Create new contact
        await saveBranchContact(formData);
        toast({
          title: "Success",
          description: "Contact information created successfully",
        });
      }

      await loadData();
      handleCancel();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast({
        title: "Error",
        description: "Failed to save contact information",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contactId: number) => {
    if (!confirm('Are you sure you want to delete this contact information?')) {
      return;
    }

    try {
      await deleteBranchContact(contactId);
      toast({
        title: "Success",
        description: "Contact information deleted successfully",
      });
      await loadData();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: "Error",
        description: "Failed to delete contact information",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Branch Contact Management</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Branch Contact Management</h1>
          <p className="text-gray-600">Manage contact information for each branch</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Branch Contacts</h2>
          {contacts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No contact information found</p>
                  <p className="text-sm text-gray-500">Add contact information for your branches</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            contacts.map((contact) => (
              <Card key={contact.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        {contact.branch_name}
                      </CardTitle>
                      <CardDescription>
                        {contact.is_active ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(contact)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(contact.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {contact.phone_number && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <span>{contact.formatted_phone}</span>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-green-600" />
                      <span>{contact.email}</span>
                    </div>
                  )}
                  {contact.whatsapp_number && (
                    <div className="flex items-center gap-2 text-sm">
                      <MessageCircle className="h-4 w-4 text-green-600" />
                      <span>{contact.formatted_whatsapp}</span>
                    </div>
                  )}
                  {contact.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-600" />
                      <span className="truncate">{contact.address}</span>
                    </div>
                  )}
                  {contact.operating_hours && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span>{contact.operating_hours}</span>
                    </div>
                  )}
                  {Object.keys(contact.social_media).length > 0 && (
                    <div className="flex gap-2">
                      {contact.social_media.facebook && (
                        <Facebook className="h-4 w-4 text-blue-600" />
                      )}
                      {contact.social_media.instagram && (
                        <Instagram className="h-4 w-4 text-pink-600" />
                      )}
                      {contact.social_media.twitter && (
                        <Twitter className="h-4 w-4 text-blue-400" />
                      )}
                      {contact.social_media.linkedin && (
                        <Linkedin className="h-4 w-4 text-blue-700" />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Contact Form */}
        {(editingContact || isCreating) && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingContact ? 'Edit Contact Information' : 'Add Contact Information'}
              </CardTitle>
              <CardDescription>
                {editingContact ? 'Update contact details for this branch' : 'Add contact details for a branch'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="branch_id">Branch</Label>
                <Select
                  value={formData.branch_id.toString()}
                  onValueChange={(value) => handleInputChange('branch_id', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    placeholder="+63 123 456 7890"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                  <Input
                    id="whatsapp_number"
                    value={formData.whatsapp_number}
                    onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                    placeholder="+63 123 456 7890"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="clinic@example.com"
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter branch address"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="operating_hours">Operating Hours</Label>
                <Input
                  id="operating_hours"
                  value={formData.operating_hours}
                  onChange={(e) => handleInputChange('operating_hours', e.target.value)}
                  placeholder="Mon-Fri: 8AM-6PM, Sat: 9AM-4PM"
                />
              </div>

              <div className="space-y-3">
                <Label>Social Media Links</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="facebook_url">Facebook</Label>
                    <Input
                      id="facebook_url"
                      value={formData.facebook_url}
                      onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram_url">Instagram</Label>
                    <Input
                      id="instagram_url"
                      value={formData.instagram_url}
                      onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                      placeholder="https://instagram.com/yourpage"
                    />
                  </div>
                  <div>
                    <Label htmlFor="twitter_url">Twitter</Label>
                    <Input
                      id="twitter_url"
                      value={formData.twitter_url}
                      onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                      placeholder="https://twitter.com/yourpage"
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedin_url">LinkedIn</Label>
                    <Input
                      id="linkedin_url"
                      value={formData.linkedin_url}
                      onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                      placeholder="https://linkedin.com/company/yourcompany"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving || formData.branch_id === 0}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BranchContactManagement;
