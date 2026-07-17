import Joi from 'joi';

export interface SetupPetProfileDto {
    token: string;
    
    full_name: string;
    phone_primary: string;
    phone_alternate?: string;
    email?: string;
    city?: string;
    state?: string;
    country?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    
    pet_name: string;
    species: string;
    breed?: string;
    color?: string;
    gender?: string;
    date_of_birth?: string;
    weight?: string;
    size?: string;
    microchip_number?: string;
    registration_number?: string;
    
    blood_group?: string;
    is_vaccinated?: boolean | string;
    last_vaccination_date?: string;
    allergies?: string;
    medical_conditions?: string;
    current_medications?: string;
    special_needs?: string;
    vet_name?: string;
    vet_phone?: string;
    
    reward_offered?: string;
    special_instructions?: string;
    preferred_contact_method?: string;
    home_address?: string;
    
    social_instagram?: string;
    social_facebook?: string;
    social_website?: string;
}

export const setupPetProfileSchema = Joi.object({
    token: Joi.string().required(),
    
    full_name: Joi.string().required(),
    phone_primary: Joi.string().required(),
    phone_alternate: Joi.string().allow('', null).optional(),
    email: Joi.string().email().allow('', null).optional(),
    city: Joi.string().allow('', null).optional(),
    state: Joi.string().allow('', null).optional(),
    country: Joi.string().allow('', null).optional(),
    emergency_contact_name: Joi.string().allow('', null).optional(),
    emergency_contact_phone: Joi.string().allow('', null).optional(),
    
    pet_name: Joi.string().required(),
    species: Joi.string().required(),
    breed: Joi.string().allow('', null).optional(),
    color: Joi.string().allow('', null).optional(),
    gender: Joi.string().allow('', null).optional(),
    date_of_birth: Joi.string().allow('', null).optional(),
    weight: Joi.string().allow('', null).optional(),
    size: Joi.string().allow('', null).optional(),
    microchip_number: Joi.string().allow('', null).optional(),
    registration_number: Joi.string().allow('', null).optional(),
    
    blood_group: Joi.string().allow('', null).optional(),
    is_vaccinated: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false')).optional(),
    last_vaccination_date: Joi.string().allow('', null).optional(),
    allergies: Joi.string().allow('', null).optional(),
    medical_conditions: Joi.string().allow('', null).optional(),
    current_medications: Joi.string().allow('', null).optional(),
    special_needs: Joi.string().allow('', null).optional(),
    vet_name: Joi.string().allow('', null).optional(),
    vet_phone: Joi.string().allow('', null).optional(),
    
    reward_offered: Joi.string().allow('', null).optional(),
    special_instructions: Joi.string().allow('', null).optional(),
    preferred_contact_method: Joi.string().allow('', null).optional(),
    home_address: Joi.string().allow('', null).optional(),
    
    social_instagram: Joi.string().allow('', null).optional(),
    social_facebook: Joi.string().allow('', null).optional(),
    social_website: Joi.string().allow('', null).optional(),
}).options({ stripUnknown: true });

export const validateSetupPetProfileDto = (data: any): SetupPetProfileDto => {
    const { error, value } = setupPetProfileSchema.validate(data);
    if (error) {
        throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
    }
    return value;
};
