"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Upload,
  X,
  Plus,
  Check,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Menu,
  CalendarIcon,
} from "lucide-react";

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
  const [step, setStep] = useState(1);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
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

  // Debug: Check API key on mount
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY;
    console.log(
      "🔑 API Key check:",
      apiKey ? `Found: ${apiKey.substring(0, 10)}...` : "❌ NOT FOUND!"
    );
    console.log(
      "📋 All env vars:",
      Object.keys(process.env).filter((k) => k.includes("LIGHTHOUSE"))
    );
  }, []);

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

  const validateCurrentStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];

    switch (step) {
      case 1:
        fieldsToValidate = ["hackathonName", "description", "hackathonImage"];
        break;
      case 2:
        fieldsToValidate = ["judges"];
        break;
      case 3:
        fieldsToValidate = [
          "sponsorshipEndTime",
          "hackathonStartTime",
          "hackathonEndTime",
        ];
        break;
      case 4:
        fieldsToValidate = [
          "stakeAmount",
          "minTeamMembers",
          "maxTeamMembers",
          "minSponsorshipThreshold",
          "eventTimeline",
        ];
        break;
    }

    const result = await trigger(fieldsToValidate);
    return result;
  };

  const nextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      setStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: FormData) => {
    console.log("🎯 onSubmit called! Form data:", data);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("Initializing upload...");

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
      setUploadStatus("Uploading image to IPFS...");

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
            setUploadProgress(percentCompleted);
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

      setUploadProgress(0);
      setUploadStatus("Creating metadata...");

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
      setUploadStatus("Uploading metadata to IPFS...");

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
      const metadataUrl = `https://gateway.pinata.cloud/ipfs/${metadataHash}`;
      console.log("✅ Metadata uploaded successfully!");
      console.log("   CID:", metadataHash);
      console.log("   URL:", metadataUrl);
      console.log("");

      setUploadStatus("Preparing on-chain data...");

      // Step 4: Prepare on-chain data
      console.log("⛓️  Step 4: Preparing on-chain data...");
      const onChainData = {
        hackathonName: data.hackathonName,
        metadataHash: metadataHash, // This is the IPFS hash containing description, eventTimeline, and image
        judges: data.judges.filter((judge) => judge !== ""),
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
      console.log("   View at:", metadataUrl);
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
        new Date(data.sponsorshipEndTime).toLocaleString()
      );
      console.log(
        "  Hackathon Start:",
        new Date(data.hackathonStartTime).toLocaleString()
      );
      console.log(
        "  Hackathon End:",
        new Date(data.hackathonEndTime).toLocaleString()
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

      console.log("💵 HOSTING FEE:");
      console.log("  Amount: 0.1 ETH");
      console.log("  Refund: 80% if 100+ teams submit projects");
      console.log("");

      console.log("============================================");
      console.log("✅ READY TO SEND TO SMART CONTRACT");
      console.log("============================================");

      setUploadStatus("Upload complete!");

      alert(
        `✅ Hackathon data prepared successfully!\n\n` +
          `📦 IPFS Metadata Hash:\n${metadataHash}\n\n` +
          `🖼️ Image Hash:\n${imageHash}\n\n` +
          `View image at:\n${imageUrl}\n\n` +
          `Check console for full details.`
      );
    } catch (error) {
      console.error("❌ Error during upload:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setUploadStatus(`Error: ${errorMessage}`);

      alert(
        `❌ Upload failed!\n\nError: ${errorMessage}\n\n` +
          `Common issues:\n` +
          `1. Check if NEXT_PUBLIC_LIGHTHOUSE_API_KEY is set in .env\n` +
          `2. Restart dev server after changing .env\n` +
          `3. Check internet connection\n` +
          `4. Verify API key is valid\n\n` +
          `Check console for details.`
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setTimeout(() => setUploadStatus(""), 3000);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onError = (errors: Record<string, any>) => {
    console.error("❌ Form validation failed:", errors);
    alert(
      `Form validation failed!\n\n` +
        `Please check all required fields:\n` +
        Object.keys(errors)
          .map((key) => `- ${key}: ${errors[key]?.message || "Invalid"}`)
          .join("\n")
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-semibold text-foreground">
                Basic Information
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Provide essential details about your hackathon
              </p>
            </div>

            <Controller
              name="hackathonName"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label
                    htmlFor="hackathonName"
                    className="text-base font-semibold"
                  >
                    Hackathon Name <span className="text-destructive">*</span>
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
                            <Button type="button" variant="outline" size="sm">
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
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-semibold text-foreground">
                Judge Panel
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Add Ethereum wallet addresses for judges (minimum 5 required)
              </p>
            </div>

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
                    fields.filter((f) => watch(`judges.${fields.indexOf(f)}`))
                      .length
                  }
                </span>
                judges added{" "}
                {fields.length >= 5 && (
                  <Check className="w-4 h-4 text-green-500 ml-auto" />
                )}
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-semibold text-foreground">
                Event Timeline
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure sponsorship deadline and hackathon schedule
              </p>
            </div>

            <div className="space-y-6">
              <Controller
                name="sponsorshipEndTime"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label
                      htmlFor="sponsorshipEndTime"
                      className="text-base font-semibold flex items-center gap-2"
                    >
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">
                        1
                      </span>
                      Sponsorship Deadline{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-12 justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(new Date(field.value), "PPP p")
                          ) : (
                            <span className="text-muted-foreground">
                              Pick date and time
                            </span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              const hours = field.value
                                ? new Date(field.value).getHours()
                                : 12;
                              const minutes = field.value
                                ? new Date(field.value).getMinutes()
                                : 0;
                              date.setHours(hours, minutes);
                              field.onChange(date.toISOString());
                            }
                          }}
                          initialFocus
                        />
                        <div className="p-3 border-t">
                          <Label className="text-xs text-muted-foreground mb-2 block">
                            Time
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="HH"
                              min="0"
                              max="23"
                              value={
                                field.value
                                  ? new Date(field.value).getHours()
                                  : ""
                              }
                              onChange={(e) => {
                                const date = field.value
                                  ? new Date(field.value)
                                  : new Date();
                                date.setHours(parseInt(e.target.value) || 0);
                                field.onChange(date.toISOString());
                              }}
                              className="h-9"
                            />
                            <span className="flex items-center">:</span>
                            <Input
                              type="number"
                              placeholder="MM"
                              min="0"
                              max="59"
                              value={
                                field.value
                                  ? new Date(field.value).getMinutes()
                                  : ""
                              }
                              onChange={(e) => {
                                const date = field.value
                                  ? new Date(field.value)
                                  : new Date();
                                date.setMinutes(parseInt(e.target.value) || 0);
                                field.onChange(date.toISOString());
                              }}
                              className="h-9"
                            />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">
                      When sponsors must commit funding
                    </p>
                    {errors.sponsorshipEndTime && (
                      <div className="flex items-center gap-2 text-destructive text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.sponsorshipEndTime.message}</span>
                      </div>
                    )}
                  </div>
                )}
              />

              <div className="flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-muted-foreground" />
              </div>

              <Controller
                name="hackathonStartTime"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label
                      htmlFor="hackathonStartTime"
                      className="text-base font-semibold flex items-center gap-2"
                    >
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">
                        2
                      </span>
                      Hackathon Start Time{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-12 justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(new Date(field.value), "PPP p")
                          ) : (
                            <span className="text-muted-foreground">
                              Pick date and time
                            </span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              const hours = field.value
                                ? new Date(field.value).getHours()
                                : 12;
                              const minutes = field.value
                                ? new Date(field.value).getMinutes()
                                : 0;
                              date.setHours(hours, minutes);
                              field.onChange(date.toISOString());
                            }
                          }}
                          initialFocus
                        />
                        <div className="p-3 border-t">
                          <Label className="text-xs text-muted-foreground mb-2 block">
                            Time
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="HH"
                              min="0"
                              max="23"
                              value={
                                field.value
                                  ? new Date(field.value).getHours()
                                  : ""
                              }
                              onChange={(e) => {
                                const date = field.value
                                  ? new Date(field.value)
                                  : new Date();
                                date.setHours(parseInt(e.target.value) || 0);
                                field.onChange(date.toISOString());
                              }}
                              className="h-9"
                            />
                            <span className="flex items-center">:</span>
                            <Input
                              type="number"
                              placeholder="MM"
                              min="0"
                              max="59"
                              value={
                                field.value
                                  ? new Date(field.value).getMinutes()
                                  : ""
                              }
                              onChange={(e) => {
                                const date = field.value
                                  ? new Date(field.value)
                                  : new Date();
                                date.setMinutes(parseInt(e.target.value) || 0);
                                field.onChange(date.toISOString());
                              }}
                              className="h-9"
                            />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">
                      When participants begin building
                    </p>
                    {errors.hackathonStartTime && (
                      <div className="flex items-center gap-2 text-destructive text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.hackathonStartTime.message}</span>
                      </div>
                    )}
                  </div>
                )}
              />

              <div className="flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-muted-foreground" />
              </div>

              <Controller
                name="hackathonEndTime"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label
                      htmlFor="hackathonEndTime"
                      className="text-base font-semibold flex items-center gap-2"
                    >
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">
                        3
                      </span>
                      Hackathon End Time{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-12 justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(new Date(field.value), "PPP p")
                          ) : (
                            <span className="text-muted-foreground">
                              Pick date and time
                            </span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              const hours = field.value
                                ? new Date(field.value).getHours()
                                : 12;
                              const minutes = field.value
                                ? new Date(field.value).getMinutes()
                                : 0;
                              date.setHours(hours, minutes);
                              field.onChange(date.toISOString());
                            }
                          }}
                          initialFocus
                        />
                        <div className="p-3 border-t">
                          <Label className="text-xs text-muted-foreground mb-2 block">
                            Time
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="HH"
                              min="0"
                              max="23"
                              value={
                                field.value
                                  ? new Date(field.value).getHours()
                                  : ""
                              }
                              onChange={(e) => {
                                const date = field.value
                                  ? new Date(field.value)
                                  : new Date();
                                date.setHours(parseInt(e.target.value) || 0);
                                field.onChange(date.toISOString());
                              }}
                              className="h-9"
                            />
                            <span className="flex items-center">:</span>
                            <Input
                              type="number"
                              placeholder="MM"
                              min="0"
                              max="59"
                              value={
                                field.value
                                  ? new Date(field.value).getMinutes()
                                  : ""
                              }
                              onChange={(e) => {
                                const date = field.value
                                  ? new Date(field.value)
                                  : new Date();
                                date.setMinutes(parseInt(e.target.value) || 0);
                                field.onChange(date.toISOString());
                              }}
                              className="h-9"
                            />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">
                      Final submission deadline
                    </p>
                    {errors.hackathonEndTime && (
                      <div className="flex items-center gap-2 text-destructive text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.hackathonEndTime.message}</span>
                      </div>
                    )}
                  </div>
                )}
              />
            </div>

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
                      {Math.ceil(
                        (new Date(watchAllFields.hackathonEndTime).getTime() -
                          new Date(
                            watchAllFields.hackathonStartTime
                          ).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      days
                    </p>
                    <p>
                      Sponsorship window:{" "}
                      {Math.ceil(
                        (new Date(watchAllFields.sponsorshipEndTime).getTime() -
                          Date.now()) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      days from now
                    </p>
                  </div>
                </div>
              )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-semibold text-foreground">
                Financial Terms
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Define stakes, fees, and team participation limits
              </p>
            </div>

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
                        <span>{errors.minSponsorshipThreshold.message}</span>
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">
                    Event Timeline <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
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
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-full h-11 justify-start text-left font-normal"
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? (
                                      format(new Date(field.value), "PPP p")
                                    ) : (
                                      <span className="text-muted-foreground">
                                        Pick date and time
                                      </span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-0"
                                  align="start"
                                >
                                  <Calendar
                                    mode="single"
                                    selected={
                                      field.value
                                        ? new Date(field.value)
                                        : undefined
                                    }
                                    onSelect={(date) => {
                                      if (date) {
                                        const hours = field.value
                                          ? new Date(field.value).getHours()
                                          : 12;
                                        const minutes = field.value
                                          ? new Date(field.value).getMinutes()
                                          : 0;
                                        date.setHours(hours, minutes);
                                        field.onChange(date.toISOString());
                                      }
                                    }}
                                    initialFocus
                                  />
                                  <div className="p-3 border-t">
                                    <Label className="text-xs text-muted-foreground mb-2 block">
                                      Time
                                    </Label>
                                    <div className="flex gap-2">
                                      <Input
                                        type="number"
                                        placeholder="HH"
                                        min="0"
                                        max="23"
                                        value={
                                          field.value
                                            ? new Date(field.value).getHours()
                                            : ""
                                        }
                                        onChange={(e) => {
                                          const date = field.value
                                            ? new Date(field.value)
                                            : new Date();
                                          date.setHours(
                                            parseInt(e.target.value) || 0
                                          );
                                          field.onChange(date.toISOString());
                                        }}
                                        className="h-9"
                                      />
                                      <span className="flex items-center">
                                        :
                                      </span>
                                      <Input
                                        type="number"
                                        placeholder="MM"
                                        min="0"
                                        max="59"
                                        value={
                                          field.value
                                            ? new Date(field.value).getMinutes()
                                            : ""
                                        }
                                        onChange={(e) => {
                                          const date = field.value
                                            ? new Date(field.value)
                                            : new Date();
                                          date.setMinutes(
                                            parseInt(e.target.value) || 0
                                          );
                                          field.onChange(date.toISOString());
                                        }}
                                        className="h-9"
                                      />
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
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
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.eventTimeline.message}</span>
                  </div>
                )}
            </div>

            {watchAllFields.stakeAmount && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-foreground font-medium mb-2">
                  Team Stake Amount:
                </p>
                <p className="text-2xl font-bold text-primary">
                  {parseFloat(watchAllFields.stakeAmount || "0").toFixed(3)} ETH
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Per team participation stake
                </p>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-8">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-semibold text-foreground">
                Final Review
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Review all information before submitting
              </p>
            </div>

            <div className="space-y-4">
              {imagePreview && (
                <Card>
                  <CardContent className="pt-6">
                    <Image
                      src={imagePreview}
                      alt="Hackathon banner"
                      width={512}
                      height={192}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-semibold">
                      {watchAllFields.hackathonName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm">{watchAllFields.description}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    Judges (
                    {fields.filter((_, i) => watch(`judges.${i}`)).length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {fields.map((field, index) => {
                      const value = watch(`judges.${index}`);
                      return value ? (
                        <div
                          key={field.id}
                          className="flex items-center gap-2 text-sm font-mono bg-muted p-2 rounded"
                        >
                          <span className="text-muted-foreground">
                            #{index + 1}
                          </span>
                          <span className="truncate">{value}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Sponsorship Deadline
                    </p>
                    <p className="font-semibold">
                      {new Date(
                        watchAllFields.sponsorshipEndTime
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Hackathon Start
                    </p>
                    <p className="font-semibold">
                      {new Date(
                        watchAllFields.hackathonStartTime
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Hackathon End
                    </p>
                    <p className="font-semibold">
                      {new Date(
                        watchAllFields.hackathonEndTime
                      ).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Team Stake</p>
                    <p className="font-semibold">
                      {watchAllFields.stakeAmount} ETH
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Min Sponsorship
                    </p>
                    <p className="font-semibold">
                      {watchAllFields.minSponsorshipThreshold} ETH
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Team Members Range
                    </p>
                    <p className="font-semibold">
                      {watchAllFields.minTeamMembers} -{" "}
                      {watchAllFields.maxTeamMembers} members
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    Event Timeline ({watchAllFields.eventTimeline?.length || 0}{" "}
                    Events)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {watchAllFields.eventTimeline?.map((event, index) => (
                      <div
                        key={index}
                        className="border-l-4 border-primary pl-4 py-2"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground mb-1">
                              {event.eventName || "Unnamed Event"}
                            </h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {event.eventDate
                                ? new Date(event.eventDate).toLocaleString()
                                : "No date set"}
                            </p>
                            <p className="text-sm text-foreground">
                              {event.eventDescription || "No description"}
                            </p>
                          </div>
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
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
                          To host this hackathon, you must stake a hosting fee
                        </p>
                      </div>
                      <div className="bg-background rounded-lg p-4 space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-primary">
                            0.1 ETH
                          </span>
                          <span className="text-sm text-muted-foreground">
                            hosting stake
                          </span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2 text-foreground">
                            <Check className="w-4 h-4 text-green-500" />
                            <span>
                              <span className="font-semibold">
                                80% refunded
                              </span>{" "}
                              if{" "}
                              <span className="font-semibold">100+ teams</span>{" "}
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
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Mobile Header with Progress */}
      <div className="lg:hidden sticky top-0 z-20 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Create Hackathon
            </h1>
            <p className="text-xs text-muted-foreground">Step {step} of 5</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Vertical Sidebar Progress */}
      <div
        className={`fixed lg:sticky left-0 top-0 h-screen w-72 bg-card border-r border-border p-6 flex flex-col z-40 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8">
          <div className="flex items-center justify-between lg:block">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Create Hackathon
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Complete all steps to launch
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto">
          {steps.map((s) => (
            <div key={s.id} className="relative">
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      s.id === step
                        ? "bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/20"
                        : s.id < step
                        ? "bg-primary/90 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s.id < step ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span>{s.id}</span>
                    )}
                  </div>
                  {s.id !== steps.length && (
                    <div
                      className={`absolute left-5 top-10 w-0.5 h-12 ${
                        s.id < step ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <p
                    className={`text-sm font-semibold ${
                      s.id === step
                        ? "text-foreground"
                        : s.id < step
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {s.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-6 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-foreground">
              {Math.round((step / 5) * 100)}%
            </span>
          </div>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-0 w-full">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 sm:p-8 lg:p-10">
              <form onSubmit={handleSubmit(onSubmit, onError)}>
                {renderStepContent()}

                {/* Navigation Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-between mt-8 lg:mt-10 pt-6 lg:pt-8 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={step === 1}
                    className="h-11 px-6 w-full sm:w-auto"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>

                  {step < 5 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="h-11 px-8 w-full sm:w-auto"
                      disabled={isUploading}
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="h-11 px-8 w-full sm:w-auto"
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          {uploadStatus || "Uploading..."}{" "}
                          {uploadProgress > 0 && `${uploadProgress}%`}
                        </>
                      ) : (
                        <>
                          Create Hackathon
                          <Check className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateHackathonForm;
