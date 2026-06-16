import { EmployeeDetailPage } from "@/components/employees/employee-detail-page";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EmployeeByIdPage({ params }: PageProps) {
  const { id } = await params;
  return <EmployeeDetailPage employeeId={id} mode="by-id" />;
}
