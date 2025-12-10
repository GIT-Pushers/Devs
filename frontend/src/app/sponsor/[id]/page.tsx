"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Upload,
  Globe,
  Coins,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { mainContract } from "@/constants/contracts";
import { prepareContractCall } from "thirdweb";
import { TransactionButton } from "thirdweb/react";
import { useReadContract } from "thirdweb/react";

interface SponsorFormData {
  companyName: string;
  companyLogo: FileList | null;
  companyDescription: string;
  sponsorshipAmount: string;
  website: string;
}

export default function SponsorPage() {
  const params = useParams();
  const router = useRouter();
  const hackathonId = params.id as string;

  const [formData, setFormData] = useState<SponsorFormData>({
    companyName: "",
    companyLogo: null,
    companyDescription: "",
    sponsorshipAmount: "",
    website: "",
  });

  const [logoPreview, setLogoPreview] = useState<string>("");
  const [errors, setErrors] = useState<
    Partial<Record<keyof SponsorFormData, string>>
  >({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [metadataUrl, setMetadataUrl] = useState<string>("");
  const [sponsorshipAmountWei, setSponsorshipAmountWei] = useState<bigint>(
    BigInt(0)
  );
  const [status, setStatus] = useState<
    "idle" | "uploading" | "ready" | "success" | "error"
  >("idle");

  // Fetch hackathon details to get minimum sponsorship threshold
  const { data: hackathon, isLoading: loadingHackathon } = useReadContract({
    contract: mainContract,
    method:
      "function hackathons(uint256) view returns (uint256 id, address organizer, uint256 sponsorshipStart, uint256 sponsorshipEnd, uint256 hackStart, uint256 hackEnd, uint256 stakeAmount, uint32 minTeams, uint32 maxTeams, uint256 creationFee, bool creationFeeRefunded, string metadataURI, uint256 totalSponsorshipAmount, uint256 minSponsorshipThreshold, bool finalized)",
    params: [BigInt(hackathonId)],
  });

  const minSponsorshipThreshold = hackathon
    ? Number(hackathon[13]) / 1e18
    : 0.05;

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setFormData({ ...formData, companyLogo: files });

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!formData.companyName.trim())
      newErrors.companyName = "Company name is required";
    if (!formData.companyLogo) newErrors.companyLogo = "Logo is required";
    if (!formData.companyDescription.trim())
      newErrors.companyDescription = "Description is required";

    // Amount validation
    if (!formData.sponsorshipAmount) {
      newErrors.sponsorshipAmount = "Sponsorship amount is required";
    } else {
      const amount = parseFloat(formData.sponsorshipAmount);
      if (amount <= 0) {
        newErrors.sponsorshipAmount = "Amount must be greater than 0";
      } else if (amount < minSponsorshipThreshold) {
        newErrors.sponsorshipAmount = `Amount must be at least ${minSponsorshipThreshold} ETH`;
      }
    }

    if (
      formData.website &&
      !formData.website.startsWith("http://") &&
      !formData.website.startsWith("https://")
    ) {
      newErrors.website = "Website must start with http:// or https://";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUploadToIPFS = async () => {
    if (!validate()) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("Initializing upload...");
    setStatus("uploading");

    try {
      const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;

      if (!PINATA_JWT) {
        throw new Error("Pinata JWT not found");
      }

      // Step 1: Upload Logo to IPFS
      setUploadStatus("Uploading logo to IPFS...");
      const logoFile = formData.companyLogo![0];

      const logoFormData = new FormData();
      logoFormData.append("file", logoFile);

      const logoUploadResponse = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        logoFormData,
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
          },
        }
      );

      const logoHash = logoUploadResponse.data.IpfsHash;
      const logoUrl = `https://gateway.pinata.cloud/ipfs/${logoHash}`;

      console.log("✅ Logo uploaded:", logoHash);

      // Step 2: Create metadata JSON
      setUploadStatus("Creating metadata...");
      setUploadProgress(0);

      const metadata = {
        companyName: formData.companyName,
        companyDescription: formData.companyDescription,
        website: formData.website,
        logoHash: logoHash,
        logoUrl: logoUrl,
        sponsorshipAmount: formData.sponsorshipAmount,
        timestamp: Date.now(),
      };

      console.log("Metadata:", metadata);

      // Step 3: Upload metadata JSON to IPFS
      setUploadStatus("Uploading metadata to IPFS...");

      const metadataBlob = new Blob([JSON.stringify(metadata)], {
        type: "application/json",
      });
      const metadataFile = new File([metadataBlob], "sponsor-metadata.json", {
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
        }
      );

      const metadataHash = metadataUploadResponse.data.IpfsHash;
      const metadataUri = `ipfs://${metadataHash}`;

      console.log("✅ Metadata uploaded:", metadataHash);
      console.log("   IPFS URI:", metadataUri);

      // Convert ETH to Wei
      const amountWei = BigInt(
        Math.floor(parseFloat(formData.sponsorshipAmount) * 1e18)
      );

      setMetadataUrl(metadataUri);
      setSponsorshipAmountWei(amountWei);
      setUploadStatus("Ready to submit sponsorship!");
      setStatus("ready");

      toast.success("Metadata uploaded successfully!");
    } catch (error) {
      console.error("❌ Error during upload:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setUploadStatus(`Error: ${errorMessage}`);
      setStatus("error");
      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleTransactionSuccess = () => {
    setStatus("success");
    toast.success("Sponsorship submitted successfully!");
  };

  const handleTransactionError = (error: Error) => {
    setStatus("error");
    toast.error("Transaction failed: " + error.message);
  };

  if (status === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full border-2 border-primary/20">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">
              Sponsorship Successful!
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Thank you for sponsoring this hackathon!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Company:</span>
                <span className="font-semibold">{formData.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-semibold">
                  {formData.sponsorshipAmount} ETH
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hackathon ID:</span>
                <span className="font-semibold">#{hackathonId}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/home/${hackathonId}`)}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Hackathon
            </Button>
            <Button onClick={() => router.push("/home")} className="flex-1">
              View All Hackathons
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push(`/home/${hackathonId}`)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Hackathon
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Sponsor Hackathon</h1>
          <p className="text-muted-foreground">
            Support this hackathon and get visibility for your brand
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUploadToIPFS();
          }}
        >
          <div className="space-y-6">
            {/* Company Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Tell us about your company</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="e.g., Acme Corporation"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    className="h-12"
                  />
                  {errors.companyName && (
                    <div className="flex items-center gap-2 text-destructive text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.companyName}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyLogo">
                    Company Logo <span className="text-destructive">*</span>
                  </Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer bg-muted/20">
                    <input
                      type="file"
                      id="companyLogo"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="companyLogo"
                      className="cursor-pointer block"
                    >
                      {logoPreview ? (
                        <div className="space-y-4">
                          <Image
                            src={logoPreview}
                            alt="Logo Preview"
                            width={128}
                            height={128}
                            className="mx-auto rounded-lg object-cover"
                          />
                          <Button type="button" variant="outline" size="sm">
                            <Upload className="w-4 h-4 mr-2" />
                            Change Logo
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                          <div>
                            <p className="text-base font-medium">
                              Click to upload logo
                            </p>
                            <p className="text-sm text-muted-foreground">
                              PNG, JPG, GIF up to 5MB
                            </p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                  {errors.companyLogo && (
                    <div className="flex items-center gap-2 text-destructive text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.companyLogo}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyDescription">
                    Company Description{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="companyDescription"
                    placeholder="Tell us about your company and what you do..."
                    value={formData.companyDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        companyDescription: e.target.value,
                      })
                    }
                    className="min-h-32 resize-none"
                  />
                  {errors.companyDescription && (
                    <div className="flex items-center gap-2 text-destructive text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.companyDescription}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Company Website (Optional)</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="website"
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={(e) =>
                        setFormData({ ...formData, website: e.target.value })
                      }
                      className="h-12 pl-10"
                    />
                  </div>
                  {errors.website && (
                    <div className="flex items-center gap-2 text-destructive text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.website}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sponsorship Amount Card */}
            <Card>
              <CardHeader>
                <CardTitle>Sponsorship Amount</CardTitle>
                <CardDescription>
                  Choose how much you want to sponsor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="sponsorshipAmount">
                    Amount in ETH <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="sponsorshipAmount"
                      type="number"
                      step="0.001"
                      placeholder={`Minimum ${minSponsorshipThreshold} ETH`}
                      value={formData.sponsorshipAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sponsorshipAmount: e.target.value,
                        })
                      }
                      className="h-12 pl-10 pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                      ETH
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Minimum sponsorship: {minSponsorshipThreshold} ETH
                  </p>
                  {errors.sponsorshipAmount && (
                    <div className="flex items-center gap-2 text-destructive text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.sponsorshipAmount}</span>
                    </div>
                  )}
                </div>

                {formData.sponsorshipAmount && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <p className="text-sm font-semibold">
                        Sponsorship Impact
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {parseFloat(formData.sponsorshipAmount || "0").toFixed(4)}{" "}
                      ETH
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your support will help make this hackathon successful!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upload Status */}
            {isUploading && (
              <Card className="border-primary/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <span className="text-sm font-medium">{uploadStatus}</span>
                  </div>
                  {uploadProgress > 0 && (
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {status !== "ready" && (
                <Button
                  type="submit"
                  size="lg"
                  disabled={isUploading}
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload to IPFS
                    </>
                  )}
                </Button>
              )}

              {status === "ready" && metadataUrl && (
                <TransactionButton
                  transaction={() =>
                    prepareContractCall({
                      contract: mainContract,
                      method:
                        "function sponsorHackathon(uint256 hackathonId, string metadataURI) payable",
                      params: [BigInt(hackathonId), metadataUrl],
                      value: sponsorshipAmountWei,
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
                  style={{
                    flex: 1,
                    minHeight: "48px",
                    borderRadius: "var(--radius)",
                  }}
                >
                  Submit Sponsorship ({formData.sponsorshipAmount} ETH)
                </TransactionButton>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
