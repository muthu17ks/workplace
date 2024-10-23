const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    name: { type: String, required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'File', default: null },
    type: { type: String, enum: ['folder', 'file'], required: true },
    path: { type: String },
    size: { type: Number },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    mimeType: { type: String },
    tags: [{ type: String }],
    permissions: { type: Map, of: Boolean },
    version: { type: Number, default: 1 },
    lastAccessed: { type: Date },
    fileExtension: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('File', fileSchema);
