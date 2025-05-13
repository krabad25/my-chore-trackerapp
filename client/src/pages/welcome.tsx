import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
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
  
  // Use our enhanced auth hook
  const { login, isLoading, isAuthenticated, isParent } = useAuth();
  
  // Check if user is already authenticated and redirect accordingly
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User already authenticated, redirecting');
      if (isParent) {
        navigate('/parent');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, isParent, navigate]);

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
      // Old auth method using direct fetch
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: childUsername,
          password: childPassword,
        }),
        credentials: 'include' // Important to include credentials
      });
      
      if (!response.ok) {
        throw new Error("Login failed");
      }
      
      const user = await response.json();
      
      if (user.role !== "child") {
        toast({
          title: "Wrong Account Type",
          description: "This is a parent account. Please use parent login.",
          variant: "destructive",
        });
        return;
      }
      
      // Success!
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.name || "Isabela"}!`,
      });
      
      console.log('Child login successful, navigating to dashboard');
      // Use simple window.location approach for reliable navigation
      window.location.href = user.redirectUrl || '/dashboard';
      
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "Incorrect username or password",
        variant: "destructive",
      });
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
      const user = await login(parentUsername, parentPassword);
      
      if (user && user.role !== "parent") {
        toast({
          title: "Wrong Account Type",
          description: "This is a child account. Please use child login.",
          variant: "destructive",
        });
        return;
      }
      
      if (user) {
        // If login is successful and the user is a parent, navigate to parent page
        // The useAuth hook will handle toast notifications
        console.log('Parent login successful, navigating to parent page');
        navigate('/parent');
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-accent to-secondary">
      <motion.div 
        className="text-center mb-4"
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <h1 className="text-4xl md:text-5xl font-bold font-nunito text-primary mb-2">
          Isabela's Chore Chart!
        </h1>
        <p className="text-xl font-comic text-dark">Let's earn some rewards today!</p>
      </motion.div>
      
      <div className="photo-container relative w-32 h-32 mb-6">
        <img 
          src={profilePhotoUrl} 
          alt="Isabela's profile photo"
          className="w-full h-full object-cover rounded-full border-4 border-primary shadow-lg"
        />
      </div>
      
      <motion.div 
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl text-center">Choose your login</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="child">
                  <span className="flex items-center">
                    <i className="ri-user-smile-line mr-2"></i>
                    Kid Login
                  </span>
                </TabsTrigger>
                <TabsTrigger value="parent">
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
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-primary" 
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
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-secondary" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Logging in..." : "Log In"}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 text-center">
              <p className="text-muted-foreground text-sm">
                A special chore tracker app made for Isabela!
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}