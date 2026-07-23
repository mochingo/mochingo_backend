import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { signToken } from '../utils/token.util.js';
import { env } from '../config/env.js';
import { ConsumerLoginDto } from '../dto/consumer-auth.dto.js';

const client = new OAuth2Client(env.googleClientId || 'mock-client-id');

export interface UserResponseDto {
    id: string;
    name: string;
    email: string;
    mobile_number?: string;
    place?: string;
    business?: string;
    profile_picture?: string;
}

export class ConsumerAuthService {
    async loginWithGoogle(dto: ConsumerLoginDto): Promise<{ user: UserResponseDto; token: string }> {
        let payload: any;
        
        // Mock verification for testing if no real client ID is set
        if (!env.googleClientId || env.googleClientId === 'mock-client-id') {
            // For mock, assume the credential is just a JSON string or we mock a payload
            try {
                payload = JSON.parse(dto.credential);
            } catch {
                payload = {
                    sub: 'mock-google-id-123',
                    email: 'mockuser@example.com',
                    name: 'Mock User',
                    picture: 'https://example.com/mock.jpg',
                };
            }
        } else {
            try {
                const ticket = await client.verifyIdToken({
                    idToken: dto.credential,
                    audience: env.googleClientId,
                });
                payload = ticket.getPayload();
            } catch (err: any) {
                console.error("Google verifyIdToken error:", err.message);
                throw new Error(`Invalid Google credential: ${err.message}`);
            }
        }

        if (!payload || !payload.email || !payload.sub) {
            throw new Error('Invalid Google credential payload');
        }

        let user = await User.findOne({ google_id: payload.sub });
        if (!user) {
            user = await User.findOne({ email: payload.email });
            if (user) {
                user.google_id = payload.sub;
                await user.save();
            } else {
                user = await User.create({
                    google_id: payload.sub,
                    email: payload.email,
                    name: payload.name,
                    profile_picture: payload.picture,
                });
            }
        }

        const tokenPayload = {
            id: String(user._id),
            email: user.email,
            role: 'consumer'
        };

        const token = signToken(tokenPayload);

        const userDto: UserResponseDto = {
            id: String(user._id),
            name: user.name,
            email: user.email,
            mobile_number: user.mobile_number,
            place: user.place,
            business: user.business,
            profile_picture: user.profile_picture,
        };

        return { user: userDto, token };
    }

    async getUserById(id: string): Promise<UserResponseDto | null> {
        const user = await User.findById(id);
        if (!user) return null;
        return {
            id: String(user._id),
            name: user.name,
            email: user.email,
            mobile_number: user.mobile_number,
            place: user.place,
            business: user.business,
            profile_picture: user.profile_picture,
        };
    }
}

export const consumerAuthService = new ConsumerAuthService();
