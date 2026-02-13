import { useState } from "react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MediaManager() {
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);

    const handleUploadComplete = (mediaId: string) => {
        if (mediaId) {
            setUploadedImages((prev) => [mediaId, ...prev]);
        }
    };

    return (
        <div className="container mx-auto py-10 space-y-8">
            <h1 className="text-3xl font-bold">Gerenciador de Mídia</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Upload de Imagem</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ImageUpload onUploadComplete={handleUploadComplete} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Imagens Recentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                            {uploadedImages.map((id) => (
                                <div key={id} className="relative group">
                                    <ResponsiveImage
                                        imageId={id}
                                        className="w-full aspect-square rounded-md border"
                                        alt="Uploaded media"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-white text-xs p-1 select-all break-all">{id}</span>
                                    </div>
                                </div>
                            ))}
                            {uploadedImages.length === 0 && (
                                <p className="text-muted-foreground col-span-3 text-center py-4">
                                    Nenhuma imagem carregada nesta sessão.
                                </p>
                            )}
                        </div>
                        {uploadedImages.length > 0 && (
                            <div className="mt-4 text-xs text-muted-foreground">
                                <p>Passe o mouse para ver o ID da imagem.</p>
                                <p>Estes IDs são da Cloudflare e já estão salvos no banco de dados.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
