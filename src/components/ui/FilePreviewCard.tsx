import { useState } from "react";
import { FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilePreviewCardProps {
  file?: File | null;
  previewUrl?: string | null;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  className?: string;
}

export function FilePreviewCard({
  file,
  previewUrl,
  fileName,
  fileType,
  fileSize,
  className,
}: FilePreviewCardProps) {
  const [imageError, setImageError] = useState(false);

  const name = file?.name || fileName || "Document";
  const type = file?.type || fileType || "";
  const size = file?.size || fileSize || 0;
  const isImage = type.startsWith("image/") && !!previewUrl && !imageError;

  const sizeLabel = size > 0
    ? size >= 1_048_576
      ? `${(size / 1_048_576).toFixed(1)} MB`
      : `${Math.round(size / 1024)} KB`
    : "";

  const typeLabel = type.split("/")[1]?.toUpperCase() || "FILE";

  if (isImage) {
    return (
      <img
        src={previewUrl!}
        alt={`Preview: ${name}`}
        className={cn("w-full h-full object-contain", className)}
        onError={() => setImageError(true)}
      />
    );
  }

  // Document / PDF / broken-image fallback
  return (
    <div
      role="img"
      aria-label={`Document preview: ${name}`}
      className={cn(
        "flex flex-col items-center justify-center bg-slate-800/60 border border-slate-700/50 rounded-lg aspect-[3/4]",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mb-3">
        {type.includes("pdf") ? (
          <FileText className="w-6 h-6 text-cyan-400" />
        ) : (
          <ImageIcon className="w-6 h-6 text-cyan-400" />
        )}
      </div>

      <p className="text-sm text-slate-300 max-w-[200px] truncate px-4">{name}</p>

      {(sizeLabel || typeLabel) && (
        <p className="text-xs text-slate-500 mt-1">
          {typeLabel}{sizeLabel ? ` · ${sizeLabel}` : ""}
        </p>
      )}
    </div>
  );
}
