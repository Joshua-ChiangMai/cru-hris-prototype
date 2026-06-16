export type TrainingStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "EXPIRED";

export type TrainingSummary = {
  id: string;
  code: string;
  title: string;
  category: string;
  provider: string;
  startDate: string | null;
  endDate: string | null;
};

export type EmployeeTrainingRecord = {
  id: string;
  employeeId: string;
  trainingId: string;
  completionDate: string | null;
  status: TrainingStatus;
  training: TrainingSummary;
};

export type TrainingsResponse = {
  data: TrainingSummary[];
};

export type EmployeeTrainingsResponse = {
  data: EmployeeTrainingRecord[];
};
