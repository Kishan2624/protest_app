"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const allowedFileTypes = ["image/jpeg", "image/png"];

const fileSchema = z
  .instanceof(File, { message: "File is required" })
  .refine((file) => allowedFileTypes.includes(file.type), {
    message: "Only JPG, JPEG, PNG, are allowed",
  })
  .refine((file) => file.size <= MAX_FILE_SIZE, {
    message: "Max file size is 5MB",
  });

const petitionSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  collegeName: z.string().min(2, "College name is required"),
  rollNumber: z.string().min(2, "Roll number is required"),
  phoneNumber: z.string().regex(/^\d{10}$/, "Invalid phone number"),
  email: z.string().email("Invalid email address"),
  problem: z
    .string()
    .min(50, "Please provide a detailed description (minimum 50 characters)"),
  aadharCard: fileSchema,
  profilePhoto: fileSchema,
  signaturePhoto: fileSchema,
});

type PetitionForm = z.infer<typeof petitionSchema>;

export default function SignPetitionPage() {
  const [showConsent, setShowConsent] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PetitionForm>({
    resolver: zodResolver(petitionSchema),
  });

  // Handle file change manually
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    name: keyof PetitionForm
  ) => {
    if (e.target.files?.length) {
      setValue(name, e.target.files[0]); // Update form state with the selected file
    }
  };

  const onSubmit = async (data: PetitionForm) => {
    try {
      setIsLoading(true);

      // Upload files to Cloudinary (you'll need to implement this)
      const aadharUrl = data.aadharCard
        ? await uploadFile(data.aadharCard, "aadhar")
        : "";
      const profileUrl = data.profilePhoto
        ? await uploadFile(data.profilePhoto, "profile")
        : "";
      const signatureUrl = data.signaturePhoto
        ? await uploadFile(data.signaturePhoto, "signatures")
        : "";

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Save petition data
      const { error } = await supabase.from("petitions").insert([
        {
          user_id: user.id,
          full_name: data.fullName,
          college_name: data.collegeName,
          roll_number: data.rollNumber,
          phone_number: data.phoneNumber,
          email: data.email,
          problem_description: data.problem,
          aadhar_url: aadharUrl,
          profile_url: profileUrl,
          signature_url: signatureUrl,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Petition submitted",
        description: "Thank you for signing the petition!",
      });

      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit petition",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Placeholder function for file upload
  const uploadFile = async (file: File, path: string): Promise<string> => {
    if (!file) throw new Error("No file selected");

    const { data, error } = await supabase.storage
      .from("petition-files") // Change to your bucket name
      .upload(`${path}/${Date.now()}_${file.name}`, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from("petition-files")
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  };

  if (showConsent) {
    return (
      <AlertDialog open={showConsent} onOpenChange={setShowConsent}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Consent Form</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 text-base">
              <p>
                By proceeding with this petition, you acknowledge and agree to
                the following:
              </p>
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  The information provided is accurate and true to the best of
                  your knowledge.
                </li>
                <li>
                  Your personal information will be used solely for the purpose
                  of this petition.
                </li>
                <li>
                  Your signature indicates support for AICTE approval of DSEU
                  diplomas.
                </li>
                <li>You are a current or former student of DSEU.</li>
                <li>
                  You understand that this petition may be submitted to relevant
                  authorities.
                </li>
              </ol>
              <p className="font-medium">
                Do you agree to these terms and wish to proceed with signing the
                petition?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => router.push("/")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => setShowConsent(false)}>
              I Agree
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Card className="p-6">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Sign the Petition
            </h1>
            <p className="text-sm text-muted-foreground">
              Please fill out all fields carefully. Your support matters.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Your full name"
                    {...register("fullName")}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="collegeName">College Name</Label>
                  <Input
                    id="collegeName"
                    placeholder="Your college name"
                    {...register("collegeName")}
                  />
                  {errors.collegeName && (
                    <p className="text-sm text-destructive">
                      {errors.collegeName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rollNumber">Roll Number</Label>
                  <Input
                    id="rollNumber"
                    placeholder="Your roll number"
                    {...register("rollNumber")}
                  />
                  {errors.rollNumber && (
                    <p className="text-sm text-destructive">
                      {errors.rollNumber.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="10-digit phone number"
                    {...register("phoneNumber")}
                  />
                  {errors.phoneNumber && (
                    <p className="text-sm text-destructive">
                      {errors.phoneNumber.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Your email address"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="problem">
                  How does AICTE approval impact you?
                </Label>
                <Textarea
                  id="problem"
                  placeholder="Describe how the lack of AICTE approval affects your education and career prospects..."
                  className="min-h-[100px]"
                  {...register("problem")}
                />
                {errors.problem && (
                  <p className="text-sm text-destructive">
                    {errors.problem.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="aadharCard">Aadhar Card</Label>
                  <Input
                    id="aadharCard"
                    type="file"
                    accept="image/jpeg, image/png, application/pdf"
                    onChange={(e) => handleFileChange(e, "aadharCard")}
                  />
                  {errors.aadharCard && (
                    <p className="text-sm text-destructive">
                      {errors.aadharCard.message as string}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profilePhoto">Profile Photo</Label>
                  <Input
                    id="profilePhoto"
                    type="file"
                    accept="image/jpeg, image/png, application/pdf"
                    onChange={(e) => handleFileChange(e, "profilePhoto")}
                  />
                  {errors.profilePhoto && (
                    <p className="text-sm text-destructive">
                      {errors.profilePhoto.message as string}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signaturePhoto">Signature Photo</Label>
                <Input
                  id="signaturePhoto"
                  type="file"
                  accept="image/jpeg, image/png, application/pdf"
                  onChange={(e) => handleFileChange(e, "signaturePhoto")}
                />
                {errors.signaturePhoto && (
                  <p className="text-sm text-destructive">
                    {errors.signaturePhoto.message as string}
                  </p>
                )}
              </div>
            </div>

            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Sign Petition"}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
