import { prisma } from "@/lib/prisma";
import ProblemsDashboard from "./ProblemsDashboard";

export default async function ProblemsPage() {
  const problems = await prisma.problem.findMany({
    orderBy: { createdAt: 'desc' }
  });

  // Next.js serialization helper: Convert Date objects to ISO strings
  const serializedProblems = problems.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    difficulty: p.difficulty,
    createdAt: p.createdAt.toISOString()
  }));

  return <ProblemsDashboard initialProblems={serializedProblems} />;
}
