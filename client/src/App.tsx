import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Welcome from "@/pages/welcome";
import Login from "@/pages/login";
import Chores from "@/pages/chores";
import Rewards from "@/pages/rewards";
import Progress from "@/pages/progress";
import ParentMode from "@/pages/parent-mode";
import AddChore from "@/pages/add-chore";
import AddReward from "@/pages/add-reward";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

// Protected route component for child users
const ChildRoute = ({ component: Component, ...rest }: any) => {
  const { isAuthenticated, isChild } = useAuth();
  
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (!isChild) return <Redirect to="/parent" />;
  
  return <Component {...rest} />;
};

// Protected route component for parent users
const ParentRoute = ({ component: Component, ...rest }: any) => {
  const { isAuthenticated, isParent } = useAuth();
  
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (!isParent) return <Redirect to="/chores" />;
  
  return <Component {...rest} />;
};

function Router() {
  const { isAuthenticated } = useAuth();
  
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={isAuthenticated ? Chores : Welcome} />
      
      {/* Child Routes */}
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
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
