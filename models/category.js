const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        default: null
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// include virtuals when converting documents to JSON or objects
categorySchema.set('toObject', { virtuals: true });

// virtual property that builds a full URL for the image
categorySchema.virtual('imageURL').get(function () {
    const baseURL = process.env.BASE_URL || 'http://localhost:3000';
    return  `${baseURL}/uploads/${this.image}`;
});


categorySchema.set("toJSON", {
    virtuals: true  , 
    transform: (doc, ret) => {
        delete ret.image;
        delete ret._id;
        delete ret.__v;
    }
});

module.exports = mongoose.model('Category', categorySchema);
