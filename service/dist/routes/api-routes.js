"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const refund_status_controller_1 = __importDefault(require("../controllers/refund-status-controller"));
const router = (0, express_1.Router)();
// Tax refund status routes
router.get('/refund-status/:taxFileId', refund_status_controller_1.default.getRefundStatus);
router.get('/refund-status/:taxFileId/history', refund_status_controller_1.default.getRefundStatusHistory);
router.post('/refund-status/:taxFileId/action-guidance', refund_status_controller_1.default.getActionGuidance);
// User routes
router.get('/users/:userId/tax-filings', refund_status_controller_1.default.getTaxFilings);
exports.default = router;
//# sourceMappingURL=api-routes.js.map