import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MapPin, 
  Phone, 
  Clock, 
  ArrowLeft,
  Flower2,
  Bell,
  User as UserIcon,
  LogOut,
  Search,
  Navigation,
  ExternalLink
} from "lucide-react";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

const MedicalCenters = () => {
  const { userType } = useParams<{ userType: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGov, setSelectedGov] = useState("all");
  const [selectedService, setSelectedService] = useState("all");

  const centers = [
    {
      id: 1,
      name: "Cairo Breast Cancer Center",
      type: "Treatment",
      governorate: "cairo",
      address: "123 Medical District, Cairo",
      phone: "+20 2 1234 5678",
      hours: "9:00 AM - 5:00 PM",
      services: ["Examination", "Treatment", "Psychological Support"],
      distance: "2.5 km",
    },
    {
      id: 2,
      name: "Alexandria Women's Health Clinic",
      type: "Examination",
      governorate: "alexandria",
      address: "456 Health Street, Alexandria",
      phone: "+20 3 2345 6789",
      hours: "8:00 AM - 4:00 PM",
      services: ["Examination", "Psychological Support"],
      distance: "5.1 km",
    },
    {
      id: 3,
      name: "Giza Comprehensive Cancer Center",
      type: "Treatment",
      governorate: "giza",
      address: "789 Oncology Avenue, Giza",
      phone: "+20 2 3456 7890",
      hours: "24/7",
      services: ["Examination", "Treatment"],
      distance: "8.3 km",
    },
    {
      id: 4,
      name: "Luxor Health & Wellness Center",
      type: "Examination",
      governorate: "luxor",
      address: "321 Wellness Road, Luxor",
      phone: "+20 95 4567 8901",
      hours: "10:00 AM - 6:00 PM",
      services: ["Examination", "Psychological Support"],
      distance: "12.7 km",
    },
  ];

  const governorates = ["all", "cairo", "alexandria", "giza", "luxor", "aswan", "mansoura"];

  const filteredCenters = useMemo(() => {
    return centers.filter((center) => {
      const matchSearch = center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        center.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGov = selectedGov === "all" || center.governorate === selectedGov;
      const matchService = selectedService === "all" || 
        center.services.some(s => s.toLowerCase() === selectedService.toLowerCase());
      
      return matchSearch && matchGov && matchService;
    });
  }, [searchQuery, selectedGov, selectedService]);

  return (
    <div className="min-h-screen gradient-blush">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-soft sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/dashboard/${userType}`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <Flower2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">{t('navigation.medical_centers')}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <UserIcon className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/")}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-6 bg-white shadow-soft">
          <div className="space-y-4 mb-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              {t('navigation.medical_centers')} 
            </h2>
            <p className="text-muted-foreground">
              {t('dashboard.medical_centers_desc')}
            </p>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search centers..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedGov} onValueChange={setSelectedGov}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Governorate" />
              </SelectTrigger>
              <SelectContent>
                {governorates.map((gov) => (
                  <SelectItem key={gov} value={gov.toLowerCase()}>
                    {gov}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="examination">Examination</SelectItem>
                <SelectItem value="treatment">Treatment</SelectItem>
                <SelectItem value="support">Psychological Support</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Centers List */}
          <div className="space-y-4">
            {filteredCenters.map((center) => (
              <Card key={center.id} className="p-6 bg-white shadow-soft hover:shadow-glow transition-smooth">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-1">{center.name}</h3>
                        <span className="text-xs text-primary font-medium bg-rose-100 px-2 py-1 rounded">
                          {center.type}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">{center.distance}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{center.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Phone className="w-4 h-4 text-primary" />
                        <span>{center.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{center.hours}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">Services:</span>
                        <div className="flex flex-wrap gap-2">
                          {center.services.map((service, idx) => (
                            <span key={idx} className="px-2 py-1 bg-muted rounded text-xs">
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 md:w-48">
                    <Button variant="outline" className="w-full">
                      <Navigation className="w-4 h-4 mr-2" />
                      Get Directions
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Phone className="w-4 h-4 mr-2" />
                      Call Now
                    </Button>
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Map Integration Note */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              🗺️ <strong>Map Integration:</strong> Click "Get Directions" to open Google Maps with 
              the exact location and navigation instructions.
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default MedicalCenters;

