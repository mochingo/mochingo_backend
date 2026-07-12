export interface ConsumerLoginDto {
    credential: string;
}

export const validateConsumerLoginDto = (data: any): ConsumerLoginDto => {
    if (!data.credential || typeof data.credential !== 'string') {
        throw new Error('Credential is required and must be a string');
    }
    return { credential: data.credential };
};
