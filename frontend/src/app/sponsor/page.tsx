"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, AlertCircle, Upload, Globe, Coins, Sparkles } from "lucide-react";
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
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <Card className="max-w-lg w-full bg-gradient-to-br from-card to-card/50 border-2 border-primary/20 shadow-xl shadow-primary/5">
                    <CardHeader className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-b-2 border-primary/30 text-center">
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-primary/30">
                            <CheckCircle2 className="w-8 h-8 text-primary" />
                        </div>
                        <CardTitle className="text-3xl font-extrabold text-white">Sponsorship Successful!</CardTitle>
                        <CardDescription className="text-muted-foreground text-lg mt-2">
                            Thank you for sponsoring Hackathon #{hackathonId}. Your contribution has been recorded.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="bg-black/40 rounded-xl p-5 border-2 border-primary/20 backdrop-blur-sm space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sponsor</span>
                                <span className="font-bold text-white">{formData.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Amount</span>
                                <span className="font-extrabold text-primary text-xl">{formData.amount} ETH</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2 pt-0">
                        <Button
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 text-base shadow-lg shadow-primary/30 border-2 border-primary/40"
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
        <div className="min-h-screen bg-black overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl overflow-hidden">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-8 text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>

                {/* Enhanced Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-1.5 w-16 bg-gradient-to-r from-primary to-primary/50"></div>
                        <span className="text-primary text-sm font-bold uppercase tracking-widest">
                            Sponsor Hackathon
                        </span>
                        <div className="h-1.5 w-16 bg-gradient-to-r from-primary/50 to-primary"></div>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4">
                        Become a Sponsor
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Support Hackathon #{hackathonId} and help grow the community.
                    </p>
                </div>

                <Card className="bg-gradient-to-br from-card to-card/50 border-2 border-primary/20 shadow-xl shadow-primary/5 overflow-hidden">
                    <CardHeader className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-b-2 border-primary/30">
                        <CardTitle className="flex items-center gap-3 text-white text-xl">
                            <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
                                <Coins className="w-6 h-6 text-primary" />
                            </div>
                            Sponsorship Details
                        </CardTitle>
                        <CardDescription className="text-muted-foreground mt-2">
                            Enter your organization details and sponsorship amount.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Sponsor Name */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    Sponsor Name <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    placeholder="e.g. Acme Corp"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className={`bg-black/40 border-2 ${errors.name ? "border-destructive" : "border-primary/20"} text-white placeholder:text-muted-foreground focus:border-primary/50`}
                                />
                                {errors.name && (
                                    <p className="text-xs text-destructive font-medium">{errors.name}</p>
                                )}
                            </div>

                            {/* Logo Upload */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    Logo <span className="text-destructive">*</span>
                                </label>
                                <FileUploader
                                    value={formData.logo}
                                    onChange={(file) => setFormData(prev => ({ ...prev, logo: file }))}
                                />
                                {errors.logo && (
                                    <p className="text-xs text-destructive font-medium">{errors.logo}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    Description <span className="text-destructive">*</span>
                                </label>
                                <Textarea
                                    placeholder="Tell us about your organization..."
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className={`bg-black/40 border-2 ${errors.description ? "border-destructive" : "border-primary/20"} text-white placeholder:text-muted-foreground focus:border-primary/50 min-h-[100px]`}
                                />
                                {errors.description && (
                                    <p className="text-xs text-destructive font-medium">{errors.description}</p>
                                )}
                            </div>

                            {/* Amount */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    Sponsorship Amount (ETH) <span className="text-destructive">*</span>
                                </label>
                                <div className="relative">
                                    <Coins className="absolute left-3 top-3 h-4 w-4 text-primary" />
                                    <Input
                                        type="number"
                                        placeholder="0.0"
                                        step="0.01"
                                        min="0"
                                        value={formData.amount}
                                        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                        className={`pl-9 bg-black/40 border-2 ${errors.amount ? "border-destructive" : "border-primary/20"} text-white placeholder:text-muted-foreground focus:border-primary/50`}
                                    />
                                </div>
                                {errors.amount && (
                                    <p className="text-xs text-destructive font-medium">{errors.amount}</p>
                                )}
                            </div>

                            {/* Website */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    Website <span className="text-muted-foreground font-normal text-xs">(Optional)</span>
                                </label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-3 h-4 w-4 text-primary" />
                                    <Input
                                        placeholder="https://example.com"
                                        value={formData.website}
                                        onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                                        className="pl-9 bg-black/40 border-2 border-primary/20 text-white placeholder:text-muted-foreground focus:border-primary/50"
                                    />
                                </div>
                                {errors.website && (
                                    <p className="text-xs text-destructive font-medium">{errors.website}</p>
                                )}
                            </div>

                            {status === "error" && (
                                <div className="p-4 bg-destructive/20 border-2 border-destructive/30 rounded-lg flex items-center gap-3 text-destructive">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="font-medium">Something went wrong. Please try again.</span>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 text-base shadow-lg shadow-primary/30 border-2 border-primary/40 cursor-pointer"
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
        </div>
    );
}
