"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MegaphoneIcon } from "lucide-react";
import { SharePetition } from "@/components/share-petition";
import Link from "next/link";

interface HomeStats {
  totalSignatures: number;
  verifiedSignatures: number;
}

export default function Home() {
  const [stats, setStats] = useState<HomeStats>({
    totalSignatures: 0,
    verifiedSignatures: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHomeStats();
  }, []);

  const fetchHomeStats = async () => {
    try {
      // Get total signatures
      const { count: totalCount } = await supabase
        .from("petitions")
        .select("*", { count: "exact" });

      // Get verified signatures
      const { count: verifiedCount } = await supabase
        .from("petitions")
        .select("*", { count: "exact" })
        .eq("status", "verified");

      setStats({
        totalSignatures: totalCount || 0,
        verifiedSignatures: verifiedCount || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center space-y-8">
          <MegaphoneIcon className="h-16 w-16 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            DSEU Student Voice
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Join the movement to demand AICTE approval for DSEU diplomas. Your
            voice matters in shaping the future of technical education.
          </p>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 w-full max-w-4xl mt-8">
            <Card className="p-6 flex flex-col items-center space-y-4">
              <h2 className="text-2xl font-semibold">Sign Petition</h2>
              <p className="text-muted-foreground">
                Add your signature to support the cause
              </p>
              <Link href="/petition/sign">
                <Button size="lg">Sign Now</Button>
              </Link>
            </Card>

            <Card className="p-6 flex flex-col items-center space-y-4">
              <h2 className="text-2xl font-semibold">View Progress</h2>
              <p className="text-muted-foreground">
                Track the petition's impact
              </p>
              <Link href="/dashboard">
                <Button size="lg" variant="outline">
                  View Stats
                </Button>
              </Link>
            </Card>

            <Card className="p-6 flex flex-col items-center space-y-4">
              <h2 className="text-2xl font-semibold">Share</h2>
              <p className="text-muted-foreground">
                Spread the word on social media
              </p>
              <SharePetition stats={stats} />
            </Card>
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-2 max-w-4xl">
            <div className="text-left">
              <h3 className="text-2xl font-semibold mb-4">Why This Matters</h3>
              <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                <li>Ensure recognition of DSEU diplomas</li>
                <li>Improve job prospects for graduates</li>
                <li>Standardize education quality</li>
                <li>Enable further education opportunities</li>
              </ul>
            </div>
            <div className="text-left">
              <h3 className="text-2xl font-semibold mb-4">Our Goal</h3>
              <p className="text-muted-foreground">
                We aim to collect 10,000 signatures from DSEU students and
                alumni to present a strong case for AICTE approval, ensuring a
                better future for technical education in Delhi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
