import { TrainingStatus } from '@prisma/client';

export function formatReportEnumLabel(value: string | null): string {
  if (!value) {
    return 'Not specified';
  }

  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatTrainingStatusLabel(status: TrainingStatus): string {
  return formatReportEnumLabel(status);
}
