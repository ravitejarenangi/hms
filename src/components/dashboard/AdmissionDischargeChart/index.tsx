"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Download, RefreshCw } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart, ComposedChart } from "recharts";

interface AdmissionDischargeData {
  date: string;
  admissions: number;
  discharges: number;
}

export default function AdmissionDischargeChart() {
  const [data, setData] = useState<AdmissionDischargeData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string>("daily");
  const [department, setDepartment] = useState<string>("all");
  const [doctor, setDoctor] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [chartType, setChartType] = useState<string>("bar");
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Clean up previous connection if it exists
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setLoading(true);
    setError(null);

    // Build query parameters
    const params = new URLSearchParams();
    params.append("timeframe", timeframe);
    if (department !== "all") params.append("department", department);
    if (doctor !== "all") params.append("doctor", doctor);
    if (startDate) params.append("startDate", startDate.toISOString());
    if (endDate) params.append("endDate", endDate.toISOString());

    // Create new EventSource connection
    const eventSource = new EventSource(`/api/dashboard/admission-discharge-rate-sse?${params.toString()}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        setData(parsedData);
        setLoading(false);
      } catch (err) {
        console.error("Error parsing SSE data:", err);
        setError("Failed to parse data from server");
        setLoading(false);
      }
    };

    eventSource.onerror = () => {
      console.error("EventSource failed");
      setError("Connection to server failed. Please try again later.");
      setLoading(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [timeframe, department, doctor, startDate, endDate]);

  const handleRefresh = () => {
    setLoading(true);
    // The useEffect will handle reconnecting
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
  };

  const handleExport = () => {
    // Create CSV content
    const csvContent = [
      ["Date", "Admissions", "Discharges"],
      ...data.map(item => [item.date, item.admissions, item.discharges])
    ].map(row => row.join(",")).join("\n");

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `admission_discharge_data_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderChart = () => {
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

    if (data.length === 0) {
      return (
        <div className="w-full h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </div>
      );
    }

    if (chartType === "bar") {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="admissions" name="Admissions" fill="#3b82f6" />
            <Bar dataKey="discharges" name="Discharges" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      );
    } else if (chartType === "line") {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="admissions" name="Admissions" stroke="#3b82f6" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="discharges" name="Discharges" stroke="#10b981" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="admissions" name="Admissions" fill="#3b82f6" />
            <Bar dataKey="discharges" name="Discharges" fill="#10b981" />
            <Line type="monotone" dataKey="admissions" name="Admission Trend" stroke="#1d4ed8" dot={false} />
            <Line type="monotone" dataKey="discharges" name="Discharge Trend" stroke="#047857" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Patient Admissions & Discharge Rate</CardTitle>
        <CardDescription>
          Overview of daily, weekly, or monthly patient admissions and discharges
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex flex-wrap gap-2 justify-between">
            <div className="flex flex-wrap gap-2">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>

              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="cardiology">Cardiology</SelectItem>
                  <SelectItem value="neurology">Neurology</SelectItem>
                  <SelectItem value="orthopedics">Orthopedics</SelectItem>
                  <SelectItem value="pediatrics">Pediatrics</SelectItem>
                </SelectContent>
              </Select>

              <Select value={doctor} onValueChange={setDoctor}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Doctor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doctors</SelectItem>
                  <SelectItem value="dr-smith">Dr. Smith</SelectItem>
                  <SelectItem value="dr-johnson">Dr. Johnson</SelectItem>
                  <SelectItem value="dr-williams">Dr. Williams</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Chart Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="composed">Composed Chart</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleExport}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm">From:</span>
              <DatePicker date={startDate} setDate={setStartDate} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">To:</span>
              <DatePicker date={endDate} setDate={setEndDate} />
            </div>
          </div>

          <Tabs defaultValue="chart" className="w-full">
            <TabsList>
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
            </TabsList>
            <TabsContent value="chart" className="pt-4">
              {renderChart()}
            </TabsContent>
            <TabsContent value="data" className="pt-4">
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admissions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discharges</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Change</th>
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
                        </tr>
                      ))
                    ) : (
                      data.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">{item.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{item.admissions}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{item.discharges}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={item.admissions - item.discharges > 0 ? "text-green-600" : item.admissions - item.discharges < 0 ? "text-red-600" : ""}>
                              {item.admissions - item.discharges > 0 ? "+" : ""}{item.admissions - item.discharges}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
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
