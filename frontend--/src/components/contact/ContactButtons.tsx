import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  Building2,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BranchContact, getMyBranchContact } from '@/services/branchContactApi';

interface ContactButtonsProps {
  className?: string;
  showTitle?: boolean;
}

const ContactButtons: React.FC<ContactButtonsProps> = ({ 
  className = '', 
  showTitle = true 
}) => {
  const { toast } = useToast();
  const [contact, setContact] = useState<BranchContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContact = async () => {
      try {
        setLoading(true);
        
        // Try to get contact from API first
        try {
          const response = await getMyBranchContact();
          setContact(response.contact);
          return;
        } catch (apiError) {
          console.log('API not available, using fallback contact info');
        }
        
        // Fallback: Use default contact information
        const fallbackContact: BranchContact = {
          id: 1,
          branch_id: 1,
          branch_name: 'Everbright Optical',
          phone_number: '+63 123 456 7890',
          formatted_phone: '+63 123 456 7890',
          email: 'info@everbrightoptical.com',
          whatsapp_number: '+63 123 456 7890',
          formatted_whatsapp: '+63 123 456 7890',
          whatsapp_link: 'https://wa.me/631234567890',
          address: '123 Main Street, Makati City',
          operating_hours: 'Mon-Fri: 8AM-6PM, Sat: 9AM-4PM',
          social_media: {
            facebook: 'https://facebook.com/everbrightoptical',
            instagram: 'https://instagram.com/everbrightoptical'
          },
          is_active: true
        };
        
        setContact(fallbackContact);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contact information');
        console.error('Error fetching contact:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContact();
  }, []);

  const handlePhoneClick = () => {
    if (contact?.phone_number) {
      window.open(`tel:${contact.phone_number}`, '_self');
    }
  };

  const handleEmailClick = () => {
    if (contact?.email) {
      window.open(`mailto:${contact.email}`, '_self');
    }
  };

  const handleWhatsAppClick = () => {
    if (contact?.whatsapp_link) {
      window.open(contact.whatsapp_link, '_blank');
    }
  };

  const handleSocialMediaClick = (url: string) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          {showTitle && (
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Contact Our Clinic
            </CardTitle>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !contact) {
    return (
      <Card className={className}>
        <CardHeader>
          {showTitle && (
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Contact Our Clinic
            </CardTitle>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">
              {error || 'Contact information not available'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        {showTitle && (
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Contact Our Clinic
          </CardTitle>
        )}
        <CardDescription>{contact.branch_name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Phone Button */}
        {contact.phone_number && (
          <Button
            onClick={handlePhoneClick}
            className="w-full justify-start bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <Phone className="mr-3 h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Call Us</div>
              <div className="text-sm opacity-90">{contact.formatted_phone}</div>
            </div>
          </Button>
        )}

        {/* Email Button */}
        {contact.email && (
          <Button
            onClick={handleEmailClick}
            className="w-full justify-start bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <Mail className="mr-3 h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Email Us</div>
              <div className="text-sm opacity-90">{contact.email}</div>
            </div>
          </Button>
        )}

        {/* WhatsApp Button */}
        {contact.whatsapp_number && (
          <Button
            onClick={handleWhatsAppClick}
            className="w-full justify-start bg-green-500 hover:bg-green-600"
            size="lg"
          >
            <MessageCircle className="mr-3 h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">WhatsApp</div>
              <div className="text-sm opacity-90">{contact.formatted_whatsapp}</div>
            </div>
          </Button>
        )}

        {/* Social Media Buttons */}
        {Object.keys(contact.social_media).length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Follow Us</p>
            <div className="grid grid-cols-2 gap-2">
              {contact.social_media.facebook && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSocialMediaClick(contact.social_media.facebook!)}
                  className="flex items-center gap-2"
                >
                  <Facebook className="h-4 w-4 text-blue-600" />
                  <span className="text-xs">Facebook</span>
                </Button>
              )}
              {contact.social_media.instagram && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSocialMediaClick(contact.social_media.instagram!)}
                  className="flex items-center gap-2"
                >
                  <Instagram className="h-4 w-4 text-pink-600" />
                  <span className="text-xs">Instagram</span>
                </Button>
              )}
              {contact.social_media.twitter && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSocialMediaClick(contact.social_media.twitter!)}
                  className="flex items-center gap-2"
                >
                  <Twitter className="h-4 w-4 text-blue-400" />
                  <span className="text-xs">Twitter</span>
                </Button>
              )}
              {contact.social_media.linkedin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSocialMediaClick(contact.social_media.linkedin!)}
                  className="flex items-center gap-2"
                >
                  <Linkedin className="h-4 w-4 text-blue-700" />
                  <span className="text-xs">LinkedIn</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Additional Info */}
        {(contact.address || contact.operating_hours) && (
          <div className="pt-3 border-t space-y-2">
            {contact.address && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>{contact.address}</span>
              </div>
            )}
            {contact.operating_hours && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4 mt-0.5" />
                <span>{contact.operating_hours}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContactButtons;
