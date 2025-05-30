const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = {};
      
      error.details.forEach((detail) => {
        errors[detail.path[0]] = detail.message;
      });

      return res.status(400).json({
        message: 'Validation failed',
        errors
      });
    }
    
    next();
  };
};

module.exports = validateRequest; 