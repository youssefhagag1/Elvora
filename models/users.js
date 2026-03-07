const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'seller' , 'admin'],
        default: 'user'
    },
    photo : {
        type: String,
        default : "default.png"
    },
    phone: {
        type: String,
        default: null
    },
    address: {
        street: {
            type: String,
            default: null
        },
        city: {
            type: String,
            default: null
        },
        state: {
            type: String,
            default: null
        },
        postalCode: {
            type: String,
            default: null
        },
        country: {
            type: String,
            default: null
        }
    },
    socialMediaLinks: {
        facebook: {
            type: String,
            default: null
        },
        twitter: {
            type: String,
            default: null
        },
        instagram: {
            type: String,
            default: null
        },
        linkedin: {
            type: String,
            default: null
        }
    },
    orderHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    isActive: {
        type: Boolean,
        default: true
    }
} , { timestamps: true });

// include virtuals when converting documents to JSON or objects
userSchema.set('toObject', { virtuals: true });

// virtual property that builds a full URL for the avatar
userSchema.virtual("avatar").get(function () {
    const baseURL = process.env.BASE_URL || "http://localhost:3000";
    return `${baseURL}/uploads/${this.photo}`;
});

userSchema.set("toJSON", {
    virtuals: true  , 
    transform: (doc, ret) => {
        delete ret.password
        delete ret.photo;
        delete ret._id;
        delete ret.__v;
    }
});


module.exports = mongoose.model('User', userSchema);