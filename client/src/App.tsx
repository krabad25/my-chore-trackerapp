import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/navbar";
import NotFound from "@/pages/not-found";
import Welcome from "@/pages/welcome";
import Dashboard from "@/pages/dashboard";
import Chores from "@/pages/chores";
import Rewards from "@/pages/rewards";
import Progress from "@/pages/progress";
import ParentMode from "@/pages/parent-mode";
import AddChore from "@/pages/add-chore";
import AddReward from "@/pages/add-reward";
import Profile from "@/pages/profile";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

// Protected route component for child users
const ChildRoute = ({ component: Component, ...rest }: any) => {
  const { isAuthenticated, isChild, isLoading } = useAuth();
  
  // Show loading state while auth is being checked
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) return <Redirect to="/" />;
  if (!isChild) return <Redirect to="/parent" />;
  
  return <Component {...rest} />;
};

// Protected route component for parent users
const ParentRoute = ({ component: Component, ...rest }: any) => {
  const { isAuthenticated, isParent, isLoading } = useAuth();
  
  // Show loading state while auth is being checked
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) return <Redirect to="/" />;
  if (!isParent) return <Redirect to="/dashboard" />;
  
  return <Component {...rest} />;
};

function Router() {
  const { isAuthenticated, isChild } = useAuth();
  
  // Determine home route based on user role
  const HomeComponent = () => {
    if (!isAuthenticated) return <Welcome />;
    if (isChild) return <Redirect to="/dashboard" />;
    return <Redirect to="/parent" />;
  };
  
  return (
    <Switch>
      <Route path="/" component={HomeComponent} />
      
      {/* Child Routes - Temporarily bypass auth for direct access */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/chores" component={Chores} />
      <Route path="/rewards" component={Rewards} />
      <Route path="/progress" component={Progress} />
      
      {/* Parent Routes - Temporarily bypass auth for direct access */}
      <Route path="/parent" component={ParentMode} />
      <Route path="/add-chore" component={AddChore} />
      <Route path="/add-reward" component={AddReward} />
      
      {/* Common Routes - Accessible to both parents and children */}
      <Route path="/profile">
        {isAuthenticated ? <Profile /> : <Redirect to="/" />}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Set title for the application
  useEffect(() => {
    document.title = "Isabela's Chore Chart";
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-neutral text-dark font-nunito">
          <Toaster />
          <Navbar />
          <div className="pt-16 pb-4"> {/* Add padding for fixed navbar */}
            <Router />
          </div>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
