import { Router } from 'express';
import { 
  detectController, 
  optimizeController, 
  forecastController, 
  chatController,
  syncDataController
} from '../controllers/api.controller';
import { syncUserController } from '../controllers/auth.controller';
import { requestLogger } from '../middleware/logger';
import { verifyFirebaseToken } from '../middleware/auth';

const router = Router();

// Apply request logging specific to API paths
router.use(requestLogger);

// Setup API endpoint mappings
router.post('/detect', detectController);
router.post('/optimize', optimizeController);
router.post('/forecast', forecastController);
router.post('/chat', chatController);
router.post('/sync/data', syncDataController);

// Auth Sync Route (Verifies Firebase token and syncs to MongoDB Atlas)
router.post('/auth/sync', verifyFirebaseToken, syncUserController);









// Import the 100 required API endpoints
import {
  getSubscriptions, getSubscriptionById, createSubscription, updateSubscription, deleteSubscription,
  getSubscriptionsSummary, getSubscriptionsByCategory, getSubscriptionsByCurrency, bulkImportSubscriptions, archiveSubscription,
  getPayments, getPaymentById, createPayment, updatePayment, deletePayment,
  getMonthlyPaymentStats, getAnnualPaymentStats, uploadPaymentInvoice, getPaymentInvoiceHistory, retryFailedPayment,
  getIntegrations, getIntegrationById, connectIntegration, disconnectIntegration, getIntegrationSyncStatus,
  slackWebhook, testSlackIntegration, teamsWebhook, authorizeGSuite, gsuiteCallback,
  getUsers, getUserById, updateUser, getTeams, addTeamMember,
  deleteTeamMember, updateTeamRoles, getTeamInvitations, createTeamInvitation, cancelTeamInvitation,
  getAiInsights, generateAiInsights, getAiRecommendations, applyAiRecommendation, dismissAiRecommendation,
  getAiScans, analyzeAiScan, getAiChats, getAiChatById, deleteAiChat,
  getAlerts, createAlert, updateAlert, deleteAlert, getAlertHistory,
  testAlert, getNotifications, readAllNotifications, dismissNotification, getNotificationPreferences,
  getSecurityLogs, getSecurityVulnerabilities, runSecurityScan, getSecurityDevices, revokeSecurityDevice,
  getHelpFaqs, createHelpTicket, getHelpTicketById, getSystemHealth, getSystemInfo,
  getFinancialForecasts, getCostAnomalies, getHistoricalSpend, getDepartmentSpend, getSaaSUtilization,
  optimizeForecastModel, getRenewalCalendars, downloadFinanceExcel, getBudgetSettings, updateBudgetSettings,
  getWebhookEvents, getWebhookEventById, createWebhookEndpoint, deleteWebhookEndpoint, getAuditLogs,
  clearAuditLogs, getSmsLogHistory, triggerManualWebhook, getActiveConnectionsCount, resetAllWebhooks,
  getDatabaseBackups, createDatabaseBackup, restoreDatabaseFromBackup, deleteDatabaseBackup, getDatabaseStats,
  runDatabaseMaintenance, checkApiHealth, clearSystemCaches, getMaintenanceWindows, setMaintenanceMode
} 

// Apply request logging specific to API paths
router.use(requestLogger);

// Setup API endpoint mappings
router.post('/detect', detectController);
router.post('/optimize', optimizeController);
router.post('/forecast', forecastController);
router.post('/chat', chatController);
router.post('/sync/data', syncDataController);

// Auth Sync Route (Verifies Firebase token and syncs to MongoDB Atlas)
router.post('/auth/sync', verifyFirebaseToken, syncUserController);


// ----------------------------------------------------
// 70 MANDATORY SYSTEM ROUTE MAPPINGS (REST & CONTROLS)
// ----------------------------------------------------

// 1-10: Subscriptions Management
router.get('/subscriptions', getSubscriptions);
router.get('/subscriptions/:id', getSubscriptionById);
router.post('/subscriptions', createSubscription);
router.put('/subscriptions/:id', updateSubscription);
router.delete('/subscriptions/:id', deleteSubscription);
router.get('/subscriptions/analytics/summary', getSubscriptionsSummary);
router.get('/subscriptions/analytics/by-category', getSubscriptionsByCategory);
router.get('/subscriptions/analytics/by-currency', getSubscriptionsByCurrency);
router.post('/subscriptions/bulk-import', bulkImportSubscriptions);
router.post('/subscriptions/archive', archiveSubscription);

// 11-20: Payments & Invoices
router.get('/payments', getPayments);
router.get('/payments/:id', getPaymentById);
router.post('/payments', createPayment);
router.put('/payments/:id', updatePayment);
router.delete('/payments/:id', deletePayment);
router.get('/payments/stats/monthly', getMonthlyPaymentStats);
router.get('/payments/stats/annual', getAnnualPaymentStats);
router.post('/payments/invoice/upload', uploadPaymentInvoice);
router.get('/payments/invoice/history', getPaymentInvoiceHistory);
router.post('/payments/retry', retryFailedPayment);

// 21-30: SaaS Integrations
router.get('/integrations', getIntegrations);
router.get('/integrations/:id', getIntegrationById);
router.post('/integrations/connect', connectIntegration);
router.post('/integrations/disconnect', disconnectIntegration);
router.get('/integrations/sync-status', getIntegrationSyncStatus);
router.post('/integrations/slack/webhook', slackWebhook);
router.post('/integrations/slack/test', testSlackIntegration);
router.post('/integrations/teams/webhook', teamsWebhook);
router.post('/integrations/gsuite/authorize', authorizeGSuite);
router.get('/integrations/gsuite/callback', gsuiteCallback);

// 31-40: Users & Team Management
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.get('/teams', getTeams);
router.post('/teams/members', addTeamMember);
router.delete('/teams/members/:id', deleteTeamMember);
router.put('/teams/roles', updateTeamRoles);
router.get('/teams/invitations', getTeamInvitations);
router.post('/teams/invitations', createTeamInvitation);
router.post('/teams/invitations/cancel', cancelTeamInvitation);

// 41-50: AI Insights & Auditing
router.get('/ai/insights', getAiInsights);
router.post('/ai/insights/generate', generateAiInsights);
router.get('/ai/recommendations', getAiRecommendations);
router.post('/ai/recommendations/apply', applyAiRecommendation);
router.post('/ai/recommendations/dismiss', dismissAiRecommendation);
router.get('/ai/scans', getAiScans);
router.post('/ai/scans/analyze', analyzeAiScan);
router.get('/ai/chats', getAiChats);
router.get('/ai/chats/:id', getAiChatById);
router.delete('/ai/chats/:id', deleteAiChat);

// 51-60: Alerts & Rules Control
router.get('/alerts', getAlerts);
router.post('/alerts', createAlert);
router.put('/alerts/:id', updateAlert);
router.delete('/alerts/:id', deleteAlert);
router.get('/alerts/history', getAlertHistory);
router.post('/alerts/test', testAlert);
router.get('/notifications', getNotifications);
router.post('/notifications/read-all', readAllNotifications);
router.post('/notifications/dismiss', dismissNotification);
router.get('/notifications/preferences', getNotificationPreferences);

// 61-70: Security, Helpdesk, and Systems Core
router.get('/security/logs', getSecurityLogs);
router.get('/security/vulnerabilities', getSecurityVulnerabilities);
router.post('/security/scan', runSecurityScan);
router.get('/security/devices', getSecurityDevices);
router.post('/security/devices/revoke', revokeSecurityDevice);
router.get('/help/faqs', getHelpFaqs);
router.post('/help/tickets', createHelpTicket);
router.get('/help/tickets/:id', getHelpTicketById);
router.get('/system/health', getSystemHealth);
router.get('/system/info', getSystemInfo);

// 71-80: Advanced Reports & Financial Forecasts
router.get('/reports/forecasts', getFinancialForecasts);
router.get('/reports/anomalies', getCostAnomalies);
router.get('/reports/history', getHistoricalSpend);
router.get('/reports/department-spend', getDepartmentSpend);
router.get('/reports/saas-utilization', getSaaSUtilization);
router.post('/reports/forecasts/optimize', optimizeForecastModel);
router.get('/reports/calendars', getRenewalCalendars);
router.get('/reports/excel/download', downloadFinanceExcel);
router.get('/reports/budget/settings', getBudgetSettings);
router.put('/reports/budget/settings', updateBudgetSettings);

// 81-90: Custom Webhook Event logs & Audit Trail
router.get('/webhooks/events', getWebhookEvents);
router.get('/webhooks/events/:id', getWebhookEventById);
router.post('/webhooks/endpoints', createWebhookEndpoint);
router.delete('/webhooks/endpoints/:id', deleteWebhookEndpoint);
router.get('/webhooks/audit-logs', getAuditLogs);
router.delete('/webhooks/audit-logs', clearAuditLogs);
router.get('/webhooks/sms-history', getSmsLogHistory);
router.post('/webhooks/trigger', triggerManualWebhook);
router.get('/webhooks/active-connections', getActiveConnectionsCount);
router.post('/webhooks/reset', resetAllWebhooks);

// 91-100: Database Backups, Restore & Maintenance APIs
router.get('/db/backups', getDatabaseBackups);
router.post('/db/backups', createDatabaseBackup);
router.post('/db/backups/restore', restoreDatabaseFromBackup);
router.delete('/db/backups/:id', deleteDatabaseBackup);
router.get('/db/stats', getDatabaseStats);
router.post('/db/maintenance/run', runDatabaseMaintenance);
router.get('/db/routes-health', checkApiHealth);
router.post('/db/cache/clear', clearSystemCaches);
router.get('/db/maintenance-windows', getMaintenanceWindows);
router.post('/db/maintenance-mode', setMaintenanceMode);

















export default router;







