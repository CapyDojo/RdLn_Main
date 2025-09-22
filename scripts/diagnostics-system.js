/**
 * Comprehensive Error Handling and Diagnostics System for Electron
 * Provides detailed error reporting, crash recovery, and performance monitoring
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DiagnosticsSystem {
  constructor() {
    this.baseDir = path.join(__dirname, '..');
    this.logsDir = path.join(this.baseDir, 'logs');
    this.reportDir = path.join(this.baseDir, 'diagnostic-reports');
    this.startTime = Date.now();
  }

  async ensureDirectories() {
    for (const dir of [this.logsDir, this.reportDir]) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }

  async collectSystemInfo() {
    return {
      timestamp: new Date().toISOString(),
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      electronVersion: process.versions.electron || 'N/A',
      chromeVersion: process.versions.chrome || 'N/A',
      systemMemory: Math.round(os.totalmem() / 1024 / 1024) + 'MB',
      freeMemory: Math.round(os.freemem() / 1024 / 1024) + 'MB',
      cpuCount: os.cpus().length,
      uptime: Math.round(process.uptime()) + 's',
      workingDirectory: process.cwd()
    };
  }

  async checkElectronEnvironment() {
    console.log('🔍 Checking Electron environment...');
    const issues = [];
    const checks = [];

    // Check main process files
    const criticalFiles = [
      'src-electron/main.cjs',
      'src-electron/preload.cjs',
      'src-electron/builder.config.cjs'
    ];

    for (const file of criticalFiles) {
      try {
        const filePath = path.join(this.baseDir, file);
        const stats = await fs.stat(filePath);
        checks.push({
          file,
          status: 'ok',
          size: stats.size,
          modified: stats.mtime
        });
        console.log(`✅ ${file} (${Math.round(stats.size / 1024)}KB)`);
      } catch (error) {
        issues.push(`Missing critical file: ${file}`);
        checks.push({
          file,
          status: 'missing',
          error: error.message
        });
        console.error(`❌ ${file} - ${error.message}`);
      }
    }

    return { issues, checks };
  }

  async checkAssetIntegrity() {
    console.log('🔍 Checking asset integrity...');
    const issues = [];
    const assets = {};

    const assetDirs = ['public/fonts', 'public/tesseract', 'public/tessdata'];
    
    for (const dir of assetDirs) {
      try {
        const dirPath = path.join(this.baseDir, dir);
        const files = await fs.readdir(dirPath);
        
        let totalSize = 0;
        const fileDetails = [];
        
        for (const file of files) {
          try {
            const filePath = path.join(dirPath, file);
            const stats = await fs.stat(filePath);
            
            if (stats.isFile()) {
              totalSize += stats.size;
              fileDetails.push({
                name: file,
                size: stats.size,
                modified: stats.mtime
              });
            }
          } catch (error) {
            issues.push(`Could not read ${dir}/${file}: ${error.message}`);
          }
        }
        
        assets[dir] = {
          fileCount: fileDetails.length,
          totalSize,
          files: fileDetails
        };
        
        console.log(`✅ ${dir}: ${fileDetails.length} files (${Math.round(totalSize / 1024 / 1024)}MB)`);
        
        if (totalSize === 0) {
          issues.push(`${dir} is empty or missing`);
        }
        
      } catch (error) {
        issues.push(`Could not access ${dir}: ${error.message}`);
        console.error(`❌ ${dir} - ${error.message}`);
      }
    }

    return { issues, assets };
  }

  async checkBuildArtifacts() {
    console.log('🔍 Checking build artifacts...');
    const issues = [];
    const artifacts = {};

    const buildDirs = ['dist', 'dist-electron-new'];
    
    for (const dir of buildDirs) {
      try {
        const dirPath = path.join(this.baseDir, dir);
        await fs.access(dirPath);
        
        const files = await fs.readdir(dirPath);
        artifacts[dir] = {
          exists: true,
          fileCount: files.length,
          files: files.slice(0, 10) // First 10 files
        };
        
        console.log(`✅ ${dir}: ${files.length} items`);
      } catch {
        artifacts[dir] = { exists: false };
        console.log(`ℹ️  ${dir}: Not found (may not be built yet)`);
      }
    }

    return { issues, artifacts };
  }

  async checkDependencies() {
    console.log('🔍 Checking dependencies...');
    const issues = [];
    const dependencies = {};

    try {
      const packageJson = JSON.parse(
        await fs.readFile(path.join(this.baseDir, 'package.json'), 'utf8')
      );

      const criticalDeps = [
        'electron',
        'electron-builder', 
        'react',
        'vite',
        'tesseract.js'
      ];

      for (const dep of criticalDeps) {
        const version = packageJson.dependencies?.[dep] || 
                      packageJson.devDependencies?.[dep];
        
        if (version) {
          dependencies[dep] = version;
          console.log(`✅ ${dep}: ${version}`);
        } else {
          issues.push(`Missing critical dependency: ${dep}`);
          console.error(`❌ ${dep}: Not found`);
        }
      }

    } catch (error) {
      issues.push(`Could not read package.json: ${error.message}`);
    }

    return { issues, dependencies };
  }

  async performanceCheck() {
    console.log('🔍 Running performance checks...');
    const performance = {};

    // Memory usage
    const memUsage = process.memoryUsage();
    performance.memory = {
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
    };

    // File system performance
    const start = Date.now();
    try {
      await fs.readdir(this.baseDir);
      performance.fsReadTime = Date.now() - start + 'ms';
    } catch (error) {
      performance.fsReadTime = 'Error: ' + error.message;
    }

    // Uptime
    performance.uptime = Math.round(process.uptime()) + 's';
    performance.diagnosticDuration = Date.now() - this.startTime + 'ms';

    console.log(`📊 Memory: ${performance.memory.heapUsed} used`);
    console.log(`📊 FS Read: ${performance.fsReadTime}`);

    return performance;
  }

  async generateDiagnosticReport() {
    console.log('📋 Generating comprehensive diagnostic report...');
    
    await this.ensureDirectories();
    
    const systemInfo = await this.collectSystemInfo();
    const electronCheck = await this.checkElectronEnvironment();
    const assetCheck = await this.checkAssetIntegrity();
    const buildCheck = await this.checkBuildArtifacts();
    const depCheck = await this.checkDependencies();
    const perfCheck = await this.performanceCheck();

    const report = {
      meta: {
        generated: new Date().toISOString(),
        version: '1.0.0',
        duration: Date.now() - this.startTime + 'ms'
      },
      system: systemInfo,
      electron: electronCheck,
      assets: assetCheck,
      build: buildCheck,
      dependencies: depCheck,
      performance: perfCheck,
      summary: {
        totalIssues: electronCheck.issues.length + 
                   assetCheck.issues.length + 
                   buildCheck.issues.length + 
                   depCheck.issues.length,
        criticalFiles: electronCheck.checks.length,
        assetDirectories: Object.keys(assetCheck.assets).length,
        buildArtifacts: Object.keys(buildCheck.artifacts).length
      }
    };

    // Save detailed report
    const reportPath = path.join(
      this.reportDir, 
      `diagnostic-${Date.now()}.json`
    );
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Generate summary
    this.printSummary(report);
    
    return { report, reportPath };
  }

  printSummary(report) {
    console.log('\\n' + '='.repeat(60));
    console.log('🔧 ELECTRON DIAGNOSTIC REPORT SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`🖥️  Platform: ${report.system.platform} (${report.system.arch})`);
    console.log(`⚡ Node.js: ${report.system.nodeVersion}`);
    console.log(`🔋 Electron: ${report.system.electronVersion}`);
    console.log(`💾 Memory: ${report.system.systemMemory} total, ${report.system.freeMemory} free`);
    
    console.log(`\\n📊 Issues Found: ${report.summary.totalIssues}`);
    
    if (report.summary.totalIssues === 0) {
      console.log('✅ No issues detected - system is healthy!');
    } else {
      const allIssues = [
        ...report.electron.issues,
        ...report.assets.issues,
        ...report.build.issues,
        ...report.dependencies.issues
      ];
      
      console.log('\\n❌ Issues to address:');
      allIssues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    console.log(`\\n📈 Performance:`);
    console.log(`   Memory usage: ${report.performance.memory.heapUsed}`);
    console.log(`   FS read time: ${report.performance.fsReadTime}`);
    console.log(`   Diagnostic time: ${report.performance.diagnosticDuration}`);
    
    console.log(`\\n💡 Recommendations:`);
    
    if (report.summary.totalIssues > 0) {
      console.log('   - Fix issues listed above');
      console.log('   - Run npm run setup:electron to resolve missing assets');
    }
    
    if (!report.build.artifacts.dist?.exists) {
      console.log('   - Run npm run build to create distribution files');
    }
    
    console.log('   - Run npm run verify:setup for detailed validation');
    console.log('   - Check logs/ directory for detailed error logs');
  }

  async runFullDiagnostics() {
    console.log('🔧 Starting comprehensive Electron diagnostics...\\n');
    
    try {
      const result = await this.generateDiagnosticReport();
      
      console.log(`\\n📁 Detailed report saved to: ${result.reportPath}`);
      console.log('🔧 Use this report for troubleshooting build issues');
      
      return result;
      
    } catch (error) {
      console.error('❌ Diagnostics failed:', error.message);
      throw error;
    }
  }
}

// Export for use in other scripts
export { DiagnosticsSystem };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const diagnostics = new DiagnosticsSystem();
  await diagnostics.runFullDiagnostics();
}