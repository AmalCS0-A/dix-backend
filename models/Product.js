import mongoose from 'mongoose';

// Same three categories the React filters already use in TD-TP 2.
export const CATEGORIES = ['Clubs', 'National teams', 'Retro'];

const productSchema = new mongoose.Schema(
  {
    // ---- the six fields required by the TP ----
    name: { type: String, required: [true, 'name is required'], trim: true, maxlength: 100 },
    description: { type: String, required: [true, 'description is required'], trim: true },
    price: {
      type: Number,
      required: [true, 'price is required'],
      min: [0, 'price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'category is required'],
      enum: { values: CATEGORIES, message: `category must be one of: ${CATEGORIES.join(', ')}` },
    },
    imageUrl: { type: String, required: [true, 'imageUrl is required'], trim: true },
    stock: {
      type: Number,
      required: [true, 'stock is required'],
      min: [0, 'stock cannot be negative'],
      validate: { validator: Number.isInteger, message: 'stock must be a whole number' },
    },

    // ---- optional fields kept from the TP2 shirts (the React app displays them) ----
    kit: { type: String, trim: true }, // Home / Away / Retro
    season: { type: String, trim: true }, // 26/27, 1982 ...
    league: { type: String, trim: true },
    country: { type: String, trim: true },
    oldPrice: { type: Number, min: 0 },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
    toJSON: {
      versionKey: false,
      // The React app uses "id", MongoDB uses "_id": we send "id" to the client.
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

export default mongoose.model('Product', productSchema);
