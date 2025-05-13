import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ChoreCompletion, Chore, User } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarClock, ThumbsDown, ThumbsUp, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface PendingCompletion {
  completion: ChoreCompletion;
  chore: Chore;
  child: User;
}

export function ChoreApprovalList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch pending chore completions
  const { data: pendingCompletions, isLoading, error } = useQuery({
    queryKey: ["/api/chore-completions/pending"],
    retry: 1,
  });
  
  // Handle approval or rejection
  const reviewMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "approved" | "rejected" }) => {
      return apiRequest(`/api/chore-completions/${id}/review`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/chore-completions/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });
  
  // Handle approval or rejection action
  const handleReview = (completion: ChoreCompletion, status: "approved" | "rejected") => {
    reviewMutation.mutate({ id: completion.id, status }, {
      onSuccess: (data) => {
        const actionText = status === "approved" ? "approved" : "rejected";
        toast({
          title: `Chore ${actionText}!`,
          description: status === "approved" 
            ? "Points have been awarded to the child." 
            : "No points were awarded.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to process the review. Please try again.",
          variant: "destructive",
        });
      },
    });
  };
  
  if (isLoading) {
    return <div className="p-8 text-center">Loading pending chore completions...</div>;
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load chore approvals. Please try again.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!pendingCompletions || pendingCompletions.length === 0) {
    return (
      <Alert className="mb-4">
        <CalendarClock className="h-4 w-4" />
        <AlertTitle>All caught up!</AlertTitle>
        <AlertDescription>
          There are no pending chore completions to review.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Chores Waiting for Approval</h2>
      <p className="text-muted-foreground">
        Review completed chores and approve or reject them
      </p>
      
      <div className="grid gap-4 md:grid-cols-2">
        {pendingCompletions.map((item: PendingCompletion) => (
          <ChoreApprovalCard
            key={item.completion.id}
            item={item}
            onApprove={() => handleReview(item.completion, "approved")}
            onReject={() => handleReview(item.completion, "rejected")}
            isProcessing={reviewMutation.isPending}
          />
        ))}
      </div>
    </div>
  );
}

interface ChoreApprovalCardProps {
  item: PendingCompletion;
  onApprove: () => void;
  onReject: () => void;
  isProcessing: boolean;
}

function ChoreApprovalCard({ item, onApprove, onReject, isProcessing }: ChoreApprovalCardProps) {
  const { completion, chore, child } = item;
  const completedAt = new Date(completion.completedAt! * 1000);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{chore.title}</CardTitle>
            <CardDescription>
              Completed {formatDistanceToNow(completedAt, { addSuffix: true })}
            </CardDescription>
          </div>
          <Badge>{chore.points} points</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="h-8 w-8">
            {child.profilePhoto ? (
              <AvatarImage src={child.profilePhoto} alt={child.name} />
            ) : (
              <AvatarFallback>{child.name.charAt(0)}</AvatarFallback>
            )}
          </Avatar>
          <span className="font-medium">{child.name}</span>
        </div>
        
        {completion.proofImageUrl && (
          <div className="rounded-md overflow-hidden mt-2 mb-3">
            <img 
              src={completion.proofImageUrl} 
              alt="Proof of completion" 
              className="w-full h-auto object-cover max-h-[200px]"
            />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="gap-2">
        <Button 
          className="w-full" 
          variant="default" 
          onClick={onApprove}
          disabled={isProcessing}
        >
          <ThumbsUp className="mr-2 h-4 w-4" />
          Approve
        </Button>
        
        <Button 
          className="w-full" 
          variant="outline" 
          onClick={onReject}
          disabled={isProcessing}
        >
          <ThumbsDown className="mr-2 h-4 w-4" />
          Reject
        </Button>
      </CardFooter>
    </Card>
  );
}