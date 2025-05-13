import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfilePhotoUploader } from "@/components/profile-photo-uploader";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

export default function ProfilePage() {
  const { userId, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/user"],
    enabled: isAuthenticated,
  });

  const isLoading = authLoading || userLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-medium">Please log in to view your profile</h3>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">My Profile</CardTitle>
            <CardDescription className="text-center">
              View and manage your profile information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center mb-6">
              <ProfilePhotoUploader user={user} size="lg" />
              <h2 className="text-xl font-bold mt-4">{user.name}</h2>
              <p className="text-muted-foreground">
                {user.role === "parent" ? "Parent Account" : "Child Account"}
              </p>
              {user.points !== null && (
                <div className="mt-2 bg-primary/10 px-4 py-2 rounded-full">
                  <span className="font-bold">{user.points}</span> points
                </div>
              )}
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={user.username} readOnly />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={user.name} readOnly />
              </div>

              {user.role === "child" && user.parentId && (
                <div className="space-y-2">
                  <Label htmlFor="parent">Parent Account</Label>
                  <Input id="parent" value="Parent Account" readOnly />
                </div>
              )}

              <div className="pt-4">
                <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
                  <i className="ri-arrow-left-line mr-2"></i>
                  Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}