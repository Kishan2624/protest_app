"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabase/client";
import { format } from "date-fns";

interface AdminStats {
  totalUsers: number;
  totalPetitions: number;
  verificationRate: number;
  dailySignatures: { date: string; count: number }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalPetitions: 0,
    verificationRate: 0,
    dailySignatures: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      // Get total users
      const { count: userCount } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });

      console.log("Total Users:", userCount);

      // Get petition stats
      const { data: petitions } = await supabase
        .from("petitions")
        .select("created_at, status");
      console.log("Petitions Data:", petitions);

      const totalPetitions = petitions?.length || 0;
      const verifiedPetitions =
        petitions?.filter((p) => p.status === "verified").length || 0;
      const verificationRate = totalPetitions
        ? (verifiedPetitions / totalPetitions) * 100
        : 0;

      // Calculate daily signatures
      const dailyCount = new Map<string, number>();
      petitions?.forEach((petition) => {
        const date = format(new Date(petition.created_at), "yyyy-MM-dd");
        dailyCount.set(date, (dailyCount.get(date) || 0) + 1);
      });

      const dailySignatures = Array.from(dailyCount.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setStats({
        totalUsers: userCount || 0,
        totalPetitions,
        verificationRate,
        dailySignatures,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            Total Users
          </h3>
          <p className="text-2xl font-bold">{stats.totalUsers}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            Total Petitions
          </h3>
          <p className="text-2xl font-bold">{stats.totalPetitions}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            Verification Rate
          </h3>
          <p className="text-2xl font-bold">
            {stats.verificationRate.toFixed(1)}%
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-6">Daily Signatures</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.dailySignatures}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
