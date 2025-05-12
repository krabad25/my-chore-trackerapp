import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Welcome from "@/pages/welcome";
import Chores from "@/pages/chores";
import Rewards from "@/pages/rewards";
import Progress from "@/pages/progress";
import ParentMode from "@/pages/parent-mode";
import AddChore from "@/pages/add-chore";
import AddReward from "@/pages/add-reward";
import { useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/chores" component={Chores} />
      <Route path="/rewards" component={Rewards} />
      <Route path="/progress" component={Progress} />
      <Route path="/parent" component={ParentMode} />
      <Route path="/add-chore" component={AddChore} />
      <Route path="/add-reward" component={AddReward} />
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
