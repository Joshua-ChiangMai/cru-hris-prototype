import { ApprovalDetailPage } from "@/components/approval/approval-detail-page";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ApprovalDetailRoute({ params }: PageProps) {
  const { id } = await params;
  return <ApprovalDetailPage requestId={id} />;
}
