"use client";
import React from "react";
import Image from "next/image";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { prepareContractCall } from "thirdweb";
import { TransactionButton } from "thirdweb/react";
import { mainContract } from "@/constants/contracts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Upload,
  X,
  Plus,
  Check,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Menu,
} from "lucide-react";
import { useHackathonFormStore } from "@/store/useHackathonFormStore";

const formSchema = z.object({
  hackathonName: z.string().optional(),
  description: z.string().optional(),
  hackathonImage: z.any().optional(),
  judges: z.array(z.string()).optional(),
  sponsorshipEndTime: z.any().optional(),
  hackathonStartTime: z.any().optional(),
  hackathonEndTime: z.any().optional(),
  stakeAmount: z.string().optional(),
  minTeamMembers: z.string().optional(),
  maxTeamMembers: z.string().optional(),
  minSponsorshipThreshold: z.string().optional(),
  eventTimeline: z
    .array(
      z.object({
        eventName: z.string().optional(),
        eventDate: z.string().optional(),
        eventDescription: z.string().optional(),
      })
    )
    .optional(),
});

type FormData = z.infer<typeof formSchema>;

const steps = [
  {
    id: 1,
    title: "Basic Information",
    description: "Hackathon details and banner",
  },
  { id: 2, title: "Judge Panel", description: "Configure judge addresses" },
  {
    id: 3,
    title: "Event Timeline",
    description: "Schedule and deadlines",
  },
  {
    id: 4,
    title: "Financial Terms",
    description: "Stakes, fees and limits",
  },
  { id: 5, title: "Final Review", description: "Verify and submit" },
];

const CreateHackathonForm = () => {
  // Zustand store
  const {
    imagePreview,
    transactionData,
    isUploading,
    uploadProgress,
    uploadStatus,
    setImagePreview,
    setTransactionData,
    setUploadState,
    resetForm,
  } = useHackathonFormStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      hackathonName: "",
      description: "",
      judges: ["", "", "", "", ""],
      sponsorshipEndTime: "",
      hackathonStartTime: "",
      hackathonEndTime: "",
      stakeAmount: "",
      minTeamMembers: "",
      maxTeamMembers: "",
      minSponsorshipThreshold: "",
      eventTimeline: [{ eventName: "", eventDate: "", eventDescription: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "judges",
  });

  const {
    fields: timelineFields,
    append: appendTimeline,
    remove: removeTimeline,
  } = useFieldArray({
    control,
    name: "eventTimeline",
  });

  const watchAllFields = watch();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      setValue("hackathonImage", files);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: FormData) => {
    console.log("🎯 onSubmit called! Form data:", data);
    setUploadState({
      isUploading: true,
      uploadProgress: 0,
      uploadStatus: "Initializing upload...",
    });

    try {
      console.log("============================================");
      console.log("🚀 STARTING HACKATHON CREATION");
      console.log("============================================\n");

      // Validate Pinata JWT
      const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;

      if (!PINATA_JWT) {
        throw new Error(
          "Pinata JWT not found. Please set NEXT_PUBLIC_PINATA_JWT in your .env file"
        );
      }

      console.log("✅ Pinata JWT found");

      // Step 1: Upload Image to IPFS via Pinata
      console.log("📤 Step 1: Uploading image to IPFS via Pinata...");
      setUploadState({ uploadStatus: "Uploading image to IPFS..." });

      const imageFiles = data.hackathonImage;

      if (!imageFiles || imageFiles.length === 0) {
        throw new Error("No image file selected");
      }

      const imageFile = imageFiles[0];
      console.log(
        "Image file:",
        imageFile?.name || "unknown",
        "-",
        imageFile?.size || 0,
        "bytes"
      );

      // Upload image to Pinata
      const imageFormData = new FormData();
      imageFormData.append("file", imageFile);

      const imageUploadResponse = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        imageFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${PINATA_JWT}`,
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setUploadState({ uploadProgress: percentCompleted });
            console.log(`Image upload progress: ${percentCompleted}%`);
          },
        }
      );

      console.log("Image upload response:", imageUploadResponse.data);

      const imageHash = imageUploadResponse.data.IpfsHash;
      const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageHash}`;
      console.log("✅ Image uploaded successfully!");
      console.log("   CID:", imageHash);
      console.log("   URL:", imageUrl);
      console.log("");

      setUploadState({
        uploadProgress: 0,
        uploadStatus: "Creating metadata...",
      });

      // Step 2: Create metadata JSON with description, eventTimeline, and image reference
      console.log("📦 Step 2: Creating metadata JSON...");
      const metadata = {
        description: data.description,
        eventTimeline: data.eventTimeline,
        imageHash: imageHash,
        imageUrl: imageUrl,
      };

      console.log("Metadata:", JSON.stringify(metadata, null, 2));
      console.log("");

      // Step 3: Upload metadata JSON to IPFS via Pinata
      console.log("📤 Step 3: Uploading metadata to IPFS via Pinata...");
      setUploadState({ uploadStatus: "Uploading metadata to IPFS..." });

      const metadataBlob = new Blob([JSON.stringify(metadata)], {
        type: "application/json",
      });
      const metadataFile = new File([metadataBlob], "hackathon-metadata.json", {
        type: "application/json",
      });

      const metadataFormData = new FormData();
      metadataFormData.append("file", metadataFile);

      const metadataUploadResponse = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        metadataFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${PINATA_JWT}`,
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            console.log(`Metadata upload progress: ${percentCompleted}%`);
          },
        }
      );

      console.log("Metadata upload response:", metadataUploadResponse.data);

      const metadataHash = metadataUploadResponse.data.IpfsHash;
      const metadataUrl = `ipfs://${metadataHash}`;
      const metadataGatewayUrl = `https://gateway.pinata.cloud/ipfs/${metadataHash}`;
      console.log("✅ Metadata uploaded successfully!");
      console.log("   CID:", metadataHash);
      console.log("   IPFS URI:", metadataUrl);
      console.log("   Gateway URL:", metadataGatewayUrl);
      console.log("");

      setUploadState({ uploadStatus: "Preparing on-chain data..." });

      // Step 4: Prepare on-chain data
      console.log("⛓️  Step 4: Preparing on-chain data...");
      const onChainData = {
        hackathonName: data.hackathonName,
        metadataHash: metadataHash, // This is the IPFS hash containing description, eventTimeline, and image
        judges: data.judges?.filter((judge) => judge !== "") || [],
        sponsorshipEndTime: data.sponsorshipEndTime,
        hackathonStartTime: data.hackathonStartTime,
        hackathonEndTime: data.hackathonEndTime,
        stakeAmount: data.stakeAmount,
        minTeamMembers: data.minTeamMembers,
        maxTeamMembers: data.maxTeamMembers,
        minSponsorshipThreshold: data.minSponsorshipThreshold,
      };

      console.log("============================================");
      console.log("📋 FINAL DATA SUMMARY");
      console.log("============================================\n");

      console.log(
        "📦 IPFS Metadata Hash (contains description, eventTimeline, image):"
      );
      console.log("   Hash:", metadataHash);
      console.log("   IPFS URI:", metadataUrl);
      console.log("   View at:", metadataGatewayUrl);
      console.log("");

      console.log("🖼️  Image Details:");
      console.log("   Hash:", imageHash);
      console.log("   View at:", imageUrl);
      console.log("");

      console.log("⛓️  ON-CHAIN DATA (Ready for Smart Contract):");
      console.log(JSON.stringify(onChainData, null, 2));
      console.log("");

      console.log("👨‍⚖️ JUDGES (", onChainData.judges.length, "):");
      onChainData.judges.forEach((judge, index) => {
        console.log(`  ${index + 1}. ${judge}`);
      });
      console.log("");

      console.log("📅 TIMELINE:");
      console.log(
        "  Sponsorship Deadline:",
        (() => {
          const d = new Date(data.sponsorshipEndTime);
          return !isNaN(d.getTime()) ? d.toLocaleString() : "Invalid date";
        })()
      );
      console.log(
        "  Hackathon Start:",
        (() => {
          const d = new Date(data.hackathonStartTime);
          return !isNaN(d.getTime()) ? d.toLocaleString() : "Invalid date";
        })()
      );
      console.log(
        "  Hackathon End:",
        (() => {
          const d = new Date(data.hackathonEndTime);
          return !isNaN(d.getTime()) ? d.toLocaleString() : "Invalid date";
        })()
      );
      console.log("");

      console.log("💰 FINANCIAL DETAILS:");
      console.log("  Team Stake Amount:", data.stakeAmount, "ETH");
      console.log(
        "  Min Sponsorship Threshold:",
        data.minSponsorshipThreshold,
        "ETH"
      );
      console.log("  Min Team Members:", data.minTeamMembers);
      console.log("  Max Team Members:", data.maxTeamMembers);
      console.log("");

      console.log("💵 CREATION FEE:");
      console.log("  Amount: 0.02 ETH (MIN_CREATION_FEE)");
      console.log("  Refund: 80% if 100+ teams participate");
      console.log("");

      console.log("============================================");
      console.log("✅ READY TO SEND TO SMART CONTRACT");
      console.log("============================================");

      setUploadState({ uploadStatus: "Preparing blockchain transaction..." });

      // Step 5: Prepare blockchain transaction data
      console.log("⛓️  Step 5: Creating blockchain transaction...");

      // Convert times to Unix timestamps (seconds)
      // Normalize input: replace space with T for ISO format compatibility
      const normalizeDateTime = (dateStr: string) => {
        if (!dateStr) return null;
        // Replace space with T if present (e.g., "2025-12-31 23:59" -> "2025-12-31T23:59")
        const normalized = dateStr.includes(" ")
          ? dateStr.replace(" ", "T")
          : dateStr;
        const date = new Date(normalized);
        return !isNaN(date.getTime()) ? date : null;
      };

      const sponsorshipEndDate = normalizeDateTime(
        data.sponsorshipEndTime || ""
      );
      const sponsorshipEndTimestamp = sponsorshipEndDate
        ? Math.floor(sponsorshipEndDate.getTime() / 1000)
        : Math.floor(Date.now() / 1000);

      const hackathonStartDate = normalizeDateTime(
        data.hackathonStartTime || ""
      );
      const hackathonStartTimestamp = hackathonStartDate
        ? Math.floor(hackathonStartDate.getTime() / 1000)
        : Math.floor(Date.now() / 1000);

      const hackathonEndDate = normalizeDateTime(data.hackathonEndTime || "");
      const hackathonEndTimestamp = hackathonEndDate
        ? Math.floor(hackathonEndDate.getTime() / 1000)
        : Math.floor(Date.now() / 1000);

      // Filter out empty judge addresses
      const validJudges = data.judges?.filter((judge) => judge !== "") || [];

      // Convert ETH amounts to Wei (multiply by 10^18)
      const stakeAmountWei = BigInt(
        Math.floor(parseFloat(data.stakeAmount || "0") * 1e18)
      );
      const minSponsorshipThresholdWei = BigInt(
        Math.floor(parseFloat(data.minSponsorshipThreshold || "0") * 1e18)
      );

      // Hosting fee - MIN_CREATION_FEE (0.02 ETH in Wei)
      const hostingFeeWei = BigInt(Math.floor(0.02 * 1e18));

      // Convert to uint32 for team limits (contract requires uint32)
      const minTeamMembersUint32 = parseInt(data.minTeamMembers || "1");
      const maxTeamMembersUint32 = parseInt(data.maxTeamMembers || "10");

      console.log("Transaction parameters:");
      console.log("  Metadata URI (IPFS):", metadataUrl);
      console.log("  Judges:", validJudges);
      console.log("  Sponsorship End:", sponsorshipEndTimestamp);
      console.log("  Hackathon Start:", hackathonStartTimestamp);
      console.log("  Hackathon End:", hackathonEndTimestamp);
      console.log("  Stake Amount (Wei):", stakeAmountWei.toString());
      console.log("  Min Team Members (uint32):", minTeamMembersUint32);
      console.log("  Max Team Members (uint32):", maxTeamMembersUint32);
      console.log(
        "  Min Sponsorship Threshold (Wei):",
        minSponsorshipThresholdWei.toString()
      );
      console.log(
        "  Creation Fee (Wei):",
        hostingFeeWei.toString(),
        "(0.02 ETH)"
      );
      console.log("");

      // Store transaction data for TransactionButton
      setTransactionData({
        metadataUrl,
        validJudges,
        sponsorshipEndTimestamp,
        hackathonStartTimestamp,
        hackathonEndTimestamp,
        stakeAmountWei,
        minTeamMembers: minTeamMembersUint32,
        maxTeamMembers: maxTeamMembersUint32,
        minSponsorshipThresholdWei,
        hostingFeeWei,
        metadataHash,
        imageHash,
        imageUrl,
      });

      setUploadState({ uploadStatus: "Ready to submit transaction!" });
      toast.success(
        "Metadata uploaded successfully! Ready to create hackathon on blockchain."
      );
    } catch (error) {
      console.error("❌ Error during upload:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setUploadState({ uploadStatus: `Error: ${errorMessage}` });
      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setUploadState({ isUploading: false, uploadProgress: 0 });
      setTimeout(() => setUploadState({ uploadStatus: "" }), 3000);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onError = (errors: Record<string, any>) => {
    console.error("❌ Form validation failed:", errors);
    toast.error("Please check all required fields");
  };

  // Clear form data after successful transaction
  const handleTransactionSuccess = () => {
    toast.success("Hackathon created successfully!");
    resetForm();
    setTransactionData(null);
    // Optionally redirect to hackathon page
  };

  const handleTransactionError = (error: Error) => {
    toast.error("Transaction failed: " + error.message);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Create Hackathon
          </h1>
          <p className="text-muted-foreground">
            Fill in all the details to create your hackathon on the blockchain
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit, onError)}>
          <div className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Basic Information</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Provide essential details about your hackathon
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <Controller
                  name="hackathonName"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label
                        htmlFor="hackathonName"
                        className="text-base font-semibold"
                      >
                        Hackathon Name{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        {...field}
                        id="hackathonName"
                        placeholder="e.g., Web3 Innovation Hackathon 2025"
                        className="h-12 text-base"
                      />
                      {errors.hackathonName && (
                        <div className="flex items-center gap-2 text-destructive text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.hackathonName.message}</span>
                        </div>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label
                        htmlFor="description"
                        className="text-base font-semibold"
                      >
                        Description <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        {...field}
                        id="description"
                        placeholder="Describe your hackathon, its goals, themes, and what makes it special..."
                        className="min-h-32 text-base resize-none"
                      />
                      <div className="flex justify-between items-center">
                        <div>
                          {errors.description && (
                            <div className="flex items-center gap-2 text-destructive text-sm">
                              <AlertCircle className="w-4 h-4" />
                              <span>{errors.description.message}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {watchAllFields.description?.length || 0}/2000
                        </span>
                      </div>
                    </div>
                  )}
                />

                <Controller
                  name="hackathonImage"
                  control={control}
                  render={({ field: { onChange } }) => {
                    const imageError = errors.hackathonImage;
                    const errorMessage = imageError?.message
                      ? String(imageError.message)
                      : "Image is required";

                    return (
                      <div className="space-y-2">
                        <Label
                          htmlFor="hackathonImage"
                          className="text-base font-semibold"
                        >
                          Hackathon Banner Image{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer bg-muted/20">
                          <input
                            type="file"
                            id="hackathonImage"
                            accept="image/*"
                            onChange={(e) => {
                              handleImageChange(e);
                              onChange(e.target.files);
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor="hackathonImage"
                            className="cursor-pointer block"
                          >
                            {imagePreview ? (
                              <div className="space-y-4">
                                <Image
                                  src={imagePreview}
                                  alt="Preview"
                                  width={256}
                                  height={256}
                                  className="mx-auto max-h-64 rounded-lg object-cover"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  Change Image
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <Upload className="w-16 h-16 mx-auto text-muted-foreground" />
                                <div>
                                  <p className="text-base font-medium">
                                    Click to upload or drag and drop
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    PNG, JPG, GIF up to 10MB
                                  </p>
                                </div>
                              </div>
                            )}
                          </label>
                        </div>
                        {imageError && (
                          <div className="flex items-center gap-2 text-destructive text-sm">
                            <AlertCircle className="w-4 h-4" />
                            <span>{errorMessage}</span>
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
              </CardContent>
            </Card>

            {/* Judge Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Judge Panel</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Add Ethereum wallet addresses for judges (minimum 5 required)
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <Controller
                      key={field.id}
                      name={`judges.${index}`}
                      control={control}
                      render={({ field }) => (
                        <div className="flex gap-2">
                          <div className="flex-1 space-y-1">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
                                #{index + 1}
                              </span>
                              <Input
                                {...field}
                                placeholder="0x..."
                                className="h-12 pl-12 font-mono text-sm"
                              />
                            </div>
                            {errors.judges?.[index] && (
                              <div className="flex items-center gap-2 text-destructive text-xs">
                                <AlertCircle className="w-3 h-3" />
                                <span>{errors.judges[index]?.message}</span>
                              </div>
                            )}
                          </div>
                          {fields.length > 5 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                              className="h-12 w-12 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    />
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append("")}
                  className="w-full h-12"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Judge
                </Button>

                {errors.judges && typeof errors.judges.message === "string" && (
                  <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.judges.message}</span>
                  </div>
                )}

                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <p className="text-sm text-foreground flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {
                        fields.filter((f) =>
                          watch(`judges.${fields.indexOf(f)}`)
                        ).length
                      }
                    </span>
                    judges added{" "}
                    {fields.length >= 5 && (
                      <Check className="w-4 h-4 text-success ml-auto" />
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Event Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Event Timeline</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure sponsorship deadline and hackathon schedule
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <Controller
                  name="sponsorshipEndTime"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label
                        htmlFor="sponsorshipEndTime"
                        className="text-base font-semibold"
                      >
                        Sponsorship Deadline{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="text"
                        id="sponsorshipEndTime"
                        placeholder="e.g., 2025-12-31 23:59 or 2025-12-31T23:59"
                        {...field}
                        className="w-full h-12"
                      />
                      <p className="text-xs text-muted-foreground">
                        Format: YYYY-MM-DD HH:MM (e.g., 2025-12-31 23:59)
                      </p>
                      {errors.sponsorshipEndTime && (
                        <div className="flex items-center gap-2 text-destructive text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>
                            {String(errors.sponsorshipEndTime.message)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="hackathonStartTime"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label
                        htmlFor="hackathonStartTime"
                        className="text-base font-semibold"
                      >
                        Hackathon Start Time{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="text"
                        id="hackathonStartTime"
                        placeholder="e.g., 2026-01-01 00:00 or 2026-01-01T00:00"
                        {...field}
                        className="w-full h-12"
                      />
                      <p className="text-xs text-muted-foreground">
                        Format: YYYY-MM-DD HH:MM (e.g., 2026-01-01 00:00)
                      </p>
                      {errors.hackathonStartTime && (
                        <div className="flex items-center gap-2 text-destructive text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>
                            {String(errors.hackathonStartTime.message)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="hackathonEndTime"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label
                        htmlFor="hackathonEndTime"
                        className="text-base font-semibold"
                      >
                        Hackathon End Time{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="text"
                        id="hackathonEndTime"
                        placeholder="e.g., 2026-01-07 23:59 or 2026-01-07T23:59"
                        {...field}
                        className="w-full h-12"
                      />
                      <p className="text-xs text-muted-foreground">
                        Format: YYYY-MM-DD HH:MM (e.g., 2026-01-07 23:59)
                      </p>
                      {errors.hackathonEndTime && (
                        <div className="flex items-center gap-2 text-destructive text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{String(errors.hackathonEndTime.message)}</span>
                        </div>
                      )}
                    </div>
                  )}
                />

                {watchAllFields.sponsorshipEndTime &&
                  watchAllFields.hackathonStartTime &&
                  watchAllFields.hackathonEndTime && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <p className="text-sm text-foreground font-medium mb-2">
                        Timeline Summary:
                      </p>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>
                          Duration:{" "}
                          {(() => {
                            const endDate = new Date(
                              watchAllFields.hackathonEndTime
                            );
                            const startDate = new Date(
                              watchAllFields.hackathonStartTime
                            );
                            if (
                              !isNaN(endDate.getTime()) &&
                              !isNaN(startDate.getTime())
                            ) {
                              return Math.ceil(
                                (endDate.getTime() - startDate.getTime()) /
                                  (1000 * 60 * 60 * 24)
                              );
                            }
                            return 0;
                          })()}{" "}
                          days
                        </p>
                        <p>
                          Sponsorship window:{" "}
                          {(() => {
                            const endDate = new Date(
                              watchAllFields.sponsorshipEndTime
                            );
                            if (!isNaN(endDate.getTime())) {
                              return Math.ceil(
                                (endDate.getTime() - Date.now()) /
                                  (1000 * 60 * 60 * 24)
                              );
                            }
                            return 0;
                          })()}{" "}
                          days from now
                        </p>
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Financial Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Financial Terms</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Define stakes, fees, and team participation limits
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Controller
                    name="stakeAmount"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label
                          htmlFor="stakeAmount"
                          className="text-base font-semibold"
                        >
                          Team Stake Amount{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            {...field}
                            id="stakeAmount"
                            type="number"
                            step="0.001"
                            placeholder="0.1"
                            className="h-12 pr-16"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                            ETH
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Amount each team must stake to participate
                        </p>
                        {errors.stakeAmount && (
                          <div className="flex items-center gap-2 text-destructive text-sm">
                            <AlertCircle className="w-4 h-4" />
                            <span>{errors.stakeAmount.message}</span>
                          </div>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="minSponsorshipThreshold"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label
                          htmlFor="minSponsorshipThreshold"
                          className="text-base font-semibold"
                        >
                          Min Sponsorship{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            {...field}
                            id="minSponsorshipThreshold"
                            type="number"
                            step="0.001"
                            placeholder="0.05"
                            className="h-12 pr-16"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                            ETH
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Minimum amount per sponsor
                        </p>
                        {errors.minSponsorshipThreshold && (
                          <div className="flex items-center gap-2 text-destructive text-sm">
                            <AlertCircle className="w-4 h-4" />
                            <span>
                              {errors.minSponsorshipThreshold.message}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="minTeamMembers"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label
                          htmlFor="minTeamMembers"
                          className="text-base font-semibold"
                        >
                          Min Team Members{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          {...field}
                          id="minTeamMembers"
                          type="number"
                          placeholder="2"
                          className="h-12"
                        />
                        <p className="text-xs text-muted-foreground">
                          Minimum members per team
                        </p>
                        {errors.minTeamMembers && (
                          <div className="flex items-center gap-2 text-destructive text-sm">
                            <AlertCircle className="w-4 h-4" />
                            <span>{errors.minTeamMembers.message}</span>
                          </div>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="maxTeamMembers"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label
                          htmlFor="maxTeamMembers"
                          className="text-base font-semibold"
                        >
                          Max Team Members{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          {...field}
                          id="maxTeamMembers"
                          type="number"
                          placeholder="10"
                          className="h-12"
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum members per team
                        </p>
                        {errors.maxTeamMembers && (
                          <div className="flex items-center gap-2 text-destructive text-sm">
                            <AlertCircle className="w-4 h-4" />
                            <span>{errors.maxTeamMembers.message}</span>
                          </div>
                        )}
                      </div>
                    )}
                  />
                </div>

                {watchAllFields.stakeAmount && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <p className="text-sm text-foreground font-medium mb-2">
                      Team Stake Amount:
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {parseFloat(watchAllFields.stakeAmount || "0").toFixed(3)}{" "}
                      ETH
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Per team participation stake
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Timeline Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">
                      Event Timeline Details
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Define what happens at each stage of your hackathon
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendTimeline({
                        eventName: "",
                        eventDate: "",
                        eventDescription: "",
                      })
                    }
                    className="h-9"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Event
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timelineFields.map((field, index) => (
                    <Card key={field.id} className="border-2">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-sm font-semibold text-muted-foreground">
                            Event #{index + 1}
                          </h3>
                          {timelineFields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTimeline(index)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <Controller
                            name={`eventTimeline.${index}.eventName`}
                            control={control}
                            render={({ field }) => (
                              <div className="space-y-2">
                                <Label htmlFor={`eventName-${index}`}>
                                  Event Name{" "}
                                  <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  {...field}
                                  id={`eventName-${index}`}
                                  placeholder="e.g., Registration Opens"
                                  className="h-11"
                                />
                                {errors.eventTimeline?.[index]?.eventName && (
                                  <div className="flex items-center gap-2 text-destructive text-xs">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>
                                      {
                                        errors.eventTimeline[index]?.eventName
                                          ?.message
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          />

                          <Controller
                            name={`eventTimeline.${index}.eventDate`}
                            control={control}
                            render={({ field }) => (
                              <div className="space-y-2">
                                <Label htmlFor={`eventDate-${index}`}>
                                  Date & Time{" "}
                                  <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  type="datetime-local"
                                  id={`eventDate-${index}`}
                                  value={
                                    field.value
                                      ? (() => {
                                          const d = new Date(field.value);
                                          if (!isNaN(d.getTime())) {
                                            const year = d.getFullYear();
                                            const month = String(
                                              d.getMonth() + 1
                                            ).padStart(2, "0");
                                            const day = String(
                                              d.getDate()
                                            ).padStart(2, "0");
                                            const hours = String(
                                              d.getHours()
                                            ).padStart(2, "0");
                                            const minutes = String(
                                              d.getMinutes()
                                            ).padStart(2, "0");
                                            return `${year}-${month}-${day}T${hours}:${minutes}`;
                                          }
                                          return "";
                                        })()
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value) {
                                      const date = new Date(value);
                                      field.onChange(date.toISOString());
                                    } else {
                                      field.onChange("");
                                    }
                                  }}
                                  className="w-full h-11"
                                />
                                {errors.eventTimeline?.[index]?.eventDate && (
                                  <div className="flex items-center gap-2 text-destructive text-xs">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>
                                      {
                                        errors.eventTimeline[index]?.eventDate
                                          ?.message
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          />

                          <Controller
                            name={`eventTimeline.${index}.eventDescription`}
                            control={control}
                            render={({ field }) => (
                              <div className="space-y-2 md:col-span-2">
                                <Label htmlFor={`eventDescription-${index}`}>
                                  Description{" "}
                                  <span className="text-destructive">*</span>
                                </Label>
                                <Textarea
                                  {...field}
                                  id={`eventDescription-${index}`}
                                  placeholder="Describe what happens at this stage..."
                                  className="min-h-20 resize-none"
                                />
                                {errors.eventTimeline?.[index]
                                  ?.eventDescription && (
                                  <div className="flex items-center gap-2 text-destructive text-xs">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>
                                      {
                                        errors.eventTimeline[index]
                                          ?.eventDescription?.message
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {errors.eventTimeline &&
                  typeof errors.eventTimeline.message === "string" && (
                    <div className="flex items-center gap-2 text-destructive text-sm mt-4">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.eventTimeline.message}</span>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Hosting Fee Notice */}
            <Card className="border-2 border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-1">
                        Hosting Fee Required
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        To host this hackathon, you must pay a hosting fee
                      </p>
                    </div>
                    <div className="bg-background rounded-lg p-4 space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-primary">
                          0.02 ETH
                        </span>
                        <span className="text-sm text-muted-foreground">
                          hosting fee
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-foreground">
                          <Check className="w-4 h-4 text-success" />
                          <span>
                            <span className="font-semibold">80% refunded</span>{" "}
                            if <span className="font-semibold">100+ teams</span>{" "}
                            submit projects
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <AlertCircle className="w-4 h-4" />
                          <span>
                            Ensures commitment to hosting a successful event
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              {isUploading && (
                <div className="flex-1">
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span className="text-sm font-medium">
                        {uploadStatus}
                      </span>
                    </div>
                    {uploadProgress > 0 && (
                      <div className="w-full bg-muted-foreground/20 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!transactionData && (
                <Button
                  type="submit"
                  size="lg"
                  disabled={isUploading}
                  className="min-w-[200px]"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Preparing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload to IPFS
                    </>
                  )}
                </Button>
              )}

              {transactionData && (
                <TransactionButton
                  transaction={() =>
                    prepareContractCall({
                      contract: mainContract,
                      method:
                        "function createHackathon(string calldata metadataURI, address[] calldata judges, uint256 sponsorshipEnd, uint256 hackStart, uint256 hackEnd, uint256 stakeAmount, uint32 minTeams, uint32 maxTeams, uint256 minSponsorshipThreshold) external payable returns (uint256 id)",
                      params: [
                        transactionData.metadataUrl,
                        transactionData.validJudges,
                        BigInt(transactionData.sponsorshipEndTimestamp),
                        BigInt(transactionData.hackathonStartTimestamp),
                        BigInt(transactionData.hackathonEndTimestamp),
                        transactionData.stakeAmountWei,
                        transactionData.minTeamMembers,
                        transactionData.maxTeamMembers,
                        transactionData.minSponsorshipThresholdWei,
                      ],
                      value: transactionData.hostingFeeWei,
                    })
                  }
                  onTransactionSent={(result) => {
                    console.log("Transaction sent:", result);
                    toast.info("Transaction submitted to blockchain...");
                  }}
                  onTransactionConfirmed={(receipt) => {
                    console.log("Transaction confirmed:", receipt);
                    handleTransactionSuccess();
                  }}
                  onError={(error) => {
                    console.error("Transaction error:", error);
                    handleTransactionError(error);
                  }}
                  className="min-w-[200px]"
                >
                  Create Hackathon (0.02 ETH)
                </TransactionButton>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateHackathonForm;
