import type { OrgTraceService } from '../OrgTraceService';

export async function exportReportCommand(service: OrgTraceService): Promise<void> {
  await service.exportLastResult();
}
