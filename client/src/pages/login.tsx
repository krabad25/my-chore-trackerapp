import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { login, isLoading } = useAuth();

  // Check URL for tab parameter
  const query = new URLSearchParams(location.split('?')[1] || '');
  const tabParam = query.get('tab');

  const [parentUsername, setParentUsername] = useState("");
  const [parentPassword, setParentPassword] = useState("");
  const [childUsername, setChildUsername] = useState("");
  const [childPassword, setChildPassword] = useState("");
  const [activeTab, setActiveTab] = useState(tabParam === 'parent' ? 'parent' : 'child');

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

    const user = await login(childUsername, childPassword);
    if (user) {
      if (user.role !== 'child') {
        toast({
          title: "Wrong Account Type",
          description: "This is a parent account. Please use parent login.",
          variant: "destructive",
        });
        return;
      }
      navigate("/chores");
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

    const user = await login(parentUsername, parentPassword);
    if (user) {
      if (user.role !== 'parent') {
        toast({
          title: "Wrong Account Type",
          description: "This is a child account. Please use child login.",
          variant: "destructive",
        });
        return;
      }
      navigate("/parent");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="header">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold font-nunito text-center py-4">
            Chore Chart
          </h1>
        </div>
      </header>

      <div className="flex-grow p-4 flex items-center justify-center">
        <div className="container mx-auto max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center">Welcome!</CardTitle>
                <CardDescription className="text-center">
                  Choose login type to continue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs 
                  defaultValue="child" 
                  value={activeTab} 
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="child">
                      <span className="flex items-center">
                        <i className="ri-user-smile-line mr-2"></i>
                        Child
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="parent">
                      <span className="flex items-center">
                        <i className="ri-user-settings-line mr-2"></i>
                        Parent
                      </span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="child" className="mt-4">
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

                  <TabsContent value="parent" className="mt-4">
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
              </CardContent>
              <CardFooter className="flex flex-col">
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Parents: Use your credentials to access parent controls.<br />
                  Kids: Log in to see your chores and rewards!
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}