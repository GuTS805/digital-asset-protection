"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image as ImageIcon, CheckCircle, Loader2, X } from "lucide-react";
import { clsx } from "clsx";
import { assetsApi } from "@/lib/api";
import { Asset } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";

interface UploadZoneProps {
  onSuccess?: (asset: Asset) => void;
}

export function UploadZone({ onSuccess }: UploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [organization, setOrganization] = useState("");
  const [tags, setTags] = useState("");
  const [result, setResult] = useState<Asset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (!f) return;
    setFile(f);
    setName(f.name.replace(/\.[^.]+$/, ""));
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (!file || !name) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", name);
      fd.append("description", description);
      fd.append("organization", organization || "Default Org");
      fd.append("tags", tags);
      const asset = await assetsApi.upload(fd);
      setResult(asset);
      qc.invalidateQueries({ queryKey: ["assets"] });
      onSuccess?.(asset);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed. Check that the backend is running.");
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setName("");
    setDescription("");
    setOrganization("");
    setTags("");
    setResult(null);
    setError(null);
  };

  if (result) {
    return (
      <div className="text-center space-y-4 py-4">
        <CheckCircle className="w-12 h-12 text-safe mx-auto" />
        <h3 className="text-base font-semibold text-txt-primary">Asset Protected</h3>
        <p className="text-txt-muted text-sm">
          <span className="text-txt-primary font-medium">{result.name}</span> has been fingerprinted and watermarked. Monitoring is active.
        </p>

        <div className="bg-ink-700 border border-line rounded p-4 text-left space-y-2">
          {[
            { label: "pHash", value: result.phash, color: "text-brand" },
            { label: "Watermark ID", value: result.watermark_id, color: "text-sky" },
            { label: "Status", value: result.status, color: "text-safe-light" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex justify-between text-xs">
              <span className="text-txt-muted">{label}</span>
              <span className={clsx("font-mono truncate max-w-[180px]", color)}>{value}</span>
            </div>
          ))}
        </div>

        <button onClick={reset} className="btn-primary text-sm">
          Protect Another Asset
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={clsx(
          "border-2 border-dashed rounded p-10 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-brand bg-brand/5"
            : "border-line hover:border-line-light hover:bg-ink-700",
          preview && "hidden"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 text-txt-muted mx-auto mb-3" />
        <p className="text-txt-secondary text-sm font-medium">
          {isDragActive ? "Drop your media here" : "Drag & drop or click to upload"}
        </p>
        <p className="text-txt-muted text-xs mt-1">JPG, PNG, WebP — up to 20 MB</p>
      </div>

      {preview && (
        <div className="relative rounded overflow-hidden">
          <img src={preview} alt="Preview" className="w-full max-h-48 object-cover" />
          <button
            onClick={reset}
            className="absolute top-2 right-2 p-1 bg-black/60 rounded text-white hover:bg-black/80"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {file && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-txt-muted mb-1 block">Asset Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Champions League Final — Goal Celebration"
              className="w-full bg-ink-700 border border-line rounded px-3 py-2.5 text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-brand transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-txt-muted mb-1 block">Organization</label>
              <input
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. UEFA"
                className="w-full bg-ink-700 border border-line rounded px-3 py-2.5 text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-brand transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-txt-muted mb-1 block">Tags (comma-separated)</label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="football, final, 2026"
                className="w-full bg-ink-700 border border-line rounded px-3 py-2.5 text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-brand transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-txt-muted mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the asset..."
              rows={2}
              className="w-full bg-ink-700 border border-line rounded px-3 py-2.5 text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-brand resize-none transition-colors"
            />
          </div>

          {error && (
            <p className="text-danger-light text-xs bg-danger/10 border border-danger/20 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading || !name}
            className={clsx(
              "w-full py-2.5 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2",
              uploading || !name
                ? "bg-ink-600 text-txt-muted cursor-not-allowed"
                : "btn-primary"
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Fingerprinting & Watermarking…
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" />
                Protect Asset
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
