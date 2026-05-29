import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProblemWorkspace from "./ProblemWorkspace";

export default async function ProblemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const problem = await prisma.problem.findUnique({
    where: { id },
    include: {
      testCases: true,
      solutions: true,
    }
  });

  if (!problem) {
    notFound();
  }

  return <ProblemWorkspace problem={problem} />;
}
