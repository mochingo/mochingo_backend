import mongoose, { Document, Schema } from 'mongoose';

export interface IIdCardTemplate extends Document {
    name: string;
    cardW: number;
    cardH: number;
    frontFields: any[];
    backFields: any[];
    createdAt: Date;
    updatedAt: Date;
}

const canvasFieldSchema = new Schema({
    id: { type: String, required: true },
    type: { type: String, required: true }, // 'text', 'image', 'qrcode'
    fieldKey: { type: String, required: true },
    label: { type: String, required: true },
    xPct: { type: Number, required: true },
    yPct: { type: Number, required: true },
    fontSize: { type: Number },
    fontFamily: { type: String },
    color: { type: String },
    bold: { type: Boolean },
    italic: { type: Boolean },
    widthPct: { type: Number },
    heightPct: { type: Number },
    borderRadius: { type: Number },
    overrideText: { type: String }
}, { _id: false });

const IdCardTemplateSchema: Schema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        cardW: { type: Number, required: true },
        cardH: { type: Number, required: true },
        frontFields: [canvasFieldSchema],
        backFields: [canvasFieldSchema],
    },
    {
        timestamps: true,
    }
);

export const IdCardTemplate = mongoose.model<IIdCardTemplate>('IdCardTemplate', IdCardTemplateSchema);
