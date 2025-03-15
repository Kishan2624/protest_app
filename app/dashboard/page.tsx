"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { SharePetition } from "@/components/share-petition";
import { generatePetitionPDF } from "@/lib/pdf";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { supabase } from "@/lib/supabase/client";
import {
  UsersIcon,
  BuildingIcon,
  CheckCircleIcon,
  ClockIcon,
  Download,
} from "lucide-react";

interface DashboardStats {
  totalSignatures: number;
  pendingVerification: number;
  verifiedSignatures: number;
  collegeBreakdown: { name: string; count: number }[];
  commonIssues: { category: string; count: number }[];
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSignatures: 0,
    pendingVerification: 0,
    verifiedSignatures: 0,
    collegeBreakdown: [],
    commonIssues: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Get total signatures
      const { count: totalCount } = await supabase
        .from("petitions")
        .select("*", { count: "exact" });

      // Get pending signatures
      const { count: pendingCount } = await supabase
        .from("petitions")
        .select("*", { count: "exact" })
        .eq("status", "pending");

      // Get verified signatures
      const { count: verifiedCount } = await supabase
        .from("petitions")
        .select("*", { count: "exact" })
        .eq("status", "verified");

      // Get college breakdown
      const { data: collegeData } = await supabase
        .from("petitions")
        .select("college_name")
        .not("status", "eq", "rejected");

      const collegeBreakdown = collegeData
        ? Object.entries(
            collegeData.reduce((acc: any, curr) => {
              acc[curr.college_name] = (acc[curr.college_name] || 0) + 1;
              return acc;
            }, {})
          ).map(([name, count]) => ({ name, count: count as number }))
        : [];

      // Get common issues
      const { data: issuesData } = await supabase
        .from("petitions")
        .select("problem_description")
        .not("status", "eq", "rejected");

      const issueCategories = {
        "Job Prospects": /job|career|employment|placement/i,
        "Higher Education": /higher education|masters|further studies/i,
        Recognition: /recognition|validity|acceptance/i,
        "Industry Training": /training|internship|practical/i,
        Other: /.*/,
      };

      const commonIssues = issuesData
        ? Object.entries(
            issuesData.reduce((acc: any, curr) => {
              const category =
                Object.entries(issueCategories).find(([_, pattern]) =>
                  pattern.test(curr.problem_description)
                )?.[0] || "Other";
              acc[category] = (acc[category] || 0) + 1;
              return acc;
            }, {})
          ).map(([category, count]) => ({ category, count: count as number }))
        : [];

      setStats({
        totalSignatures: totalCount || 0,
        pendingVerification: pendingCount || 0,
        verifiedSignatures: verifiedCount || 0,
        collegeBreakdown,
        commonIssues,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to download your petition",
        });
        return;
      }

      // Fetch user's petition
      const { data: petitions, error } = await supabase
        .from("petitions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!petitions || petitions.length === 0) {
        toast({
          variant: "destructive",
          title: "No Petition Found",
          description:
            "You haven't signed any petition yet. Please sign a petition first.",
        });
        return;
      }

      const petition = petitions[0];
      console.log(petition);
      const pdf = await generatePetitionPDF({
        fullName: petition.full_name,
        collegeName: petition.college_name,
        rollNumber: petition.roll_number,
        email: petition.email,
        phoneNumber: petition.phone_number,
        problemDescription: petition.problem_description,
        profileUrl: petition.profile_url,
        signatureUrl: petition.signature_url,
        aadharUrl: petition.aadhar_url,
        createdAt: petition.created_at,
      });

      pdf.save(`petition-${petition.id}.pdf`);

      toast({
        title: "PDF Generated",
        description: "Your petition PDF has been downloaded",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PDF. Please try again later.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 space-y-4 md:space-y-0">
        <h1 className="text-3xl font-bold">Petition Dashboard</h1>
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
          <SharePetition stats={stats} />
          <Button onClick={handleDownloadPDF} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download My Petition
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <UsersIcon className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Signatures</p>
              <h3 className="text-2xl font-bold">{stats.totalSignatures}</h3>
            </div>
          </div>
          <Progress
            value={(stats.totalSignatures / 10000) * 100}
            className="mt-4"
          />
          <p className="text-sm text-muted-foreground mt-2">
            Goal: 10,000 signatures
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Verified</p>
              <h3 className="text-2xl font-bold">{stats.verifiedSignatures}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <ClockIcon className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <h3 className="text-2xl font-bold">
                {stats.pendingVerification}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <BuildingIcon className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Colleges</p>
              <h3 className="text-2xl font-bold">
                {stats.collegeBreakdown.length}
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-6">College Distribution</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.collegeBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-6">Common Issues</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.commonIssues}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  label
                >
                  {stats.commonIssues.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Detailed Stats Table */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Issue Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">Category</th>
                <th className="text-right py-3">Count</th>
                <th className="text-right py-3">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {stats.commonIssues.map((issue, index) => (
                <tr key={index} className="border-b">
                  <td className="py-3">{issue.category}</td>
                  <td className="text-right">{issue.count}</td>
                  <td className="text-right">
                    {((issue.count / stats.totalSignatures) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
