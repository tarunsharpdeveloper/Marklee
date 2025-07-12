import Joi from 'joi';

const authSchema = {
  signup: Joi.object({
    name: Joi.string()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.empty': 'Username is required',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters',
      }),

    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email address'
      }),

    password: Joi.string()
      .min(6)
      .required()
      .pattern(new RegExp('^[a-zA-Z0-9!@#$%^&*()_+\\-=\\[\\]{};:\'",.<>/?]{6,}$'))
      .messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 6 characters long',
        'string.pattern.base': 'Password must contain valid characters'
      })
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email address'
      }),

    password: Joi.string()
      .required()
      .messages({
        'string.empty': 'Password is required'
      })
  }),
  verifyEmail: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.empty': 'Email is required',
     }),
     
     otp: Joi.string()
      .required()
      .messages({
        'string.empty': 'OTP is required',
      }),
  }),
  resendOTP: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.empty': 'Email is required',
      })
  }),
  onboarding: Joi.object({
    name: Joi.string()
      .required()
      .messages({
        'string.empty': 'Name is required'
      }),
    role: Joi.string()
      .required()
      .messages({
        'string.empty': 'Role is required'
      }),
    organizationType: Joi.string()
      .valid('Business', 'Non-profit', 'Personal Brand')
      .required()
      .messages({
        'string.empty': 'Organization type is required',
        'any.only': 'Organization type must be Business, Non-profit, or Personal Brand'
      }),
    organizationName: Joi.string()
      .required()
      .messages({
        'string.empty': 'Organization name is required'
      }),
    supportType: Joi.string()
      .required()
      .messages({
        'string.empty': 'Support type is required'
      }),
    productDescription: Joi.string()
      .required()
      .messages({
        'string.empty': 'Product/service description is required'
      }),
    businessModel: Joi.string()
      .valid('Value-add', 'Volume-based', 'Mission-driven')
      .required()
      .messages({
        'string.empty': 'Business model is required',
        'any.only': 'Business model must be Value-add, Volume-based, or Mission-driven'
      }),
    revenueModel: Joi.string()
      .valid('Accounts', 'Subscriptions', 'Services', 'Other')
      .required()
      .messages({
        'string.empty': 'Revenue model is required',
        'any.only': 'Revenue model must be Accounts, Subscriptions, Services, or Other'
      })
  })
};

export const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address'
    })
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'string.empty': 'Reset token is required'
    }),
  newPassword: Joi.string()
    .min(6)
    .required()
    .pattern(new RegExp('^[a-zA-Z0-9!@#$%^&*()_+\\-=\\[\\]{};:\'",.<>/?]{6,}$'))
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'Password must be at least 6 characters long',
      'string.pattern.base': 'Password must contain valid characters'
    })
});

export default authSchema; 
