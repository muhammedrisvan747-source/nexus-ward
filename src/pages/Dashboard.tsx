import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Plus } from "lucide-react";
import { ComplaintDialog } from "@/components/ComplaintDialog";
import { useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const { data: complaints, refetch } = useQuery({
    queryKey: ["complaints", user?.id, isAdmin],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isAdmin) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Brototype Complaint Portal</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.email} {isAdmin && <span className="text-primary font-medium">(Admin)</span>}
            </span>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isAdmin ? "Total Complaints" : "Your Complaints"}
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{complaints?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {complaints?.length === 0 ? "No complaints yet" : "Submitted"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {isAdmin ? "All Complaints" : "Your Complaints"}
          </h2>
          {!isAdmin && (
            <ComplaintDialog
              trigger={
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Complaint
                </Button>
              }
              onSuccess={() => refetch()}
            />
          )}
        </div>

        {complaints && complaints.length > 0 ? (
          <div className="grid gap-4">
            {complaints.map((complaint) => (
              <Card key={complaint.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{complaint.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {complaint.description}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        complaint.status === "new" ? "bg-status-new/10 text-status-new" :
                        complaint.status === "in_progress" ? "bg-status-progress/10 text-status-progress" :
                        complaint.status === "resolved" ? "bg-status-resolved/10 text-status-resolved" :
                        "bg-status-closed/10 text-status-closed"
                      }`}>
                        {complaint.status.replace("_", " ")}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        complaint.priority === "high" ? "bg-priority-high/10 text-priority-high" :
                        complaint.priority === "medium" ? "bg-priority-medium/10 text-priority-medium" :
                        "bg-priority-low/10 text-priority-low"
                      }`}>
                        {complaint.priority}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{complaint.category}</span>
                    <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No complaints found. {!isAdmin && "Create your first complaint to get started."}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
