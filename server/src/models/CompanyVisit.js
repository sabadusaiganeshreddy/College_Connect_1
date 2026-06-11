import mongoose from 'mongoose';

const companyVisitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nameKey: { type: String, required: true, lowercase: true, trim: true },
    visitDate: { type: Date },
    jobRoles: { type: [String], default: [] },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    collegeDomain: { type: String, required: true, lowercase: true, trim: true },
    collegeDomainKey: { type: String, required: true, index: true },
    selectedStudentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    totalSelections: { type: Number },
  },
  {
    timestamps: { createdAt: 'addedAt', updatedAt: 'updatedAt' },
    versionKey: false,
  },
);

companyVisitSchema.index({ collegeDomainKey: 1, nameKey: 1 }, { unique: true });
companyVisitSchema.index({ nameKey: 1 });

export const CompanyVisit = mongoose.model('CompanyVisit', companyVisitSchema);

