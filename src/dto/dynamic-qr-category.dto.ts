export interface CreateDynamicQRCategoryDto {
    name: string;
    slug?: string;
    description?: string;
}

export interface UpdateDynamicQRCategoryDto {
    name?: string;
    slug?: string;
    description?: string;
}

export interface DynamicQRCategoryResponseDto {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    in_use?: boolean;
    created_at: string;
    updated_at: string;
}
