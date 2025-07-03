const { Schema, default: mongoose } = require('mongoose');

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: [true, 'Category must be unique'],
      minLength: [3, 'Too short category name'],
      maxLength: [32, 'Too long category name'],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    image: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }, // timestamps creates two fields created at and updated at
);

// to view the subcategories in the parent category
categorySchema.virtual('subCategories', {
  ref: 'SubCategory',
  foreignField: 'category',
  localField: '_id',
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
