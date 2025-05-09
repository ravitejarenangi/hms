"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Download, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from "recharts";

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface RevenueExpensesData {
  revenue: CategoryData[];
  expenses: CategoryData[];
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    profit: number;
    profitMargin: number;
  };
}

export default function RevenueExpensesChart() {
  const [data, setData] = useState<RevenueExpensesData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string>("monthly");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("revenue");
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

    // Create new EventSource connection
    const eventSource = new EventSource(`/api/dashboard/revenue-expenses-sse?${params.toString()}`);
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
  }, [timeframe]);

  const handleRefresh = () => {
    setLoading(true);
    // The useEffect will handle reconnecting
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
  };

  const handleExport = () => {
    if (!data) return;

    // Create CSV content
    const csvContent = [
      ["Category", "Revenue", "Expenses"],
      ...data.revenue.map((item, index) => [
        item.name,
        item.value,
        index < data.expenses.length ? data.expenses[index].value : 0
      ])
    ].map(row => row.join(",")).join("\n");

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `revenue_expenses_data_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  
    return (
      <g>
        <text x={cx} y={cy} dy={-20} textAnchor="middle" fill="#888">
          {payload.name}
        </text>
        <text x={cx} y={cy} textAnchor="middle" fill="#333" style={{ fontSize: '24px', fontWeight: 'bold' }}>
          ${value.toLocaleString()}
        </text>
        <text x={cx} y={cy} dy={20} textAnchor="middle" fill="#888">
          {(percent * 100).toFixed(2)}%
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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

    if (!data) {
      return (
        <div className="w-full h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </div>
      );
    }

    const chartData = activeTab === "revenue" ? data.revenue : data.expenses;

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            activeIndex={activeIndex !== null ? activeIndex : undefined}
            activeShape={renderActiveShape}
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            dataKey="value"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(value as number)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Revenue & Expenses Comparison</CardTitle>
        <CardDescription>
          Breakdown of revenue and expenses by category
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
                  <SelectItem value="yearly">Yearly</SelectItem>
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

          {data && !loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <h3 className="text-2xl font-bold">{formatCurrency(data.summary.totalRevenue)}</h3>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                    <h3 className="text-2xl font-bold">{formatCurrency(data.summary.totalExpenses)}</h3>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Profit Margin</p>
                    <div className="flex items-center justify-center">
                      <h3 className="text-2xl font-bold">{data.summary.profitMargin.toFixed(2)}%</h3>
                      {data.summary.profit > 0 ? (
                        <TrendingUp className="ml-2 h-5 w-5 text-green-500" />
                      ) : (
                        <TrendingDown className="ml-2 h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue="revenue" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
            </TabsList>
            <TabsContent value="revenue" className="pt-4">
              {renderChart()}
            </TabsContent>
            <TabsContent value="expenses" className="pt-4">
              {renderChart()}
            </TabsContent>
          </Tabs>

          {data && !loading && !error && (
            <div className="rounded-md border mt-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(activeTab === "revenue" ? data.revenue : data.expenses).map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                          {item.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(item.value)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {((item.value / (activeTab === "revenue" ? data.summary.totalRevenue : data.summary.totalExpenses)) * 100).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
