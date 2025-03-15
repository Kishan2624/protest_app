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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { generatePetitionPDF } from "@/lib/pdf";
import { Eye, Download } from "lucide-react";

interface Petition {
  id: string;
  full_name: string;
  college_name: string;
  email: string;
  status: string;
  created_at: string;
  profile_url: string;
  aadhar_url: string;
  signature_url: string;
  problem_description: string;
  phone_number: string;
  roll_number: string;
}

export default function PetitionsPage() {
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPetition, setSelectedPetition] = useState<Petition | null>(
    null
  );
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

  const handleDownloadPDF = async (petition: Petition) => {
    try {
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
        description: "Petition PDF has been downloaded",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PDF",
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
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        <h1 className="text-3xl font-bold text-center md:text-left">
          Petitions
        </h1>
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
          <Input
            placeholder="Search petitions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-32">
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
                      variant="outline"
                      onClick={() => setSelectedPetition(petition)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadPDF(petition)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
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
      {/* Petition Details Dialog */}
      <Dialog
        open={!!selectedPetition}
        onOpenChange={() => setSelectedPetition(null)}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Petition Details</DialogTitle>
          </DialogHeader>
          {selectedPetition && (
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div>
                {/* Smaller Profile Image */}
                <img
                  src={selectedPetition.profile_url}
                  alt="Profile"
                  className="w-32 h-32 object-contain mb-4"
                />
                <div className="space-y-2">
                  <p>
                    <strong>Name:</strong> {selectedPetition.full_name}
                  </p>
                  <p>
                    <strong>College:</strong> {selectedPetition.college_name}
                  </p>
                  <p>
                    <strong>Roll Number:</strong> {selectedPetition.roll_number}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedPetition.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedPetition.phone_number}
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Problem Description */}
                <div>
                  <h4 className="font-semibold mb-2">Problem Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedPetition.problem_description}
                  </p>
                </div>

                {/* Wider Signature Image */}
                <div>
                  <h4 className="font-semibold mb-2">Signature</h4>
                  <img
                    src={selectedPetition.signature_url}
                    alt="Signature"
                    className="w-32 h-20 object-contain"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Aadhar Card Below the Content */}
          {selectedPetition?.aadhar_url && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Identity Document</h4>
              {selectedPetition.aadhar_url.endsWith(".pdf") ? (
                <a
                  href={selectedPetition.aadhar_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  View Aadhar Card (PDF)
                </a>
              ) : (
                <img
                  src={selectedPetition.aadhar_url}
                  alt="Aadhar Card"
                  className=" object-contain"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
