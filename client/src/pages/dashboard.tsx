import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ChoreItem } from "@/components/chore-item";
import { RewardCard } from "@/components/reward-card";
import { ProfilePhotoUploader } from "@/components/profile-photo-uploader";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Chore, Reward, ChoreCompletion } from "@shared/schema";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, isLoading: isUserLoading } = useAuth();
  const { toast } = useToast();

  // Fetch chores
  const { data: chores = [], isLoading: isChoresLoading } = useQuery<Chore[]>({
    queryKey: ["/api/chores"],
  });

  // Fetch rewards
  const { data: rewards = [], isLoading: isRewardsLoading } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
  });

  // Fetch pending completions
  const { data: pendingCompletions = [], isLoading: isPendingLoading } = useQuery<ChoreCompletion[]>({
    queryKey: ["/api/chore-completions/user", user?.id, "pending"],
    enabled: !!user,
  });

  const handleCompleteChore = async (chore: Chore) => {
    navigate(`/chore-complete/${chore.id}`);
  };

  const handleClaimReward = async (reward: Reward) => {
    if (!user) return;

    if ((user.points || 0) < reward.points) {
      toast({
        title: "Not enough points",
        description: `You need ${reward.points - (user.points || 0)} more points to claim this reward.`,
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await apiRequest(`/api/rewards/${reward.id}/claim`, {
        method: "POST"
      });

      if (result) {
        toast({
          title: "Reward Requested!",
          description: "Your reward request has been sent to your parent for approval.",
        });
      }
    } catch (error) {
      console.error("Failed to claim reward:", error);
      toast({
        title: "Failed to request reward",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="container py-6">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-40 w-full mb-4" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  // Filter out chores that are already pending approval
  const pendingChoreIds = pendingCompletions.map(completion => completion.choreId);
  const availableChores = chores.filter(chore => !pendingChoreIds.includes(chore.id));

  return (
    <div className="container py-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">
            Welcome, {user.name}!
          </h1>
          <p className="text-muted-foreground">
            You have <span className="font-bold text-primary">{user.points || 0}</span> points to spend
          </p>
        </div>
        <ProfilePhotoUploader user={user} size="md" />
      </div>

      <Tabs defaultValue="rewards" className="space-y-4">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="rewards">
            <div className="flex items-center">
              <i className="ri-gift-2-line mr-2"></i> Rewards
            </div>
          </TabsTrigger>
          <TabsTrigger value="chores">
            <div className="flex items-center">
              <i className="ri-task-line mr-2"></i> Chores
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rewards" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isRewardsLoading ? (
              <>
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
              </>
            ) : rewards.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No rewards available yet</AlertTitle>
                <AlertDescription>
                  Ask your parent to add some rewards for you to earn.
                </AlertDescription>
              </Alert>
            ) : (
              rewards.map((reward) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  userPoints={user.points || 0}
                  onClaim={() => handleClaimReward(reward)}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="chores" className="space-y-4">
          {pendingCompletions.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Pending Approval</CardTitle>
                <CardDescription>
                  These chores are waiting for your parent to review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingCompletions.map((completion) => {
                    const chore = chores.find(c => c.id === completion.choreId);
                    if (!chore) return null;
                    return (
                      <div key={completion.id} className="p-3 bg-secondary/20 rounded-md">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <i className="ri-time-line text-amber-600"></i>
                            <span>{chore.title}</span>
                          </div>
                          <span className="text-amber-600 font-medium">Pending</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {isChoresLoading ? (
            <>
              <Skeleton className="h-24 w-full mb-2" />
              <Skeleton className="h-24 w-full mb-2" />
            </>
          ) : availableChores.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No chores available</AlertTitle>
              <AlertDescription>
                You've completed all your chores! Great job!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {availableChores.map((chore) => (
                <ChoreItem
                  key={chore.id}
                  chore={chore}
                  onComplete={handleCompleteChore}
                  pendingCompletions={pendingCompletions}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex justify-center">
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={() => navigate("/profile")}
        >
          <i className="ri-user-line"></i>
          View Profile
        </Button>
      </div>
    </div>
  );
}