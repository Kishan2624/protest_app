"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Petition {
  id: string;
  full_name: string;
  college_name: string;
  email: string;
  status: string;
  created_at: string;
}

export default function PetitionsPage() {
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchPetitions();
  }, []);

  const fetchPetitions = async () => {
    try {
      const { data, error } = await supabase
        .from("petitions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      console.log("Fetched Petitions:", data);
      setPetitions(data);
    } catch (error) {
      console.error("Error fetching petitions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch petitions",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePetitionStatus = async (id: string, status: string) => {
    try {
      console.log("Updating petition:", { id, status });

      // Step 1: Update petition status in Supabase
      const { error } = await supabase
        .from("petitions")
        .update({ status })
        .eq("id", id);

      if (error) {
        console.error("Supabase Update Error:", error);
        throw error;
      }

      console.log(`Petition ${id} updated to status: ${status}`);

      // Step 2: Fetch updated data to confirm update
      const { data: updatedPetition, error: fetchError } = await supabase
        .from("petitions")
        .select("id, status")
        .eq("id", id)
        .single(); // Fetch single updated row

      if (fetchError) {
        console.error("Error fetching updated petition:", fetchError);
        throw fetchError;
      }

      console.log("Updated petition data from DB:", updatedPetition);

      // Step 3: Update state with new data
      setPetitions((prevPetitions) =>
        prevPetitions.map((p) =>
          p.id === id ? { ...p, status: updatedPetition.status } : p
        )
      );

      toast({
        title: "Status updated",
        description: "Petition status has been updated successfully",
      });
    } catch (error) {
      console.error("Error updating petition status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update petition status",
      });
    }
  };

  const filteredPetitions = petitions.filter((petition) => {
    const matchesSearch =
      petition.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      petition.college_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      petition.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || petition.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Petitions</h1>
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search petitions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>College</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPetitions.map((petition) => (
              <TableRow key={petition.id}>
                <TableCell>{petition.full_name}</TableCell>
                <TableCell>{petition.college_name}</TableCell>
                <TableCell>{petition.email}</TableCell>
                <TableCell>
                  {format(new Date(petition.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      petition.status === "verified"
                        ? "bg-green-100 text-green-800"
                        : petition.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {petition.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant={
                        petition.status === "verified" ? "outline" : "default"
                      }
                      onClick={() =>
                        updatePetitionStatus(petition.id, "verified")
                      }
                    >
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        petition.status === "rejected"
                          ? "outline"
                          : "destructive"
                      }
                      onClick={() =>
                        updatePetitionStatus(petition.id, "rejected")
                      }
                    >
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
