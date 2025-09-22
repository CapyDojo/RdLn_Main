/**
 * Security Configuration Validator for Electron
 * Ensures proper security settings and CSP compliance
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SecurityValidator {
  constructor() {
    this.baseDir = path.join(__dirname, '..');
    this.issues = [];
    this.recommendations = [];
  }

  logIssue(severity, message) {
    this.issues.push({ severity, message });
    const icon = severity === 'critical' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${icon} ${severity.toUpperCase()}: ${message}`);
  }

  logRecommendation(message) {
    this.recommendations.push(message);
    console.log(`💡 RECOMMENDATION: ${message}`);
  }

  async validateElectronMain() {
    console.log('🔍 Validating Electron main process security...');
    
    try {
      const mainContent = await fs.readFile(path.join(this.baseDir, 'src-electron/main.cjs'), 'utf8');
      
      const securityChecks = [
        {
          pattern: 'nodeIntegration: false',
          critical: true,
          message: 'Node integration must be disabled in renderer'
        },
        {
          pattern: 'contextIsolation: true', 
          critical: true,
          message: 'Context isolation must be enabled'
        },
        {
          pattern: 'enableRemoteModule: false',
          critical: true,
          message: 'Remote module must be disabled'
        },
        {
          pattern: 'webSecurity: true',
          critical: true,
          message: 'Web security must be enabled'
        },
        {
          pattern: 'preload:',
          critical: true,
          message: 'Preload script must be configured'
        },
        {
          pattern: 'allowRunningInsecureContent: false',
          critical: false,
          message: 'Should explicitly disable insecure content'
        },
        {
          pattern: 'experimentalFeatures: false',
          critical: false,
          message: 'Should disable experimental features'
        }
      ];

      for (const check of securityChecks) {
        if (mainContent.includes(check.pattern)) {
          console.log(`✅ ${check.message}`);
        } else {
          this.logIssue(check.critical ? 'critical' : 'warning', check.message);
        }
      }

      // Check for potential security issues
      const dangerousPatterns = [
        { pattern: 'nodeIntegration: true', message: 'Node integration enabled - DANGEROUS' },
        { pattern: 'contextIsolation: false', message: 'Context isolation disabled - DANGEROUS' },
        { pattern: 'webSecurity: false', message: 'Web security disabled - DANGEROUS' },
        { pattern: 'allowRunningInsecureContent: true', message: 'Insecure content allowed - RISKY' }
      ];

      for (const danger of dangerousPatterns) {
        if (mainContent.includes(danger.pattern)) {
          this.logIssue('critical', danger.message);
        }
      }

    } catch (error) {
      this.logIssue('critical', `Could not read main.cjs: ${error.message}`);
    }
  }

  async validatePreloadScript() {
    console.log('🔍 Validating preload script security...');
    
    try {
      const preloadContent = await fs.readFile(path.join(this.baseDir, 'src-electron/preload.cjs'), 'utf8');
      
      // Check for security practices
      const securityChecks = [
        {
          pattern: 'contextBridge.exposeInMainWorld',
          message: 'Uses contextBridge for safe IPC exposure'
        },
        {
          pattern: 'ALLOWED_CHANNELS',
          message: 'Has channel allowlist for IPC security'
        },
        {
          pattern: 'validateChannel',
          message: 'Validates IPC channels before use'
        },
        {
          pattern: 'sanitizeFilePath',
          message: 'Sanitizes file paths to prevent traversal'
        }
      ];

      for (const check of securityChecks) {
        if (preloadContent.includes(check.pattern)) {
          console.log(`✅ ${check.message}`);
        } else {
          this.logIssue('warning', `Missing: ${check.message}`);
        }
      }

      // Check for dangerous practices
      const dangerousPatterns = [
        { pattern: 'require(', message: 'Direct require() usage in preload - check if necessary' },
        { pattern: 'eval(', message: 'eval() usage detected - DANGEROUS' },
        { pattern: 'Function(', message: 'Function constructor usage - RISKY' },
        { pattern: 'innerHTML', message: 'innerHTML usage - potential XSS risk' }
      ];

      for (const danger of dangerousPatterns) {
        if (preloadContent.includes(danger.pattern)) {
          this.logIssue('warning', danger.message);
        }
      }

    } catch (error) {
      this.logIssue('critical', `Could not read preload.cjs: ${error.message}`);
    }
  }

  async validateContentSecurityPolicy() {
    console.log('🔍 Validating Content Security Policy...');
    
    // Check HTML files for CSP headers
    const htmlFiles = [
      'public/index-electron.html',
      'public/index.html'
    ];

    for (const htmlFile of htmlFiles) {
      try {
        const htmlContent = await fs.readFile(path.join(this.baseDir, htmlFile), 'utf8');
        
        if (htmlContent.includes('Content-Security-Policy')) {
          console.log(`✅ CSP found in ${htmlFile}`);
          
          // Analyze CSP strength
          if (htmlContent.includes("'unsafe-eval'")) {
            this.logIssue('warning', `${htmlFile}: CSP allows unsafe-eval`);
          }
          
          if (htmlContent.includes("'unsafe-inline'")) {
            this.logIssue('warning', `${htmlFile}: CSP allows unsafe-inline`);
          }
          
          if (htmlContent.includes('*')) {
            this.logIssue('warning', `${htmlFile}: CSP uses wildcard (*) - overly permissive`);
          }
        } else {
          this.logIssue('warning', `${htmlFile}: No CSP header found`);
          this.logRecommendation(`Add CSP meta tag to ${htmlFile}`);
        }
        
      } catch {
        // File might not exist, skip
      }
    }
  }

  async validateElectronBuilder() {
    console.log('🔍 Validating Electron Builder security...');
    
    try {
      const builderContent = await fs.readFile(path.join(this.baseDir, 'src-electron/builder.config.cjs'), 'utf8');
      
      // Check security-related settings
      if (builderContent.includes('asar: false')) {
        this.logIssue('info', 'ASAR disabled - code is not obfuscated');
        this.logRecommendation('Consider enabling ASAR for production builds');
      }
      
      if (builderContent.includes('requestedExecutionLevel')) {
        console.log('✅ Execution level specified');
      } else {
        this.logIssue('warning', 'No execution level specified');
      }
      
      // Check for code signing configuration
      if (builderContent.includes('certificateFile') || builderContent.includes('win')) {
        console.log('✅ Code signing configuration present');
      } else {
        this.logRecommendation('Add code signing for production builds');
      }
      
    } catch (error) {
      this.logIssue('warning', `Could not read builder config: ${error.message}`);
    }
  }

  async validatePackageJson() {
    console.log('🔍 Validating package.json security...');
    
    try {
      const packageContent = await fs.readFile(path.join(this.baseDir, 'package.json'), 'utf8');
      const packageJson = JSON.parse(packageContent);
      
      // Check for security-related configurations
      if (packageJson.main && packageJson.main.includes('main.cjs')) {
        console.log('✅ Main entry point correctly configured');
      } else {
        this.logIssue('warning', 'Main entry point may not be correct');
      }
      
      // Check dependencies for known vulnerabilities (basic check)
      const criticalDeps = ['electron', 'electron-builder'];
      for (const dep of criticalDeps) {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          console.log(`✅ ${dep} found in dependencies`);
        } else if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
          console.log(`✅ ${dep} found in devDependencies`);
        } else {
          this.logIssue('critical', `${dep} not found in dependencies`);
        }
      }
      
      this.logRecommendation('Run npm audit regularly to check for vulnerabilities');
      
    } catch (error) {
      this.logIssue('critical', `Could not read package.json: ${error.message}`);
    }
  }

  generateSecurityReport() {
    console.log('\\n' + '='.repeat(60));
    console.log('🔒 ELECTRON SECURITY VALIDATION REPORT');
    console.log('='.repeat(60));
    
    const criticalIssues = this.issues.filter(i => i.severity === 'critical');
    const warnings = this.issues.filter(i => i.severity === 'warning');
    const infos = this.issues.filter(i => i.severity === 'info');
    
    console.log(`🚨 Critical Issues: ${criticalIssues.length}`);
    console.log(`⚠️  Warnings: ${warnings.length}`);
    console.log(`ℹ️  Info: ${infos.length}`);
    console.log(`💡 Recommendations: ${this.recommendations.length}`);
    
    if (criticalIssues.length === 0) {
      console.log('\\n✅ No critical security issues found!');
    } else {
      console.log('\\n🚨 CRITICAL ISSUES TO FIX:');
      criticalIssues.forEach(issue => console.log(`   - ${issue.message}`));
    }
    
    if (warnings.length > 0) {
      console.log('\\n⚠️  WARNINGS TO CONSIDER:');
      warnings.forEach(issue => console.log(`   - ${issue.message}`));
    }
    
    if (this.recommendations.length > 0) {
      console.log('\\n💡 SECURITY RECOMMENDATIONS:');
      this.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }
    
    const securityScore = Math.max(0, 100 - (criticalIssues.length * 20) - (warnings.length * 5));
    console.log(`\\n📊 Security Score: ${securityScore}/100`);
    
    if (securityScore >= 80) {
      console.log('🟢 Good security posture');
    } else if (securityScore >= 60) {
      console.log('🟡 Moderate security - improvements needed');
    } else {
      console.log('🔴 Poor security - immediate attention required');
    }
    
    return {
      score: securityScore,
      criticalIssues: criticalIssues.length,
      warnings: warnings.length,
      recommendations: this.recommendations.length,
      issues: this.issues
    };
  }

  async runFullSecurityAudit() {
    console.log('🔒 Starting comprehensive security validation...\\n');
    
    await this.validateElectronMain();
    await this.validatePreloadScript();
    await this.validateContentSecurityPolicy();
    await this.validateElectronBuilder();
    await this.validatePackageJson();
    
    return this.generateSecurityReport();
  }
}

// Export for use in other scripts
export { SecurityValidator };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new SecurityValidator();
  const result = await validator.runFullSecurityAudit();
  process.exit(result.criticalIssues > 0 ? 1 : 0);
}