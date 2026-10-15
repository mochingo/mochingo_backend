import Joi from 'joi';

export interface SetupCardProfileDto {
    token: string;
    name?: string;
    role?: string;
    mobile_number?: string;
    email?: string;
    website?: string;
    instagram?: string;
    location?: string;
    photo_url?: string;
}

export const setupCardProfileSchema = Joi.object({
    token: Joi.string().required(),
    name: Joi.string().allow('', null).optional(),
    role: Joi.string().allow('', null).optional(),
    mobile_number: Joi.string().allow('', null).optional(),
    email: Joi.string().allow('', null).optional(),
    website: Joi.string().allow('', null).optional(),
    instagram: Joi.string().allow('', null).optional(),
    location: Joi.string().allow('', null).optional(),
    photo_url: Joi.string().allow('', null).optional(),
}).options({ stripUnknown: true });

export const validateSetupCardProfileDto = (data: any): SetupCardProfileDto => {
    const { error, value } = setupCardProfileSchema.validate(data);
    if (error) {
        throw new Error(`Validation Error: ${error.details.map((x) => x.message).join(', ')}`);
    }
    return value;
};
