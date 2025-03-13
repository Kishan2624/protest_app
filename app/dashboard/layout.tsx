"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { MegaphoneIcon } from "lucide-react";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("DashboardLayout component rendered");

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("useEffect called");
    checkUser();
  }, []);

  const checkUser = async () => {
    console.log("checkUser function called");
    try {
      const { data, error } = await supabase.auth.getUser();
      console.log("Supabase response:", { data, error });
      if (error) {
        console.error("Error fetching user:", error);
        router.push("/auth/login");
        return;
      }
      if (!data.user) {
        console.warn("No user data found");
        router.push("/auth/login");
        return;
      }
      console.log("User is authenticated:", data.user);
    } catch (error) {
      console.error("Error checking user:", error);
      router.push("/auth/login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      // Clear local storage or session storage where tokens are stored
      localStorage.removeItem("sb-access-token");
      localStorage.removeItem("sb-refresh-token");
      // Attempt to remove cookies manually (if not HTTP-only)
      document.cookie =
        "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      document.cookie =
        "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";

      // Call Supabase signOut (in case it still has an effect)
      await supabase.auth.signOut();

      // Redirect user
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between py-4">
            <Link href="/" className="flex items-center space-x-2 mb-4 md:mb-0">
              <MegaphoneIcon className="h-6 w-6 text-primary" />
              <span className="font-bold">DSEU Student Voice</span>
            </Link>
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
              <Link href="/petition/sign">
                <Button variant="outline" className="w-full md:w-auto">
                  Sign Petition
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full md:w-auto"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
