const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  phoneNumber: { type: String, required: false },
  phoneVerified: { type: Boolean, default: false },
  gender: { type: String, enum: ['male', 'female', 'prefer not to say'], required: false },
  dob: { type: Date },
  bio: { type: String },
  instagram: { type: String },
  linkedin: { type: String },
  github: { type: String },
  googleId: { type: String, unique: true, sparse: true },
  thumbnail: { type: String },
  accessToken: String,
  refreshToken: { type: String, default: null },
});

userSchema.index({ email: 1, username: 1 });
userSchema.index(
  { phoneNumber: 1 },
  { unique: true, partialFilterExpression: { phoneNumber: { $exists: true, $ne: null } } }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
