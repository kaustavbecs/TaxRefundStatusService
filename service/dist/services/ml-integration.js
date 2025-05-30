"use strict";
/**
 * ML Integration Service
 *
 * This service integrates with the ML API to get predictions for tax refund processing times.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrediction = getPrediction;
exports.checkMLApiHealth = checkMLApiHealth;
exports.getModelMetadata = getModelMetadata;
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
// Load environment variables
dotenv.config();
// ML API configuration
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:9090';
/**
 * Get a prediction for tax refund processing time
 */
async function getPrediction(filingType, taxYear, refundAmount, geographicRegion, processingCenter, filingPeriod) {
    try {
        // Create request payload
        const payload = {
            filing_type: filingType,
            tax_year: taxYear,
            refund_amount: refundAmount,
            geographic_region: geographicRegion,
            processing_center: processingCenter,
            filing_period: filingPeriod,
            source_status: 'Processing',
            target_status: 'Approved'
        };
        // Make API request
        const response = await axios_1.default.post(`${ML_API_URL}/predict`, payload, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000 // 5 second timeout
        });
        return response.data;
    }
    catch (error) {
        console.error('Error getting prediction from ML API:', error);
        return null;
    }
}
/**
 * Check if the ML API is available
 */
async function checkMLApiHealth() {
    try {
        const response = await axios_1.default.get(`${ML_API_URL}/health`, {
            timeout: 2000 // 2 second timeout
        });
        return response.data.status === 'ok';
    }
    catch (error) {
        console.error('ML API health check failed:', error);
        return false;
    }
}
/**
 * Get ML model metadata
 */
async function getModelMetadata() {
    try {
        const response = await axios_1.default.get(`${ML_API_URL}/metadata`, {
            timeout: 2000 // 2 second timeout
        });
        return response.data;
    }
    catch (error) {
        console.error('Error getting ML model metadata:', error);
        return null;
    }
}
// Export default object
exports.default = {
    getPrediction,
    checkMLApiHealth,
    getModelMetadata
};
//# sourceMappingURL=ml-integration.js.map