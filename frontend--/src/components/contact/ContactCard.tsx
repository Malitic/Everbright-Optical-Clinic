import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  MapPin, 
  Clock, 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface BranchContact {
  id: number;
  branch_id: number;
  branch_name: string;
  phone_number?: string;
  formatted_phone?: string;
  email?: string;
  whatsapp_number?: string;
  formatted_whatsapp?: string;
  whatsapp_link?: string;
  address?: string;
  operating_hours?: string;
  social_media: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  is_active: boolean;
}

interface ContactCardProps {
  contact: BranchContact;
  showBranchName?: boolean;
}

const ContactCard: React.FC<ContactCardProps> = ({ contact, showBranchName = true }) => {
  const { toast } = useToast();
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(type);
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
        duration: 2000,
      });
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handlePhoneClick = () => {
    if (contact.phone_number) {
      window.open(`tel:${contact.phone_number}`, '_self');
    }
  };

  const handleEmailClick = () => {
    if (contact.email) {
      window.open(`mailto:${contact.email}`, '_self');
    }
  };

  const handleWhatsAppClick = () => {
    if (contact.whatsapp_link) {
      window.open(contact.whatsapp_link, '_blank');
    }
  };

  const handleSocialMediaClick = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-blue-600" />
          Contact Information
        </CardTitle>
        {showBranchName && (
          <CardDescription>{contact.branch_name}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Phone Number */}
        {contact.phone_number && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Phone</p>
                <p className="text-sm text-blue-700">{contact.formatted_phone}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(contact.phone_number!, 'Phone number')}
                className="h-8 w-8 p-0"
              >
                {copiedItem === 'Phone number' ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
              <Button
                size="sm"
                onClick={handlePhoneClick}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Call
              </Button>
            </div>
          </div>
        )}

        {/* Email */}
        {contact.email && (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Email</p>
                <p className="text-sm text-green-700">{contact.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(contact.email!, 'Email')}
                className="h-8 w-8 p-0"
              >
                {copiedItem === 'Email' ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
              <Button
                size="sm"
                onClick={handleEmailClick}
                className="bg-green-600 hover:bg-green-700"
              >
                Email
              </Button>
            </div>
          </div>
        )}

        {/* WhatsApp */}
        {contact.whatsapp_number && (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">WhatsApp</p>
                <p className="text-sm text-green-700">{contact.formatted_whatsapp}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(contact.whatsapp_number!, 'WhatsApp number')}
                className="h-8 w-8 p-0"
              >
                {copiedItem === 'WhatsApp number' ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
              <Button
                size="sm"
                onClick={handleWhatsAppClick}
                className="bg-green-600 hover:bg-green-700"
              >
                Chat
              </Button>
            </div>
          </div>
        )}

        {/* Address */}
        {contact.address && (
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <MapPin className="h-4 w-4 text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Address</p>
              <p className="text-sm text-gray-700">{contact.address}</p>
            </div>
          </div>
        )}

        {/* Operating Hours */}
        {contact.operating_hours && (
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Clock className="h-4 w-4 text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Operating Hours</p>
              <p className="text-sm text-gray-700">{contact.operating_hours}</p>
            </div>
          </div>
        )}

        {/* Social Media */}
        {Object.keys(contact.social_media).length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900">Follow Us</p>
            <div className="flex gap-2">
              {contact.social_media.facebook && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSocialMediaClick(contact.social_media.facebook!)}
                  className="flex items-center gap-2"
                >
                  <Facebook className="h-4 w-4 text-blue-600" />
                  <span className="hidden sm:inline">Facebook</span>
                </Button>
              )}
              {contact.social_media.instagram && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSocialMediaClick(contact.social_media.instagram!)}
                  className="flex items-center gap-2"
                >
                  <Instagram className="h-4 w-4 text-pink-600" />
                  <span className="hidden sm:inline">Instagram</span>
                </Button>
              )}
              {contact.social_media.twitter && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSocialMediaClick(contact.social_media.twitter!)}
                  className="flex items-center gap-2"
                >
                  <Twitter className="h-4 w-4 text-blue-400" />
                  <span className="hidden sm:inline">Twitter</span>
                </Button>
              )}
              {contact.social_media.linkedin && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSocialMediaClick(contact.social_media.linkedin!)}
                  className="flex items-center gap-2"
                >
                  <Linkedin className="h-4 w-4 text-blue-700" />
                  <span className="hidden sm:inline">LinkedIn</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContactCard;
