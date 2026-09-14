import BusinessCategory from '../models/BusinessCategory.js';
import CustomerData from '../models/CustomerData.js';

export class CrmService {
    // Categories
    async getCategories(): Promise<any[]> {
        return BusinessCategory.find().sort({ name: 1 }).lean().exec();
    }

    async createCategory(name: string): Promise<any> {
        const trimmed = name.trim();
        // Check if exists
        let cat = await BusinessCategory.findOne({ name: { $regex: new RegExp(`^${trimmed}$`, 'i') } });
        if (cat) return cat;

        cat = await BusinessCategory.create({ name: trimmed });
        return cat;
    }

    // Customer Data
    async getCustomerData(page: number = 1, limit: number = 50, search: string = ''): Promise<any> {
        const query: any = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { mobile_number: { $regex: search, $options: 'i' } },
                { business_name: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await CustomerData.countDocuments(query);
        const data = await CustomerData.find(query)
            .populate('business_category_id', 'name')
            .populate('entered_by', 'name')
            .sort({ created_at: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean()
            .exec();

        return {
            data,
            total,
            page,
            limit,
            total_pages: Math.ceil(total / limit),
        };
    }

    async checkCustomerExists(mobileNumber: string): Promise<boolean> {
        const existing = await CustomerData.findOne({ mobile_number: mobileNumber }).lean().exec();
        return !!existing;
    }

    async createCustomerData(data: {
        name: string;
        mobile_number: string;
        business_name: string;
        place: string;
        purchased_items: { product_name: string; price: number }[];
        business_category_id: string;
        entered_by: string;
    }): Promise<any> {
        return CustomerData.create({
            name: data.name,
            mobile_number: data.mobile_number,
            business_name: data.business_name,
            place: data.place,
            purchased_items: data.purchased_items,
            business_category_id: data.business_category_id,
            entered_by: data.entered_by,
        });
    }
}

export const crmService = new CrmService();
