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
      
      {/* Child Routes */}
      <Route path="/dashboard">
        <ChildRoute component={Dashboard} />
      </Route>
      <Route path="/chores">
        <ChildRoute component={Chores} />
      </Route>
      <Route path="/rewards">
        <ChildRoute component={Rewards} />
      </Route>
      <Route path="/progress">
        <ChildRoute component={Progress} />
      </Route>
      
      {/* Parent Routes */}
      <Route path="/parent">
        <ParentRoute component={ParentMode} />
      </Route>
      <Route path="/add-chore">
        <ParentRoute component={AddChore} />
      </Route>
      <Route path="/add-reward">
        <ParentRoute component={AddReward} />
      </Route>
      
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
    document.title = "Isabella's Chore Chart";
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
