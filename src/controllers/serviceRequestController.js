import ServiceRequest from "../models/ServiceRequest.js";

export const createServiceRequest = async (req, res) => {
  try {
    const { serviceType, description, vehicleInfo } = req.body;
    const userId = req.user.id;

    const serviceRequest = await ServiceRequest.create({
      userId,
      serviceType,
      description,
      vehicleInfo
    });

    res.status(201).json({
      success: true,
      data: serviceRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getUserRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await ServiceRequest.findByUserId(userId);

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.findAll();

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progress } = req.body;

    const updatedRequest = await ServiceRequest.updateStatus(id, status, progress);

    if (!updatedRequest) {
      return res.status(404).json({
        success: false,
        message: "Service request not found"
      });
    }

    // Emit real-time update via WebSocket (if available)
    if (req.io) {
      req.io.emit('statusUpdate', {
        requestId: id,
        status,
        progress,
        updatedAt: updatedRequest.updated_at
      });
    }

    res.json({
      success: true,
      data: updatedRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};