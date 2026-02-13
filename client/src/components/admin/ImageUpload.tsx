import { useState } from "react";
import { Button } from "@/components/ui/button"; // Adjust path as needed
import { Input } from "@/components/ui/input"; // Adjust path as needed
import { Loader2, Upload, X } from "lucide-react";
import { trpc } from "@/lib/trpc"; // Adjust logic
import { toast } from "sonner";
import { ResponsiveImage } from "../ui/responsive-image";

interface ImageUploadProps {
    onUploadComplete: (imageId: string) => void;
    currentImageId?: string;
}

export function ImageUpload({ onUploadComplete, currentImageId }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [previewId, setPreviewId] = useState<string | null>(currentImageId || null);

    // TRPC Mutations
    const getUploadUrlMutation = trpc.media.getUploadUrl.useMutation();
    const confirmUploadMutation = trpc.media.confirmUpload.useMutation();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type/size if needed
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Arquivo muito grande (max 5MB)");
            return;
        }

        try {
            setIsUploading(true);

            // 1. Get Upload URL
            const { uploadUrl, id: draftId } = await getUploadUrlMutation.mutateAsync();

            // 2. Direct Upload to Cloudflare
            const formData = new FormData();
            formData.append("file", file);

            const uploadResponse = await fetch(uploadUrl, {
                method: "POST",
                body: formData,
            });

            if (!uploadResponse.ok) {
                throw new Error("Falha no upload para Cloudflare");
            }

            // 3. Confirm Upload in Backend
            const { mediaId } = await confirmUploadMutation.mutateAsync({
                providerImageId: draftId, // Or parse from uploadResponse if needed, but draftId is usually the one
                filename: file.name,
            });

            setPreviewId(draftId); // Use provider ID for preview if ResponsiveImage supports it, or use mediaId if we map it?
            // Our ResponsiveImage uses "imageId" (which could be the DB ID or Cloudflare ID).
            // The implementation plan says "mediaId". 
            // If ResponsiveImage expects Cloudflare ID, we should pass `draftId`.
            // If it expects DB ID, we pass `mediaId` (but unrelated to src generation).
            // Let's assume ResponsiveImage expects CLOUDFLARE UUID for now to generate the URL.
            // So we pass draftId.

            onUploadComplete(draftId); // Pass Cloudflare ID to parent form
            toast.success("Imagem enviada com sucesso!");

        } catch (error) {
            console.error(error);
            toast.error("Erro ao enviar imagem");
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = "";
        }
    };

    const clearImage = () => {
        setPreviewId(null);
        onUploadComplete("");
    };

    return (
        <div className="space-y-4">
            {previewId ? (
                <div className="relative w-40 h-40 group">
                    <ResponsiveImage
                        imageId={previewId}
                        className="w-full h-full rounded-lg border border-border"
                        alt="Preview"
                    />
                    <button
                        type="button"
                        onClick={clearImage}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground p-1 rounded-full shadow-sm hover:bg-destructive/90"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-4">
                    <label className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors">
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            <span>{isUploading ? "Enviando..." : "Carregar Imagem"}</span>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/png, image/jpeg, image/webp, image/avif"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                    </label>
                    <span className="text-xs text-muted-foreground">Max 5MB (JPG, PNG, WEBP)</span>
                </div>
            )}
        </div>
    );
}
