import mongoose from 'mongoose';

const collegeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    domain: { type: String, required: true, lowercase: true, trim: true },
    domainKey: { type: String, required: true, unique: true, index: true },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    versionKey: false,
  },
);

export const College = mongoose.model('College', collegeSchema);

