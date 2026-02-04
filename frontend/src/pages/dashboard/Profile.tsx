import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Flower2,
  Bell,
  User as UserIcon,
  LogOut,
  Save,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Heart,
  Shield,
  Sparkles,
  Globe
} from "lucide-react";
import { getCurrentUser, updateUser, logoutUser, User } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiProfile } from "@/lib/api";

const Profile = () => {
  const { userType } = useParams<{ userType: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    phone: "",
    address: "",
    emergencyContact: "",
    medicalHistory: "",
    language: "en" as "ar" | "en",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        navigate("/login");
        return;
      }
      
      try {
        // Fetch full profile from API
        const profileData = await apiProfile.get(currentUser.id);
        
        // Merge base user with profile details
        const mergedUser = {
          ...currentUser,
          profile: profileData || {}
        };
        setUser(mergedUser);
        
        setFormData({
          name: currentUser.name || "",
          email: currentUser.email || "",
          age: profileData?.age?.toString() || currentUser.profile?.age?.toString() || "",
          phone: profileData?.phone || currentUser.profile?.phone || "",
          address: profileData?.address || currentUser.profile?.address || "",
          emergencyContact: profileData?.emergencyContact || currentUser.profile?.emergencyContact || "",
          medicalHistory: profileData?.medicalHistory || currentUser.profile?.medicalHistory || "",
          language: currentUser.language || "en",
        });
      } catch (err) {
        console.error("Failed to load profile", err);
        // Fallback to local
        setUser(currentUser);
        setFormData({
            name: currentUser.name || "",
            email: currentUser.email || "",
            age: currentUser.profile?.age?.toString() || "",
            phone: currentUser.profile?.phone || "",
            address: currentUser.profile?.address || "",
            emergencyContact: currentUser.profile?.emergencyContact || "",
            medicalHistory: currentUser.profile?.medicalHistory || "",
            language: currentUser.language || "en",
        });
      }
    };
    
    fetchProfile();
  }, [navigate]);

  const handleSave = async () => {
    if (!user) return;

    try {
      // 1. Update Profile API
      await apiProfile.upsert({
        userId: user.id,
        firstName: formData.name.split(' ')[0], // Simple split
        lastName: formData.name.split(' ').slice(1).join(' '),
        dateOfBirth: "", // Not in form yet
        gender: "Female", // Default for target audience
        country: "",
        // Add other fields to payload if API supports them
        // Note: The backend profile endpoint might need expansion to support all fields
      });
      
      // 2. Update Local/Auth User (legacy)
      const updatedUser = updateUser(user.id, {
        name: formData.name,
        email: formData.email,
        language: formData.language,
        profile: {
          age: formData.age ? parseInt(formData.age) : undefined,
          phone: formData.phone,
          address: formData.address,
          emergencyContact: formData.emergencyContact,
          medicalHistory: formData.medicalHistory,
        },
      });

      if (updatedUser) {
        setUser(updatedUser);
        setIsEditing(false);
        toast({
          title: "Profile Updated! 🌸",
          description: "Your profile has been successfully updated.",
        });
      }
    } catch (error: Error | unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to update profile. Please try again.";
      toast({
        title: "Update Failed",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    logoutUser();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const getUserTypeIcon = () => {
    switch (user?.userType) {
      case "fighter":
        return Heart;
      case "survivor":
        return Sparkles;
      case "wellness":
        return Shield;
      default:
        return UserIcon;
    }
  };

  const getUserTypeLabel = () => {
    switch (user?.userType) {
      case "fighter":
        return "Breast Cancer Fighter";
      case "survivor":
        return "Survivor";
      case "wellness":
        return "Health-Conscious Woman";
      default:
        return "User";
    }
  };

  if (!user) {
    return null;
  }

  const UserTypeIcon = getUserTypeIcon();

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
            <span className="text-xl font-bold text-foreground">My Profile</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="medical">Medical Info</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-4">
            <Card className="p-6 bg-white shadow-soft">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <UserTypeIcon className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
                    <p className="text-muted-foreground">{getUserTypeLabel()}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Member since {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant={isEditing ? "outline" : "default"}
                  onClick={() => {
                    if (isEditing) {
                      handleSave();
                    } else {
                      setIsEditing(true);
                    }
                  }}
                >
                  {isEditing ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10 min-h-[80px]"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Name and phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="language">Preferred Language</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value: "ar" | "en") => setFormData({ ...formData, language: value })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية (Arabic)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Medical Information Tab */}
          <TabsContent value="medical" className="space-y-4">
            <Card className="p-6 bg-white shadow-soft">
              <div className="space-y-4 mb-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Heart className="w-6 h-6 text-primary" />
                  Medical History
                </h2>
                <p className="text-muted-foreground">
                  Keep your medical information up to date for better personalized care.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="medicalHistory">Medical History & Notes</Label>
                  <Textarea
                    id="medicalHistory"
                    value={formData.medicalHistory}
                    onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                    disabled={!isEditing}
                    className="min-h-[200px]"
                    placeholder="Enter any relevant medical history, allergies, current medications, or other important health information..."
                  />
                </div>
                <Button
                  variant={isEditing ? "outline" : "default"}
                  onClick={() => {
                    if (isEditing) {
                      handleSave();
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  className="w-full"
                >
                  {isEditing ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Medical Information
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Medical Information
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Account Settings Tab */}
          <TabsContent value="account" className="space-y-4">
            <Card className="p-6 bg-white shadow-soft">
              <div className="space-y-4 mb-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <UserIcon className="w-6 h-6 text-primary" />
                  Account Settings
                </h2>
                <p className="text-muted-foreground">
                  Manage your account information and preferences.
                </p>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">Account Type</p>
                      <p className="text-sm text-muted-foreground">{getUserTypeLabel()}</p>
                    </div>
                    <UserTypeIcon className="w-8 h-8 text-primary" />
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">Member Since</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-primary" />
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">Email Address</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                    className="w-full"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;

