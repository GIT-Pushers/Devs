import React, { useRef, useState, useEffect } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface FileUploaderProps {
  label?: string;
  onChange: (file: File | null) => void;
  error?: string;
  value?: File | null;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  label,
  onChange,
  error,
  value,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (value) {
      const objectUrl = URL.createObjectURL(value);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(null);
    }
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
  };

  const clearFile = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onChange(null);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-neutral-900 mb-2">
          {label}
        </label>
      )}

      {!preview ? (
        <div
          onClick={() => inputRef.current?.click()}
          className={`
            relative group cursor-pointer
            border-2 border-dashed rounded-lg p-8
            flex flex-col items-center justify-center
            bg-neutral-50 hover:bg-neutral-100 transition-colors
            ${
              error
                ? "border-destructive bg-destructive/10"
                : "border-neutral-300"
            }
          `}
        >
          <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform duration-200">
            <Upload className="w-6 h-6 text-neutral-600" />
          </div>
          <p className="text-sm font-medium text-neutral-900">
            Click to upload team image
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            SVG, PNG, JPG or GIF (max. 5MB)
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50">
          <div className="aspect-video w-full flex items-center justify-center bg-neutral-100">
            <img
              src={preview}
              alt="Preview"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute top-2 right-2">
            <button
              type="button"
              onClick={clearFile}
              className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-destructive/10 text-neutral-600 hover:text-destructive transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-4 py-2 bg-white border-t border-neutral-100 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-neutral-500" />
            <span className="text-sm text-neutral-700 truncate">
              {value?.name}
            </span>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-destructive animate-fadeIn">{error}</p>
      )}
    </div>
  );
};
