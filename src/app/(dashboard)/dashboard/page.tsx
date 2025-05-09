"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Import dashboard components
import AdmissionDischargeChart from "@/components/dashboard/AdmissionDischargeChart";
import RevenueExpensesChart from "@/components/dashboard/RevenueExpensesChart";
import BedAvailabilityGauge from "@/components/dashboard/BedAvailabilityGauge";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (status === "loading") {
    return <DashboardSkeleton />;
  }

  if (!session) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            You must be signed in to view this page. Please sign in and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const userRole = session?.user?.role || "patient";

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {userRole === "superadmin" && (
            <TabsTrigger value="hospital">Hospital Metrics</TabsTrigger>
          )}
          {(userRole === "superadmin" || userRole === "admin") && (
            <TabsTrigger value="admin">Administrative</TabsTrigger>
          )}
          {(userRole === "doctor" || userRole === "superadmin") && (
            <TabsTrigger value="doctor">Doctor</TabsTrigger>
          )}
          {(userRole === "nurse" || userRole === "superadmin") && (
            <TabsTrigger value="nurse">Nurse</TabsTrigger>
          )}
          {(userRole === "pharmacist" || userRole === "superadmin") && (
            <TabsTrigger value="pharmacy">Pharmacy</TabsTrigger>
          )}
          {(userRole === "lab_technician" || userRole === "superadmin") && (
            <TabsTrigger value="laboratory">Laboratory</TabsTrigger>
          )}
          {(userRole === "radiologist" || userRole === "superadmin") && (
            <TabsTrigger value="radiology">Radiology</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <WelcomeCard name={session.user?.name || "User"} role={userRole} />
            <QuickStatsCard loading={loading} />
            <RecentActivityCard loading={loading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AdmissionDischargeChart />
            <RevenueExpensesChart />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BedAvailabilityGauge />
          </div>
        </TabsContent>

        <TabsContent value="hospital" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AdmissionDischargeChart />
            <RevenueExpensesChart />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BedAvailabilityGauge />
          </div>
        </TabsContent>

        <TabsContent value="admin" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RevenueExpensesChart />
            <BedAvailabilityGauge />
          </div>
        </TabsContent>

        <TabsContent value="doctor" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AdmissionDischargeChart />
            <BedAvailabilityGauge />
          </div>
        </TabsContent>

        <TabsContent value="nurse" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BedAvailabilityGauge />
            <AdmissionDischargeChart />
          </div>
        </TabsContent>

        <TabsContent value="pharmacy" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Pharmacy Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Pharmacy-specific metrics will be displayed here.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Implementation in progress...
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="laboratory" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Laboratory Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Laboratory-specific metrics will be displayed here.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Implementation in progress...
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="radiology" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Radiology Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Radiology-specific metrics will be displayed here.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Implementation in progress...
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WelcomeCard({ name, role }: { name: string; role: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome, {name}!</CardTitle>
      </CardHeader>
      <CardContent>
        <p>You are logged in as: <span className="font-semibold capitalize">{role}</span></p>
        <p className="text-sm text-muted-foreground mt-2">
          This dashboard provides you with an overview of your hospital metrics and activities.
        </p>
      </CardContent>
    </Card>
  );
}

function QuickStatsCard({ loading }: { loading: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Stats</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : (
          <div className="space-y-2">
            <p>Total Patients: <span className="font-semibold">0</span></p>
            <p>Appointments Today: <span className="font-semibold">0</span></p>
            <p>Pending Tasks: <span className="font-semibold">0</span></p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentActivityCard({ loading }: { loading: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No recent activity to display.</p>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto p-4">
      <Skeleton className="h-10 w-1/4 mb-6" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    </div>
  );
}
