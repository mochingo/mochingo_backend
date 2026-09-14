import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomerData extends Document {
    name: string;
    mobile_number: string;
    business_name: string;
    place: string;
    purchased_items: {
        product_name: string;
        price: number;
    }[];
    business_category_id: mongoose.Types.ObjectId;
    entered_by?: mongoose.Types.ObjectId;
    created_at: Date;
    updated_at: Date;
}

const CustomerDataSchema = new Schema<ICustomerData>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        mobile_number: {
            type: String,
            required: true,
            trim: true,
        },
        business_name: {
            type: String,
            required: true,
            trim: true,
        },
        place: {
            type: String,
            required: true,
            trim: true,
        },
        purchased_items: [
            {
                product_name: { type: String, required: true },
                price: { type: Number, required: true, default: 0 },
            }
        ],
        business_category_id: {
            type: Schema.Types.ObjectId,
            ref: 'BusinessCategory',
            required: true,
        },
        entered_by: {
            type: Schema.Types.ObjectId,
            ref: 'Admin',
        },
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    }
);

const CustomerData = mongoose.model<ICustomerData>('CustomerData', CustomerDataSchema, 'customer_data');

export default CustomerData;
