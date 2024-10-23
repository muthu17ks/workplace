const { Schema, model } = require("mongoose");

const DocumentSchema = new Schema(
  {
    _id: String,
    name: { type: String, required: true },
    data: { type: Object, required: true },
    preview: { type: String, default: '' },
    size: { type: Number, default: 0 },
    parent: { type: String, default: 'Documents' }
  },
  { timestamps: true }
);

module.exports = model("Document", DocumentSchema);
