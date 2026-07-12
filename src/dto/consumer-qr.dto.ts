export interface ClaimQRDto {
    token: string;
    destination_url: string;
    mobile_number?: string;
}

export const validateClaimQRDto = (data: any): ClaimQRDto => {
    if (!data.token || typeof data.token !== 'string') {
        throw new Error('QR token is required');
    }
    if (!data.destination_url || typeof data.destination_url !== 'string') {
        throw new Error('Destination URL is required');
    }
    return {
        token: data.token,
        destination_url: data.destination_url,
        mobile_number: data.mobile_number,
    };
};
