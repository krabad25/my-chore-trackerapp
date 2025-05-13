import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { User, Reward, RewardClaim } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Define the combined type for the pending claim with its related data
interface PendingClaim {
  claim: RewardClaim;
  reward: Reward;
  child: User;
}

export function RewardClaimApprovalList() {
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  // Fetch pending reward claims
  const { data: pendingClaims = [], isLoading, refetch } = useQuery<PendingClaim[]>({
    queryKey: ["/api/reward-claims/pending"]
  });
  
  const reviewMutation = useMutation({
    mutationFn: async ({ claimId, status }: { claimId: number, status: "approved" | "rejected" }) => {
      return apiRequest(`/api/reward-claims/${claimId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setProcessingId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process the reward claim.",
        variant: "destructive"
      });
      setProcessingId(null);
    }
  });
  
  const handleReview = (claim: RewardClaim, status: "approved" | "rejected") => {
    setProcessingId(claim.id);
    reviewMutation.mutate({ claimId: claim.id, status });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }
  
  if (pendingClaims.length === 0) {
    return (
      <Card className="bg-white border-none shadow-sm">
        <CardContent className="pt-6 text-center text-muted-foreground">
          No pending reward claims to approve.
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Pending Reward Requests</h2>
      {pendingClaims.map((item: PendingClaim) => (
        <RewardClaimApprovalCard
          key={item.claim.id}
          item={item}
          onApprove={() => handleReview(item.claim, "approved")}
          onReject={() => handleReview(item.claim, "rejected")}
          isProcessing={processingId === item.claim.id}
        />
      ))}
    </div>
  );
}

interface RewardClaimApprovalCardProps {
  item: PendingClaim;
  onApprove: () => void;
  onReject: () => void;
  isProcessing: boolean;
}

function RewardClaimApprovalCard({ item, onApprove, onReject, isProcessing }: RewardClaimApprovalCardProps) {
  const { claim, reward, child } = item;
  
  // Format the claimed time nicely
  const claimedDate = claim.claimedAt ? new Date(claim.claimedAt * 1000) : new Date();
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(claimedDate);
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between">
          <span>{reward.title}</span>
          <span className="text-primary font-bold">{reward.points} points</span>
        </CardTitle>
        <CardDescription>
          Requested by {child.name} on {formattedDate}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="bg-muted p-3 rounded-md flex items-center gap-2">
          <span className="font-medium">Current points: {child.points}</span>
          <span className="text-sm text-muted-foreground">
            (Will have {(child.points ?? 0) - reward.points} points after approval)
          </span>
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={onReject} 
          disabled={isProcessing}
          className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold border border-gray-300"
        >
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Decline"}
        </Button>
        <Button 
          onClick={onApprove} 
          disabled={isProcessing}
          variant="default"
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold border-0"
        >
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
        </Button>
      </CardFooter>
    </Card>
  );
}