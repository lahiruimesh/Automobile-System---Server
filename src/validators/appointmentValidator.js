import Joi from "joi";

/**
 * Validation schemas for appointment-related requests
 */

export const createAppointmentSchema = Joi.object({
  vehicle_id: Joi.number().integer().positive().required().messages({
    "number.base": "Vehicle ID must be a number",
    "number.positive": "Vehicle ID must be positive",
    "any.required": "Vehicle ID is required",
  }),
  slot_id: Joi.number().integer().positive().required().messages({
    "number.base": "Slot ID must be a number",
    "number.positive": "Slot ID must be positive",
    "any.required": "Slot ID is required",
  }),
  service_type: Joi.string()
    .valid(
      "oil_change",
      "tire_rotation",
      "brake_service",
      "engine_diagnostic",
      "transmission",
      "ac_service",
      "general_maintenance",
      "body_work",
      "detailing",
      "custom_modification"
    )
    .required()
    .messages({
      "string.base": "Service type must be a string",
      "any.only": "Invalid service type",
      "any.required": "Service type is required",
    }),
  notes: Joi.string().max(500).allow("", null).messages({
    "string.max": "Notes cannot exceed 500 characters",
  }),
});

export const cancelAppointmentSchema = Joi.object({
  reason: Joi.string().min(3).max(500).required().messages({
    "string.base": "Reason must be a string",
    "string.min": "Reason must be at least 3 characters",
    "string.max": "Reason cannot exceed 500 characters",
    "any.required": "Cancellation reason is required",
  }),
});

export const getSlotsSchema = Joi.object({
  date: Joi.date().iso().required().messages({
    "date.base": "Date must be a valid date",
    "date.format": "Date must be in ISO format (YYYY-MM-DD)",
    "any.required": "Date is required",
  }),
  service_type: Joi.string()
    .valid(
      "oil_change",
      "tire_rotation",
      "brake_service",
      "engine_diagnostic",
      "transmission",
      "ac_service",
      "general_maintenance",
      "body_work",
      "detailing",
      "custom_modification"
    )
    .optional()
    .messages({
      "any.only": "Invalid service type",
    }),
});

export const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid("pending", "confirmed", "in_progress", "completed", "cancelled")
    .required()
    .messages({
      "any.only": "Invalid status",
      "any.required": "Status is required",
    }),
  completionNotes: Joi.string()
    .max(1000)
    .optional()
    .allow("", null)
    .messages({
      "string.max": "Completion notes cannot exceed 1000 characters",
    }),
});

export const createVehicleSchema = Joi.object({
  make: Joi.string().min(2).max(100).required().messages({
    "string.min": "Make must be at least 2 characters",
    "string.max": "Make cannot exceed 100 characters",
    "any.required": "Vehicle make is required",
  }),
  model: Joi.string().min(1).max(100).required().messages({
    "string.min": "Model must be at least 1 character",
    "string.max": "Model cannot exceed 100 characters",
    "any.required": "Vehicle model is required",
  }),
  year: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .required()
    .messages({
      "number.min": "Year must be 1900 or later",
      "number.max": `Year cannot be later than ${new Date().getFullYear() + 1}`,
      "any.required": "Vehicle year is required",
    }),
  vin: Joi.string().length(17).optional().allow("", null).messages({
    "string.length": "VIN must be exactly 17 characters",
  }),
  license_plate: Joi.string().max(20).optional().allow("", null).messages({
    "string.max": "License plate cannot exceed 20 characters",
  }),
  color: Joi.string().max(50).optional().allow("", null).messages({
    "string.max": "Color cannot exceed 50 characters",
  }),
});
