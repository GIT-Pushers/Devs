"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, AlertCircle, Upload, Globe, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "@/components/ui/fileupload";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";

interface SponsorFormData {
    name: string;
    logo: File | null;
    description: string;
    amount: string;
    website: string;
}

export default function SponsorPage() {
    const params = useParams();
    const router = useRouter();
    const hackathonId = params.id as string;

    const [formData, setFormData] = useState<SponsorFormData>({
        name: "",
        logo: null,
        description: "",
        amount: "",
        website: "",
    });

    const [errors, setErrors] = useState<Partial<Record<keyof SponsorFormData, string>>>({});
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

    const validate = (): boolean => {
        const newErrors: typeof errors = {};
        if (!formData.name.trim()) newErrors.name = "Sponsor name is required";
        if (!formData.logo) newErrors.logo = "Logo is required";
        if (!formData.description.trim()) newErrors.description = "Description is required";

        // Amount validation
        if (!formData.amount) {
            newErrors.amount = "Sponsorship amount is required";
        } else if (parseFloat(formData.amount) <= 0) {
            newErrors.amount = "Amount must be greater than 0";
        }

        if (formData.website && !formData.website.startsWith("http")) {
            newErrors.website = "Website must start with http:// or https://";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setStatus("submitting");

        // Simulate network request
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setStatus("success");
    };

    if (status === "success") {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-border">
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-success" />
                        </div>
                        <CardTitle className="text-2xl">Sponsorship Successful!</CardTitle>
                        <CardDescription>
                            Thank you for sponsoring Hackathon #{hackathonId}. Your contribution has been recorded.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-secondary/50 rounded-lg p-4 border space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Sponsor</span>
                                <span className="font-semibold text-foreground">{formData.name}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Amount</span>
                                <span className="font-semibold text-primary">{formData.amount} ETH</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button
                            className="w-full"
                            onClick={() => router.push(`/home/${hackathonId}`)}
                        >
                            Return to Hackathon
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </button>

            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Sponsor Hackathon</h1>
                <p className="text-muted-foreground">
                    Become a sponsor for Hackathon #{hackathonId} and support the community.
                </p>
            </div>

            <Card className="border-border">
                <CardHeader>
                    <CardTitle>Sponsorship Details</CardTitle>
                    <CardDescription>
                        Enter your organization details and sponsorship amount.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Sponsor Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Sponsor Name <span className="text-destructive">*</span>
                            </label>
                            <Input
                                placeholder="e.g. Acme Corp"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className={errors.name ? "border-destructive" : ""}
                            />
                            {errors.name && (
                                <p className="text-xs text-destructive">{errors.name}</p>
                            )}
                        </div>

                        {/* Logo Upload */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Logo <span className="text-destructive">*</span>
                            </label>
                            <FileUploader
                                value={formData.logo}
                                onChange={(file) => setFormData(prev => ({ ...prev, logo: file }))}
                            />
                            {errors.logo && (
                                <p className="text-xs text-destructive">{errors.logo}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Description <span className="text-destructive">*</span>
                            </label>
                            <Textarea
                                placeholder="Tell us about your organization..."
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className={errors.description ? "border-destructive" : ""}
                            />
                            {errors.description && (
                                <p className="text-xs text-destructive">{errors.description}</p>
                            )}
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Sponsorship Amount (ETH) <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <Coins className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="number"
                                    placeholder="0.0"
                                    step="0.01"
                                    min="0"
                                    value={formData.amount}
                                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                    className={`pl-9 ${errors.amount ? "border-destructive" : ""}`}
                                />
                            </div>
                            {errors.amount && (
                                <p className="text-xs text-destructive">{errors.amount}</p>
                            )}
                        </div>

                        {/* Website */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Website <span className="text-muted-foreground font-normal">(Optional)</span>
                            </label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="https://example.com"
                                    value={formData.website}
                                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                                    className="pl-9"
                                />
                            </div>
                            {errors.website && (
                                <p className="text-xs text-destructive">{errors.website}</p>
                            )}
                        </div>

                        {status === "error" && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2 text-destructive text-sm">
                                <AlertCircle className="w-4 h-4" />
                                <span>Something went wrong. Please try again.</span>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={status === "submitting"}
                        >
                            {status === "submitting" ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Processing...
                                </>
                            ) : (
                                "Confirm Sponsorship"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
