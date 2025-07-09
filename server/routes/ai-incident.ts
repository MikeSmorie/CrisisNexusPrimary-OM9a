import { Router } from "express";
import { assessIncident, generateEmergencyResponse } from "../lib/incident-assessment";
import { analyzeIncident, analyzeCommunication, optimizeResourceDeployment, generateEmergencyAlert } from "../lib/openai-emergency";

const router = Router();

// AI Incident Assessment
router.post("/assess", async (req, res) => {
  try {
    const { description, incidentType, location } = req.body;
    
    if (!description) {
      return res.status(400).json({ error: "Description is required" });
    }

    const assessment = await assessIncident(description, incidentType, location);
    
    res.json({
      success: true,
      assessment
    });
  } catch (error) {
    console.error("AI incident assessment error:", error);
    res.status(500).json({ 
      error: "Failed to assess incident",
      message: error.message 
    });
  }
});

// Generate Emergency Response Plan
router.post("/response-plan", async (req, res) => {
  try {
    const { incidentData, availableResources } = req.body;
    
    if (!incidentData) {
      return res.status(400).json({ error: "Incident data is required" });
    }

    const responsePlan = await generateEmergencyResponse(incidentData, availableResources);
    
    res.json({
      success: true,
      responsePlan
    });
  } catch (error) {
    console.error("Emergency response plan generation error:", error);
    res.status(500).json({ 
      error: "Failed to generate response plan",
      message: error.message 
    });
  }
});

// AI Communication Analysis
router.post("/analyze-communication", async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const analysis = await analyzeCommunication(message, context);
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error("Communication analysis error:", error);
    res.status(500).json({ 
      error: "Failed to analyze communication",
      message: error.message 
    });
  }
});

// AI Resource Optimization
router.post("/optimize-resources", async (req, res) => {
  try {
    const { availableResources, activeIncidents, constraints } = req.body;
    
    if (!availableResources || !activeIncidents) {
      return res.status(400).json({ error: "Available resources and active incidents are required" });
    }

    const optimization = await optimizeResourceDeployment(availableResources, activeIncidents, constraints);
    
    res.json({
      success: true,
      optimization
    });
  } catch (error) {
    console.error("Resource optimization error:", error);
    res.status(500).json({ 
      error: "Failed to optimize resources",
      message: error.message 
    });
  }
});

// Generate Emergency Alert
router.post("/generate-alert", async (req, res) => {
  try {
    const { incidentType, severity, location, targetAudience } = req.body;
    
    if (!incidentType || !severity || !location) {
      return res.status(400).json({ error: "Incident type, severity, and location are required" });
    }

    const alert = await generateEmergencyAlert(incidentType, severity, location, targetAudience);
    
    res.json({
      success: true,
      alert
    });
  } catch (error) {
    console.error("Emergency alert generation error:", error);
    res.status(500).json({ 
      error: "Failed to generate alert",
      message: error.message 
    });
  }
});

// Full Incident Analysis (comprehensive)
router.post("/full-analysis", async (req, res) => {
  try {
    const { incidentType, description, location, reporterInfo } = req.body;
    
    if (!incidentType || !description) {
      return res.status(400).json({ error: "Incident type and description are required" });
    }

    const fullAnalysis = await analyzeIncident(incidentType, description, location, reporterInfo);
    
    res.json({
      success: true,
      analysis: fullAnalysis
    });
  } catch (error) {
    console.error("Full incident analysis error:", error);
    res.status(500).json({ 
      error: "Failed to perform full analysis",
      message: error.message 
    });
  }
});

export default router;