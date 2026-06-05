#!/usr/bin/env node

const [, , command] = process.argv;

function printHelp(): void {
  console.log(`OrgTrace CLI

Usage:
  orgtrace scan    Scan a local Salesforce project (planned)
  orgtrace report  Export an impact report (planned)
`);
}

switch (command) {
  case 'scan':
    console.log('orgtrace scan is planned for Phase 1A.');
    break;
  case 'report':
    console.log('orgtrace report is planned for Phase 1A.');
    break;
  case undefined:
  case '--help':
  case '-h':
    printHelp();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exitCode = 1;
}
