/**
 * Master Development Workflow Script for Electron
 * Orchestrates all development tasks with intelligent flow control
 */

import { SetupVerifier } from './setup-verification.js';
import { AssetManager } from './asset-manager.js';
import { SecurityValidator } from './security-validator.js';
import { DiagnosticsSystem } from './diagnostics-system.js';
import { ElectronBuilder } from './electron-builder.js';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WorkflowManager {
  constructor() {
    this.baseDir = path.join(__dirname, '..');
    this.logFile = path.join(this.baseDir, 'logs', 'workflow.log');
  }

  async ensureLogsDir() {
    const logsDir = path.join(this.baseDir, 'logs');
    try {
      await fs.access(logsDir);
    } catch {
      await fs.mkdir(logsDir, { recursive: true });
    }
  }

  async log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    console.log(message);
    
    try {
      await this.ensureLogsDir();
      await fs.appendFile(this.logFile, logEntry);
    } catch (error) {
      console.warn('Could not write to log file:', error.message);
    }
  }

  async runHealthCheck() {
    await this.log('🏥 Running comprehensive health check...');
    
    const results = {};
    
    try {
      // System diagnostics
      await this.log('🔧 Running system diagnostics...');
      const diagnostics = new DiagnosticsSystem();
      results.diagnostics = await diagnostics.runFullDiagnostics();
      
      // Setup verification
      await this.log('🔍 Running setup verification...');
      const verifier = new SetupVerifier();
      results.verification = await verifier.runFullVerification();
      
      // Security audit
      await this.log('🔒 Running security audit...');
      const secValidator = new SecurityValidator();
      results.security = await secValidator.runFullSecurityAudit();
      
      // Asset integrity
      await this.log('📦 Checking asset integrity...');
      const assetManager = new AssetManager();
      results.assets = await assetManager.validateAssetIntegrity();
      
      // Generate health score
      const healthScore = this.calculateHealthScore(results);
      
      await this.log(`📊 Overall Health Score: ${healthScore}/100`);
      
      if (healthScore >= 80) {
        await this.log('🟢 System is healthy!');
      } else if (healthScore >= 60) {
        await this.log('🟡 System has some issues but is functional');
      } else {
        await this.log('🔴 System has serious issues requiring attention');
      }
      
      return { healthScore, results };
      
    } catch (error) {
      await this.log(`❌ Health check failed: ${error.message}`);
      throw error;
    }
  }

  calculateHealthScore(results) {
    let score = 100;
    
    // Deduct for verification errors
    if (results.verification) {
      score -= results.verification.errors.length * 10;
      score -= results.verification.warnings.length * 2;
    }
    
    // Deduct for security issues
    if (results.security) {
      score -= results.security.criticalIssues * 20;
      score -= results.security.warnings * 5;
    }
    
    // Deduct for diagnostics issues
    if (results.diagnostics?.report?.summary) {
      score -= results.diagnostics.report.summary.totalIssues * 5;
    }
    
    // Deduct for asset issues
    if (results.assets && !results.assets.valid) {
      score -= results.assets.issues.length * 3;
    }
    
    return Math.max(0, Math.round(score));
  }

  async printHelp() {
    const helpText = `
🛠️  RdLn Electron Development Workflow Manager

📋 Available Commands:

🚀 Setup & Development:
   npm run workflow:health    - Run comprehensive health check

🔍 Verification:
   npm run verify:setup       - Verify setup completeness
   npm run verify:assets      - Verify asset integrity
   npm run verify:security    - Verify security configuration
   npm run diagnose           - Run detailed diagnostics

💡 Quick Start:
   1. npm run verify:setup
   2. npm run workflow:health
   3. npm run electron:dev
   4. npm run electron:build:win

📁 Output:
   - Logs: logs/workflow.log
   - Reports: diagnostic-reports/
   - Builds: dist-electron-new/
`;
    
    console.log(helpText);
  }
}

// Export for use in package.json scripts
export { WorkflowManager };

// Command-line interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const manager = new WorkflowManager();
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'health':
        await manager.runHealthCheck();
        break;
        
      case 'help':
      default:
        await manager.printHelp();
        break;
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Workflow failed:', error.message);
    process.exit(1);
  }
}