import mongoose, { Schema, Document } from 'mongoose';

export interface IPetProfile extends Document {
    owner_id: mongoose.Types.ObjectId;
    qr_token: string;
    
    // Owner Details
    full_name: string;
    phone_primary: string;
    phone_alternate?: string;
    email?: string;
    city?: string;
    state?: string;
    country?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    
    // Pet Details
    pet_name: string;
    species: 'Dog' | 'Cat' | 'Bird' | 'Rabbit' | 'Other' | string;
    breed?: string;
    color?: string;
    gender?: string;
    date_of_birth?: string;
    weight?: string;
    size?: 'Small' | 'Medium' | 'Large' | string;
    microchip_number?: string;
    registration_number?: string;
    
    // Medical Information
    blood_group?: string;
    is_vaccinated?: boolean;
    last_vaccination_date?: string;
    allergies?: string;
    medical_conditions?: string;
    current_medications?: string;
    special_needs?: string;
    vet_name?: string;
    vet_phone?: string;
    
    // Lost Pet Information
    reward_offered?: string;
    special_instructions?: string;
    preferred_contact_method?: 'Phone' | 'WhatsApp' | 'Email' | string;
    home_address?: string;
    
    // Media & Socials
    profile_photo_url?: string;
    social_instagram?: string;
    social_facebook?: string;
    social_website?: string;

    created_at: Date;
    updated_at: Date;
}

const PetProfileSchema = new Schema<IPetProfile>(
    {
        owner_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        qr_token: { type: String, required: true, unique: true, index: true },
        
        full_name: { type: String, required: true },
        phone_primary: { type: String, required: true },
        phone_alternate: { type: String },
        email: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String },
        emergency_contact_name: { type: String },
        emergency_contact_phone: { type: String },
        
        pet_name: { type: String, required: true },
        species: { type: String, required: true },
        breed: { type: String },
        color: { type: String },
        gender: { type: String },
        date_of_birth: { type: String },
        weight: { type: String },
        size: { type: String },
        microchip_number: { type: String },
        registration_number: { type: String },
        
        blood_group: { type: String },
        is_vaccinated: { type: Boolean, default: false },
        last_vaccination_date: { type: String },
        allergies: { type: String },
        medical_conditions: { type: String },
        current_medications: { type: String },
        special_needs: { type: String },
        vet_name: { type: String },
        vet_phone: { type: String },
        
        reward_offered: { type: String },
        special_instructions: { type: String },
        preferred_contact_method: { type: String, default: 'Phone' },
        home_address: { type: String },
        
        profile_photo_url: { type: String },
        social_instagram: { type: String },
        social_facebook: { type: String },
        social_website: { type: String },
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    }
);

const PetProfile = mongoose.model<IPetProfile>('PetProfile', PetProfileSchema, 'pet_profiles');

export default PetProfile;
