import mongoose from 'mongoose';

const selectionSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyVisit' },
    companyName: { type: String, required: true },
    selectedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    linkedin: { type: String, required: true, trim: true },
    collegeDomain: { type: String, required: true, lowercase: true, trim: true },
    collegeDomainKey: { type: String, required: true, index: true },
    selections: { type: [selectionSchema], default: [] },
  },
  {
    timestamps: { createdAt: 'registeredAt', updatedAt: 'updatedAt' },
    versionKey: false,
  },
);

studentSchema.index({ collegeDomainKey: 1, email: 1 });

export const Student = mongoose.model('Student', studentSchema);

