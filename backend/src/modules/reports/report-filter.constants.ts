export const REPORT_FILTER_FIELDS = [
  'gender',
  'city',
  'maritalStatus',
  'department',
  'employmentStatus',
  'familySize',
  'spouseExists',
  'spouseIsEmployee',
  'childrenCount',
  'hasTraining',
  'trainingCompleted',
  'trainingName',
  'trainingStatus',
] as const;

export type ReportFilterField = (typeof REPORT_FILTER_FIELDS)[number];

export const REPORT_FILTER_OPERATORS = [
  'eq',
  'neq',
  'gte',
  'lte',
  'gt',
  'lt',
  'contains',
] as const;

export type ReportFilterOperator = (typeof REPORT_FILTER_OPERATORS)[number];

export const NUMERIC_FILTER_FIELDS: ReportFilterField[] = [
  'familySize',
  'childrenCount',
];

export const BOOLEAN_FILTER_FIELDS: ReportFilterField[] = [
  'spouseExists',
  'hasTraining',
  'trainingCompleted',
  'spouseIsEmployee',
];

export const DEFAULT_REPORT_FILTER_OPERATOR: ReportFilterOperator = 'eq';

export const MAX_REPORT_QUERY_ROWS = 5000;
