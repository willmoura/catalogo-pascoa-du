import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { Button } from "@/components/ui/button";
import { Loader2, Check, AlertTriangle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function BulkImageMigration() {
    const { data: images, isLoading: isLoadingImages, error: imagesError, isError } = trpc.media.listSync.useQuery();
    const { data: catalog, isLoading: isLoadingCatalog, refetch: refetchCatalog } = trpc.catalog.full.useQuery();

    const updateImageMutation = trpc.media.bulkUpdateProductImage.useMutation();

    const [processing, setProcessing] = useState<number[]>([]);

    // Auto-match logic
    const matches = useMemo(() => {
        if (!images || !catalog?.products) return [];

        const results = [];

        for (const product of catalog.products) {
            // Normalize product name for matching
            // e.g. "Ovo de Maracujá" -> "maracuja"
            const normalizedName = product.name
                .toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
                .replace(/ovo de /g, "")
                .replace(/ovo /g, "")
                .replace(/ /g, "_")
                .trim();

            // Try to find a matching image
            const match = images.find(img => {
                const filename = img.filename.toLowerCase();
                // Check exact match or verify if filename starts with normalized name
                return filename.includes(normalizedName) && !filename.includes("placeholder");
            });

            if (match) {
                // Only propose if IDs are different
                if (product.imageUrl !== match.id) {
                    results.push({
                        product,
                        image: match,
                        confidence: match.filename === normalizedName + ".png" ? "high" : "medium"
                    });
                }
            }
        }
        return results;
    }, [images, catalog]);

    const handleApply = async (productId: number, imageId: string) => {
        try {
            setProcessing(prev => [...prev, productId]);
            await updateImageMutation.mutateAsync({
                productId,
                providerImageId: imageId
            });
            toast.success("Imagem atualizada!");
            refetchCatalog();
        } catch (e) {
            toast.error("Erro ao atualizar");
        } finally {
            setProcessing(prev => prev.filter(id => id !== productId));
        }
    };

    const handleApplyAll = async () => {
        // Implement sequential or parallel update
        for (const match of matches) {
            await handleApply(match.product.id, match.image.id);
        }
    };

    if (isLoadingImages || isLoadingCatalog) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>;
    }

    if (isError) {
        return (
            <div className="container mx-auto py-10">
                <Card className="border-red-500 bg-red-50">
                    <CardHeader>
                        <CardTitle className="text-red-700">Erro ao carregar imagens</CardTitle>
                    </CardHeader>
                    <CardContent className="text-red-600">
                        <p>Não foi possível conectar com a Cloudflare.</p>
                        <pre className="mt-2 text-xs bg-white p-2 rounded border border-red-200 overflow-auto">
                            {JSON.stringify(imagesError, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Migração em Massa</h1>
                    <p className="text-muted-foreground">Cloudflare Images detectadas: {images?.length}</p>
                </div>
                {matches.length > 0 && (
                    <Button onClick={handleApplyAll} disabled={processing.length > 0}>
                        {processing.length > 0 ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2" />}
                        Aplicar {matches.length} Sugestões
                    </Button>
                )}
            </div>

            {!matches.length && (
                <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                        Nenhuma correspondência automática encontrada. Verifique os nomes dos arquivos.
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4">
                {matches.map(({ product, image }) => (
                    <Card key={product.id} className="overflow-hidden">
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                                {/* Current Product */}
                                <div className="md:col-span-3 p-4 flex gap-4 items-center border-r">
                                    <div className="w-16 h-16 bg-secondary/20 rounded relative flex-shrink-0">
                                        {product.imageUrl && (
                                            product.imageUrl.startsWith("http") ?
                                                <img src={product.imageUrl} className="w-full h-full object-cover rounded" /> :
                                                <ResponsiveImage imageId={product.imageUrl} className="w-full h-full rounded" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{product.name}</p>
                                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{product.imageUrl || "Sem imagem"}</p>
                                    </div>
                                </div>

                                {/* Arrow */}
                                <div className="flex justify-center md:col-span-1">
                                    <ArrowRight className="text-muted-foreground" />
                                </div>

                                {/* Proposed Match */}
                                <div className="md:col-span-3 p-4 flex gap-4 items-center justify-between">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-16 h-16 bg-secondary/20 rounded relative flex-shrink-0">
                                            <ResponsiveImage imageId={image.id} className="w-full h-full rounded" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-green-600">{image.filename}</p>
                                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{image.id}</p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleApply(product.id, image.id)}
                                        disabled={processing.includes(product.id)}
                                    >
                                        {processing.includes(product.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar"}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="mt-12">
                <h2 className="text-xl font-bold mb-4">Todas as Imagens na Cloudflare</h2>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                    {images?.map(img => (
                        <div key={img.id} className="relative group aspect-square bg-secondary/10 rounded overflow-hidden">
                            <ResponsiveImage imageId={img.id} className="w-full h-full" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center text-white text-xs">
                                <span className="font-bold truncate w-full">{img.filename}</span>
                                <span className="opacity-70 truncate w-full cursor-pointer select-all">{img.id}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
