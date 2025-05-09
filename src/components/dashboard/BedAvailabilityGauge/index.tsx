"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Download, RefreshCw } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Progress } from "@/components/ui/progress";

interface DepartmentData {
  department: string;
  color: string;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
}

interface BedAvailabilityData {
  departments: DepartmentData[];
  overall: {
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    occupancyRate: number;
  };
}

export default function BedAvailabilityGauge() {
  const [data, setData] = useState<BedAvailabilityData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/dashboard/bed-availability');
      
      if (!response.ok) {
        throw new Error('Failed to fetch bed availability data');
      }
      
      const data = await response.json();
      setData(data);
    } catch (err) {
      console.error('Error fetching bed availability data:', err);
      setError('Failed to load bed availability data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up interval for periodic updates (every 5 minutes)
    const intervalId = setInterval(fetchData, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  const handleExport = () => {
    if (!data) return;

    // Create CSV content
    const csvContent = [
      ["Department", "Total Beds", "Occupied Beds", "Available Beds", "Occupancy Rate (%)"],
      ...data.departments.map(dept => [
        dept.department,
        dept.totalBeds,
        dept.occupiedBeds,
        dept.availableBeds,
        dept.occupancyRate
      ]),
      ["OVERALL", data.overall.totalBeds, data.overall.occupiedBeds, data.overall.availableBeds, data.overall.occupancyRate]
    ].map(row => row.join(",")).join("\n");

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bed_availability_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getOccupancyColor = (rate: number) => {
    if (rate < 50) return "bg-green-500";
    if (rate < 75) return "bg-yellow-500";
    if (rate < 90) return "bg-orange-500";
    return "bg-red-500";
  };

  const renderGaugeChart = () => {
    if (loading) {
      return (
        <div className="w-full h-[300px] flex items-center justify-center">
          <Skeleton className="h-[300px] w-full" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (!data) {
      return (
        <div className="w-full h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </div>
      );
    }

    const displayData = selectedDepartment === "all" 
      ? [
          { name: "Occupied", value: data.overall.occupiedBeds, color: "#ef4444" },
          { name: "Available", value: data.overall.availableBeds, color: "#10b981" }
        ]
      : (() => {
          const dept = data.departments.find(d => d.department === selectedDepartment);
          if (!dept) return [];
          return [
            { name: "Occupied", value: dept.occupiedBeds, color: "#ef4444" },
            { name: "Available", value: dept.availableBeds, color: "#10b981" }
          ];
        })();

    const occupancyRate = selectedDepartment === "all" 
      ? data.overall.occupancyRate
      : data.departments.find(d => d.department === selectedDepartment)?.occupancyRate || 0;

    return (
      <div className="flex flex-col items-center">
        <div className="w-full h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {displayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} beds`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="w-full mt-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Occupancy Rate</span>
            <span className="text-sm font-medium">{occupancyRate}%</span>
          </div>
          <Progress value={occupancyRate} className="h-2" indicatorClassName={getOccupancyColor(occupancyRate)} />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">0%</span>
            <span className="text-xs text-muted-foreground">100%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Bed Availability</CardTitle>
        <CardDescription>
          Current hospital bed occupancy and availability status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex flex-wrap gap-2 justify-between">
            <div className="flex flex-wrap gap-2">
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {data?.departments.map((dept, index) => (
                    <SelectItem key={index} value={dept.department}>{dept.department}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="icon" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleExport}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs defaultValue="gauge" className="w-full">
            <TabsList>
              <TabsTrigger value="gauge">Gauge</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>
            <TabsContent value="gauge" className="pt-4">
              {renderGaugeChart()}
            </TabsContent>
            <TabsContent value="details" className="pt-4">
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Beds</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupied</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupancy Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      Array(5).fill(0).map((_, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-20" /></td>
                          <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-10" /></td>
                          <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-10" /></td>
                          <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-10" /></td>
                          <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-16" /></td>
                        </tr>
                      ))
                    ) : data ? (
                      <>
                        {data.departments.map((dept, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: dept.color }}></div>
                                {dept.department}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{dept.totalBeds}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{dept.occupiedBeds}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{dept.availableBeds}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`h-2 w-16 rounded-full overflow-hidden bg-gray-200 mr-2`}>
                                  <div 
                                    className={getOccupancyColor(dept.occupancyRate)} 
                                    style={{ width: `${dept.occupancyRate}%`, height: '100%' }}
                                  ></div>
                                </div>
                                {dept.occupancyRate}%
                              </div>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-medium">
                          <td className="px-6 py-4 whitespace-nowrap">OVERALL</td>
                          <td className="px-6 py-4 whitespace-nowrap">{data.overall.totalBeds}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{data.overall.occupiedBeds}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{data.overall.availableBeds}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`h-2 w-16 rounded-full overflow-hidden bg-gray-200 mr-2`}>
                                <div 
                                  className={getOccupancyColor(data.overall.occupancyRate)} 
                                  style={{ width: `${data.overall.occupancyRate}%`, height: '100%' }}
                                ></div>
                              </div>
                              {data.overall.occupancyRate}%
                            </div>
                          </td>
                        </tr>
                      </>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
