import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FormData {
  hackathonName?: string;
  description?: string;
  hackathonImage?: FileList;
  judges?: string[];
  sponsorshipEndTime?: string;
  hackathonStartTime?: string;
  hackathonEndTime?: string;
  stakeAmount?: string;
  minTeamMembers?: string;
  maxTeamMembers?: string;
  minSponsorshipThreshold?: string;
  eventTimeline?: Array<{
    eventName?: string;
    eventDate?: string;
    eventDescription?: string;
  }>;
}

interface TransactionData {
  metadataUrl: string;
  validJudges: string[];
  sponsorshipEndTimestamp: number;
  hackathonStartTimestamp: number;
  hackathonEndTimestamp: number;
  stakeAmountWei: bigint;
  minTeamMembers: number;
  maxTeamMembers: number;
  minSponsorshipThresholdWei: bigint;
  hostingFeeWei: bigint;
  metadataHash: string;
  imageHash: string;
  imageUrl: string;
}

interface HackathonFormStore {
  // Form data
  formData: FormData;
  imagePreview: string;
  step: number;

  // Transaction data
  transactionData: TransactionData | null;

  // Upload state
  isUploading: boolean;
  uploadProgress: number;
  uploadStatus: string;

  // Actions
  setFormData: (data: Partial<FormData>) => void;
  setImagePreview: (preview: string) => void;
  setStep: (step: number) => void;
  setTransactionData: (data: TransactionData | null) => void;
  setUploadState: (
    updates: Partial<{
      isUploading: boolean;
      uploadProgress: number;
      uploadStatus: string;
    }>
  ) => void;
  resetForm: () => void;
}

const initialFormData: FormData = {
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
};

export const useHackathonFormStore = create<HackathonFormStore>()(
  persist(
    (set) => ({
      formData: initialFormData,
      imagePreview: "",
      step: 1,
      transactionData: null,
      isUploading: false,
      uploadProgress: 0,
      uploadStatus: "",

      setFormData: (data) =>
        set((state) => ({
          formData: { ...state.formData, ...data },
        })),

      setImagePreview: (preview) => set({ imagePreview: preview }),

      setStep: (step) => set({ step }),

      setTransactionData: (data) => set({ transactionData: data }),

      setUploadState: (updates) =>
        set((state) => ({
          isUploading: updates.isUploading ?? state.isUploading,
          uploadProgress: updates.uploadProgress ?? state.uploadProgress,
          uploadStatus: updates.uploadStatus ?? state.uploadStatus,
        })),

      resetForm: () =>
        set({
          formData: initialFormData,
          imagePreview: "",
          step: 1,
          transactionData: null,
          isUploading: false,
          uploadProgress: 0,
          uploadStatus: "",
        }),
    }),
    {
      name: "hackathon-form-storage",
      partialize: (state) => ({
        formData: {
          ...state.formData,
          // Exclude hackathonImage as FileList can't be serialized
          hackathonImage: undefined,
        },
        imagePreview: state.imagePreview,
        step: state.step,
      }),
    }
  )
);
