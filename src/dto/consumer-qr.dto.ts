export interface IMultiLinkDto {
    platform: string;
    url: string;
    label?: string;
}

export interface ClaimQRDto {
    token: string;
    destination_url?: string;
    qr_type?: 'single' | 'multi_link';
    multi_links?: IMultiLinkDto[];
    name?: string;
    mobile_number?: string;
    place?: string;
    business?: string;
}

export const validateClaimQRDto = (data: any): ClaimQRDto => {
    if (!data.token || typeof data.token !== 'string') {
        throw new Error('QR token is required');
    }
    
    if (data.qr_type === 'multi_link') {
        if (!Array.isArray(data.multi_links) || data.multi_links.length === 0) {
            throw new Error('multi_links array is required for multi_link qr_type');
        }
    } else {
        if (!data.destination_url || typeof data.destination_url !== 'string') {
            throw new Error('Destination URL is required');
        }
    }

    return {
        token: data.token,
        destination_url: data.destination_url,
        qr_type: data.qr_type === 'multi_link' ? 'multi_link' : 'single',
        multi_links: data.qr_type === 'multi_link' ? data.multi_links : undefined,
        name: data.name?.trim() || undefined,
        mobile_number: data.mobile_number?.trim() || undefined,
        place: data.place?.trim() || undefined,
        business: data.business?.trim() || undefined,
    };
};
