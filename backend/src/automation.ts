#!/usr/bin/env node
/**
 * Elite Curators Automation Startup Script
 * 
 * This script will handle the automated discovery of elite curators
 * when the server starts. It runs in the background and continuously 
 * monitors for new curators to analyze.
 */

import { EliteCuratorsService } from './services/eliteCuratorsService';

class AutomationManager {
  private eliteCuratorsService: EliteCuratorsService;
  private isRunning: boolean = false;

  constructor() {
    this.eliteCuratorsService = new EliteCuratorsService();
  }

  async start() {
    if (this.isRunning) {
      console.log('Automation is already running');
      return;
    }

    console.log('🚀 Starting Elite Curators Automation...');
    this.isRunning = true;

    try {
      // Start the automation loop for elite curators discovery
      console.log('🔄 Starting Elite Curators automation loop...');
      await this.eliteCuratorsService.runAutomation();
    } catch (error) {
      console.error('❌ Automation error:', error);
      this.isRunning = false;
    }
  }

  async stop() {
    console.log('🛑 Stopping Elite Curators Automation...');
    this.isRunning = false;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      timestamp: new Date().toISOString()
    };
  }
}

// Create global instance
const automationManager = new AutomationManager();

// Export for use in other modules
export { automationManager };

// Auto-start if this file is run directly
// if (require.main === module) {
//   automationManager.start().catch(error => {
//     console.error('Failed to start automation:', error);
//     process.exit(1);
//   });
// }

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await automationManager.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await automationManager.stop();
  process.exit(0);
}); 