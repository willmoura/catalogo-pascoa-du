import { ENV } from "../_core/env";

const CLOUDFLARE_API_URL = `https://api.cloudflare.com/client/v4/accounts/${ENV.cloudflareAccountId}/images/v2`;

interface DirectUploadResponse {
    result: {
        id: string;
        uploadURL: string;
    };
    success: boolean;
    errors: any[];
    messages: any[];
}

export async function getDirectUploadUrl(): Promise<{ uploadUrl: string; id: string }> {
    if (!ENV.cloudflareAccountId || !ENV.cloudflareApiToken) {
        throw new Error("Cloudflare credentials not configured");
    }

    const response = await fetch(`${CLOUDFLARE_API_URL}/direct_upload`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${ENV.cloudflareApiToken}`,
            // No Content-Type needed for empty POST, or "application/json" if sending metadata
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudflare API Error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as DirectUploadResponse;

    if (!data.success) {
        throw new Error(`Cloudflare Upload Error: ${JSON.stringify(data.errors)}`);
    }

    return {
        uploadUrl: data.result.uploadURL,
        id: data.result.id,
    };
}

export async function deleteImage(imageId: string): Promise<boolean> {
    if (!ENV.cloudflareAccountId || !ENV.cloudflareApiToken) {
        throw new Error("Cloudflare credentials not configured");
    }

    const response = await fetch(`${CLOUDFLARE_API_URL}/${imageId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${ENV.cloudflareApiToken}`,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudflare API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
        throw new Error(`Cloudflare Delete Error: ${JSON.stringify(data.errors)}`);
    }

    return response.ok;
}

export interface CloudflareImage {
    id: string;
    filename: string;
    uploaded: string;
    requireSignedURLs: boolean;
    variants: string[];
}

export async function listImages(page = 1, perPage = 50): Promise<{ images: CloudflareImage[], total_count: number }> {
    console.log("([Cloudflare] listImages called", { page, perPage });
    console.log("[Cloudflare] Credentials:", {
        accountId: ENV.cloudflareAccountId ? "OK" : "MISSING",
        token: ENV.cloudflareApiToken ? "OK" : "MISSING"
    });

    if (!ENV.cloudflareAccountId || !ENV.cloudflareApiToken) {
        console.error("[Cloudflare] Missing credentials");
        throw new Error("Cloudflare credentials not configured");
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${ENV.cloudflareAccountId}/images/v2?page=${page}&per_page=${perPage}`;
    console.log("[Cloudflare] Fetching URL:", url);

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${ENV.cloudflareApiToken}`,
            },
        });

        console.log("[Cloudflare] Response Status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[Cloudflare] API Error:", errorText);
            throw new Error(`Cloudflare API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (!data.success) {
            console.error("[Cloudflare] Data Error:", JSON.stringify(data.errors));
            throw new Error(`Cloudflare List Error: ${JSON.stringify(data.errors)}`);
        }

        console.log(`[Cloudflare] Found ${data.result?.images?.length} images`);
        return {
            images: data.result.images || [],
            total_count: 0
        };
    } catch (error) {
        console.error("[Cloudflare] Exception:", error);
        throw error;
    }
}
