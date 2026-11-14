import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true, // MongoDB refuses two users with the same email
      lowercase: true,
      trim: true,
    },
    // Only the bcrypt hash is stored, never the real password.
    // select:false = the hash is not returned by queries unless we ask for it.
    passwordHash: { type: String, required: true, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

export default mongoose.model('User', userSchema);
