import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
// Import Isabela's photo
import isabelaPhoto from "../assets/Isabela.jpg";

export default function Welcome() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('child');
  const [profilePhotoUrl] = useState<string>(isabelaPhoto);
  
  // Login form states
  const [childUsername, setChildUsername] = useState("isabela");
  const [childPassword, setChildPassword] = useState("123456");
  const [parentUsername, setParentUsername] = useState("AntuAbad");
  const [parentPassword, setParentPassword] = useState("antuantuantu");
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  const handleChildLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childUsername.trim() || !childPassword.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your username and password",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: childUsername,
          password: childPassword,
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error("Login failed");
      }
      
      const user = await response.json();
      
      if (user.role !== "child") {
        setIsLoading(false);
        toast({
          title: "Wrong Account Type",
          description: "This is a parent account. Please use parent login.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.name || "Isabela"}!`,
      });
      
      // Use navigate instead of window.location to avoid freezing
      navigate('/dashboard');
      
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "Incorrect username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleParentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentUsername.trim() || !parentPassword.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your username and password",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: parentUsername,
          password: parentPassword,
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error("Login failed");
      }
      
      const user = await response.json();
      
      if (user.role !== "parent") {
        setIsLoading(false);
        toast({
          title: "Wrong Account Type",
          description: "This is a child account. Please use child login.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.name || "Parent"}!`,
      });
      
      // Use navigate instead of window.location to avoid freezing
      navigate('/parent');
      
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "Incorrect username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-yellow-200 via-green-200 to-teal-200">
      <div className="text-center mb-4">
        <h1 className="text-5xl font-bold text-pink-500 mb-2">
          Isabela's Chore Chart!
        </h1>
        <p className="text-xl text-gray-700">Let's earn some rewards today!</p>
      </div>
      
      <div className="photo-container relative w-32 h-32 mb-6">
        <img 
          src={profilePhotoUrl} 
          alt="Isabela's profile photo"
          className="w-full h-full object-cover rounded-full border-4 border-pink-400 shadow-lg"
        />
      </div>
      
      <div className="w-full max-w-md">
        <Card className="border-none shadow-lg rounded-lg overflow-hidden">
          <CardContent className="p-6">
            <h2 className="text-2xl text-center font-medium mb-4">Choose your login</h2>

            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 rounded-full p-1">
                <TabsTrigger 
                  value="child" 
                  className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow"
                >
                  <span className="flex items-center">
                    <i className="ri-user-smile-line mr-2"></i>
                    Kid Login
                  </span>
                </TabsTrigger>
                <TabsTrigger 
                  value="parent"
                  className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow"
                >
                  <span className="flex items-center">
                    <i className="ri-user-settings-line mr-2"></i>
                    Parent Login
                  </span>
                </TabsTrigger>
              </TabsList>

              {/* Child Login Tab */}
              <TabsContent value="child" className="mt-2">
                <form onSubmit={handleChildLogin}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="child-username">Username</Label>
                      <Input
                        id="child-username"
                        placeholder="Enter your username"
                        value={childUsername}
                        onChange={(e) => setChildUsername(e.target.value)}
                        className="border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="child-password">Password</Label>
                      <Input
                        id="child-password"
                        type="password"
                        placeholder="Enter your password"
                        value={childPassword}
                        onChange={(e) => setChildPassword(e.target.value)}
                        className="border border-gray-300 rounded-md"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-pink-400 hover:bg-pink-500 text-white rounded-md py-2" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Logging in..." : "Log In"}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Parent Login Tab */}
              <TabsContent value="parent" className="mt-2">
                <form onSubmit={handleParentLogin}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="parent-username">Username</Label>
                      <Input
                        id="parent-username"
                        placeholder="Enter your username"
                        value={parentUsername}
                        onChange={(e) => setParentUsername(e.target.value)}
                        className="border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parent-password">Password</Label>
                      <Input
                        id="parent-password"
                        type="password"
                        placeholder="Enter your password"
                        value={parentPassword}
                        onChange={(e) => setParentPassword(e.target.value)}
                        className="border border-gray-300 rounded-md"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-pink-400 hover:bg-pink-500 text-white rounded-md py-2" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Logging in..." : "Log In"}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 text-center">
              <p className="text-gray-500 text-sm">
                A special chore tracker app made for Isabela!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}