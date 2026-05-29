import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, difficulty, testCases, explanationText, graphDataJson } = body;

    const problem = await prisma.problem.create({
      data: {
        title,
        description,
        difficulty,
        testCases: {
          create: testCases.map((tc: any) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
          }))
        },
        solutions: {
          create: {
            explanationText,
            graphDataJson,
          }
        }
      }
    });

    return NextResponse.json(problem);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create problem' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const problems = await prisma.problem.findMany();
    return NextResponse.json(problems);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch problems' }, { status: 500 });
  }
}
