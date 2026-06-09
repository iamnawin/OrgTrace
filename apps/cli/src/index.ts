#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs/promises';
import { 
  calculateRisk, 
  mergeComponentEnrichment, 
  generateImpactMarkdown,
  ComponentRef,
  DependencyResult
} from '@orgtrace/core';
import { scan } from '@orgtrace/scanner';
import { SalesforceService } from '@orgtrace/salesforce-api';

const program = new Command();

program
  .name('orgtrace')
  .description('OrgTrace CLI - Salesforce dependency and impact analysis')
  .version('0.1.0');

program
  .command('discover')
  .description('Discover Salesforce components in the local project')
  .argument('[query]', 'Search query for component names', '')
  .option('-p, --path <path>', 'Project root path', process.cwd())
  .option('-t, --type <type>', 'Filter by metadata type')
  .option('--json', 'Output results as JSON')
  .action(async (query, options) => {
    const projectPath = path.resolve(options.path);
    const { discoverComponents } = await import('@orgtrace/scanner');
    
    try {
      const components = await discoverComponents(projectPath, query, options.type);
      
      if (options.json) {
        console.log(JSON.stringify(components, null, 2));
      } else {
        console.log(chalk.bold(`Discovered ${components.length} components:`));
        components.forEach(c => {
          console.log(`${chalk.blue(c.type)}: ${c.apiName} ${chalk.dim(`(${c.filePath})`)}`);
        });
      }
    } catch (err) {
      console.error(chalk.red('Discovery failed:'), err);
      process.exit(1);
    }
  });

program
  .command('analyze')
  .description('Analyze a Salesforce metadata component')
  .argument('<type>', 'Metadata type (e.g., ApexClass, Flow)')
  .argument('<apiName>', 'API name of the component')
  .option('-p, --path <path>', 'Project root path', process.cwd())
  .option('--org', 'Enrich results with Salesforce org metadata')
  .option('-e, --export <file>', 'Export report to Markdown file')
  .option('--json', 'Output results as JSON')
  .action(async (type, apiName, options) => {
    const projectPath = path.resolve(options.path);
    
    console.log(chalk.blue(`Analyzing ${type}: ${apiName}...`));
    console.log(chalk.dim(`Project path: ${projectPath}`));

    const target: ComponentRef = { apiName, type };

    try {
      // 1. Local Scan
      const scanResult = await scan({ projectPath, target });
      
      let resultWithoutRisk = {
        target,
        references: scanResult.references,
        dependencies: scanResult.dependencies,
        scannedAt: new Date().toISOString(),
        sources: ['LocalScan' as any],
        context: { projectPath },
        warnings: scanResult.warnings,
        errors: scanResult.errors,
      };

      let result: DependencyResult = {
        ...resultWithoutRisk,
        risk: calculateRisk(resultWithoutRisk as any),
      };

      // 2. Org Enrichment (optional)
      if (options.org) {
        console.log(chalk.blue('Enriching with Salesforce org data...'));
        const sfService = new SalesforceService();
        const initialized = await sfService.init(projectPath);
        
        if (initialized) {
          const enrichment = await sfService.fetchComponentDetails(apiName, type);
          if (enrichment) {
            result.target = mergeComponentEnrichment(result.target, enrichment);
            result.sources.push('SalesforceOrg' as any);
          } else {
            console.warn(chalk.yellow('Component not found in the connected org.'));
          }
        } else {
          console.warn(chalk.yellow('Could not connect to Salesforce org. Check your sf CLI auth.'));
        }
      }

      // 3. Output
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log('\n' + chalk.bold('Analysis Result:'));
        console.log(`Risk Level: ${getRiskColor(result.risk.level)(result.risk.level)} (${result.risk.score}/100)`);
        console.log(`Used By: ${result.references.length}`);
        console.log(`Uses: ${result.dependencies.length}`);
        
        if (result.risk.reasons.length > 0) {
          console.log('\n' + chalk.bold('Risk Reasons:'));
          result.risk.reasons.forEach(r => console.log(chalk.red(`- ${r}`)));
        }
      }

      // 4. Export
      if (options.export) {
        const markdown = generateImpactMarkdown(result);
        const exportPath = path.resolve(options.export);
        await fs.writeFile(exportPath, markdown, 'utf8');
        console.log(chalk.green(`\nReport exported to: ${exportPath}`));
      }

    } catch (err) {
      console.error(chalk.red('Analysis failed:'), err);
      process.exit(1);
    }
  });

function getRiskColor(level: string) {
  switch (level) {
    case 'Critical': return chalk.red.bold;
    case 'High': return chalk.red;
    case 'Medium': return chalk.yellow;
    case 'Low': return chalk.green;
    default: return chalk.white;
  }
}

program.parse();
