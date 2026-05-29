import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Helper to generate a text element in Excalidraw
function createText(id: string, x: number, y: number, text: string, fontSize = 20, strokeColor = "#f8fafc") {
  const lines = text.split("\n");
  const longestLine = lines.reduce((max, line) => line.length > max ? line.length : max, 0);
  return {
    id,
    type: "text",
    x,
    y,
    width: longestLine * (fontSize * 0.55),
    height: lines.length * fontSize * 1.25,
    strokeColor,
    backgroundColor: "transparent",
    fillStyle: "hachure",
    strokeWidth: 1,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    seed: Math.floor(Math.random() * 100000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 100000),
    isDeleted: false,
    groupIDs: [],
    boundElements: [],
    updated: Date.now(),
    link: null,
    locked: false,
    text,
    fontSize,
    fontFamily: 1, // Hand-drawn style font
    textAlign: "left",
    verticalAlign: "top",
    baseline: fontSize * 0.85,
  };
}

// Helper to generate a rectangle element in Excalidraw
function createRectangle(id: string, x: number, y: number, width: number, height: number, strokeColor = "#6366f1", backgroundColor = "rgba(99, 102, 241, 0.1)") {
  return {
    id,
    type: "rectangle",
    x,
    y,
    width,
    height,
    strokeColor,
    backgroundColor,
    fillStyle: "hachure",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    seed: Math.floor(Math.random() * 100000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 100000),
    isDeleted: false,
    groupIDs: [],
    boundElements: [],
    updated: Date.now(),
    link: null,
    locked: false,
  };
}

// Helper to generate an arrow element in Excalidraw
function createArrow(id: string, x: number, y: number, points: [number, number][], strokeColor = "#ec4899") {
  return {
    id,
    type: "arrow",
    x,
    y,
    width: Math.abs(points[points.length - 1][0]),
    height: Math.abs(points[points.length - 1][1]),
    strokeColor,
    backgroundColor: "transparent",
    fillStyle: "hachure",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    seed: Math.floor(Math.random() * 100000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 100000),
    isDeleted: false,
    groupIDs: [],
    boundElements: [],
    updated: Date.now(),
    link: null,
    locked: false,
    points,
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: "arrow",
  };
}

async function main() {
  console.log("Seeding started...");

  // Clean old entries to ensure clean slate
  await prisma.problem.deleteMany();

  // TWO SUM EXCALIDRAW ELEMENTS
  const twoSumElements = [
    createText("t1", 100, 50, "Two Sum Solution Diagram", 28, "#8b5cf6"),
    createText("t2", 100, 100, "Find two numbers in [2, 7, 11, 15] that sum to target = 9", 18, "#94a3b8"),
    
    // Array visual
    createText("t3", 100, 160, "Array elements:", 16, "#cbd5e1"),
    createRectangle("r1", 100, 200, 60, 60, "#6366f1"),
    createText("a1", 123, 218, "2", 20, "#fff"),
    createText("i1", 123, 270, "[0]", 14, "#94a3b8"),

    createRectangle("r2", 180, 200, 60, 60, "#6366f1"),
    createText("a2", 203, 218, "7", 20, "#fff"),
    createText("i2", 203, 270, "[1]", 14, "#94a3b8"),

    createRectangle("r3", 260, 200, 60, 60, "#6366f1"),
    createText("a3", 280, 218, "11", 20, "#fff"),
    createText("i3", 280, 270, "[2]", 14, "#94a3b8"),

    createRectangle("r4", 340, 200, 60, 60, "#6366f1"),
    createText("a4", 360, 218, "15", 20, "#fff"),
    createText("i4", 360, 270, "[3]", 14, "#94a3b8"),

    // Hash Map visual
    createText("t4", 500, 160, "Hash Map (value -> index):", 16, "#cbd5e1"),
    createRectangle("m1", 500, 200, 220, 180, "#8b5cf6", "rgba(139, 92, 246, 0.05)"),
    createText("h1", 520, 220, "Complement Lookup Map", 16, "#ec4899"),
    createText("h2", 520, 260, "Key: Value  => Value: Index", 14, "#94a3b8"),
    createText("h3", 520, 300, "{ 2: 0 }", 16, "#10b981"),

    // Step pointers
    createArrow("arr1", 130, 350, [[0, 0], [0, -60]], "#ec4899"),
    createText("p1", 100, 370, "Step 1: Check 2\ncomplement = 9 - 2 = 7\nNot in map -> Store { 2: 0 }", 14, "#ec4899"),

    createArrow("arr2", 210, 350, [[0, 0], [0, -60]], "#10b981"),
    createText("p2", 210, 440, "Step 2: Check 7\ncomplement = 9 - 7 = 2\nFOUND 2 in map at index 0!\nReturn [0, 1]", 14, "#10b981"),
  ];

  const problem1 = await prisma.problem.create({
    data: {
      title: "Two Sum",
      description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

### Constraints:
* \`2 <= nums.length <= 10^4\`
* \`-10^9 <= nums[i] <= 10^9\`
* \`-10^9 <= target <= 10^9\`
* Only one valid answer exists.`,
      difficulty: "Easy",
      testCases: {
        create: [
          { input: JSON.stringify({ nums: [2, 7, 11, 15], target: 9 }), expectedOutput: JSON.stringify([0, 1]) },
          { input: JSON.stringify({ nums: [3, 2, 4], target: 6 }), expectedOutput: JSON.stringify([1, 2]) },
          { input: JSON.stringify({ nums: [3, 3], target: 6 }), expectedOutput: JSON.stringify([0, 1]) },
        ]
      },
      solutions: {
        create: {
          explanationText: "To solve the Two Sum problem efficiently, we can use a hash map to keep track of the numbers we have seen so far and their indices. As we iterate through the array, we check if the complement, which is the target minus the current number, already exists in our map. If it does, we have found our answer and return the stored index and the current index. This reduces the time complexity from an O of n-squared brute-force search to an optimal O of n time, using O of n space.",
          graphDataJson: JSON.stringify(twoSumElements),
        }
      }
    }
  });

  // VALID PARENTHESES EXCALIDRAW ELEMENTS
  const validParenthesesElements = [
    createText("vp1", 100, 50, "Valid Parentheses Solution", 28, "#8b5cf6"),
    createText("vp2", 100, 100, "Checking validity of string s = \"([])\"", 18, "#94a3b8"),

    // Stack visual
    createRectangle("sbox", 250, 180, 140, 240, "#6366f1", "rgba(99, 102, 241, 0.05)"),
    createText("stxt", 285, 140, "STACK", 18, "#6366f1"),
    
    // Stack Items
    createRectangle("sitem1", 260, 360, 120, 45, "#8b5cf6"),
    createText("stxt1", 310, 372, "[", 18, "#fff"),
    
    createRectangle("sitem2", 260, 305, 120, 45, "#ec4899"),
    createText("stxt2", 310, 317, "(", 18, "#fff"),

    // Explanations
    createText("e1", 440, 200, "Scan left to right:", 16, "#cbd5e1"),
    createText("e2", 440, 240, "1. ' ( ' -> Open bracket, push to stack", 15, "#a5b4fc"),
    createText("e3", 440, 280, "2. ' [ ' -> Open bracket, push to stack", 15, "#a5b4fc"),
    createText("e4", 440, 320, "3. ' ] ' -> Close bracket. Pop top ('[') and check match. MATCH!", 15, "#10b981"),
    createText("e5", 440, 360, "4. ' ) ' -> Close bracket. Pop top ('(') and check match. MATCH!", 15, "#10b981"),
    createText("e6", 440, 400, "Final: Stack is empty -> Valid parenthesization!", 16, "#10b981")
  ];

  const problem2 = await prisma.problem.create({
    data: {
      title: "Valid Parentheses",
      description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

### Constraints:
* \`1 <= s.length <= 10^4\`
* \`s\` consists of parentheses only \`'()[]{}'\`.`,
      difficulty: "Easy",
      testCases: {
        create: [
          { input: JSON.stringify({ s: "()" }), expectedOutput: "true" },
          { input: JSON.stringify({ s: "()[]{}" }), expectedOutput: "true" },
          { input: JSON.stringify({ s: "(]" }), expectedOutput: "false" },
          { input: JSON.stringify({ s: "([])" }), expectedOutput: "true" },
        ]
      },
      solutions: {
        create: {
          explanationText: "The Valid Parentheses problem is a classic application of the Stack data structure. As we scan the string from left to right, whenever we encounter an opening bracket, we push its corresponding closing bracket onto the stack. If we see a closing bracket, we check if the stack is not empty and pop the top of the stack to see if it matches. If it doesn't match or the stack is empty, the brackets are invalid. At the end, if the stack is completely empty, all brackets were matched correctly.",
          graphDataJson: JSON.stringify(validParenthesesElements),
        }
      }
    }
  });

  // REVERSE LINKED LIST EXCALIDRAW ELEMENTS
  const reverseListElements = [
    createText("rl1", 100, 50, "Reverse Linked List Workflow", 28, "#8b5cf6"),
    createText("rl2", 100, 100, "Reversing nodes: 1 -> 2 -> 3 -> null", 18, "#94a3b8"),

    // Node 1
    createRectangle("n1", 100, 200, 80, 50, "#6366f1"),
    createText("nv1", 135, 212, "1", 20, "#fff"),
    createArrow("na1", 180, 225, [[0, 0], [60, 0]], "#ec4899"),

    // Node 2
    createRectangle("n2", 240, 200, 80, 50, "#6366f1"),
    createText("nv2", 275, 212, "2", 20, "#fff"),
    createArrow("na2", 320, 225, [[0, 0], [60, 0]], "#ec4899"),

    // Node 3
    createRectangle("n3", 380, 200, 80, 50, "#6366f1"),
    createText("nv3", 415, 212, "3", 20, "#fff"),
    createArrow("na3", 460, 225, [[0, 0], [40, 0]], "#ec4899"),
    createText("nnull", 510, 212, "null", 16, "#cbd5e1"),

    // Iteration pointers
    createText("pnt1", 90, 280, "prev = null", 14, "#94a3b8"),
    createText("pnt2", 250, 280, "curr", 14, "#ec4899"),
    createText("pnt3", 380, 280, "nextTemp", 14, "#8b5cf6"),

    // Reversal action explanation
    createArrow("reva1", 245, 195, [[0, 0], [-65, 0]], "#10b981"),
    createText("lbl1", 185, 160, "curr.next = prev", 12, "#10b981"),

    createText("step_expl", 100, 360, "Pointer Shifting Step-by-Step:\n1. Save next node: nextTemp = curr.next\n2. Reverse link: curr.next = prev\n3. Slide prev forward: prev = curr\n4. Slide curr forward: curr = nextTemp", 15, "#cbd5e1")
  ];

  const problem3 = await prisma.problem.create({
    data: {
      title: "Reverse Linked List",
      description: `Given the head of a singly linked list, reverse the list, and return the reversed list.

### Constraints:
* The number of nodes in the list is in the range \`[0, 5000]\`.
* \`-5000 <= Node.val <= 5000\`

For array/object structures, inputs are represented as standard nested JSON objects:
\`{"val": 1, "next": {"val": 2, "next": null}}\``,
      difficulty: "Medium",
      testCases: {
        create: [
          { input: JSON.stringify({ val: 1, next: { val: 2, next: { val: 3, next: null } } }), expectedOutput: JSON.stringify({ val: 3, next: { val: 2, next: { val: 1, next: null } } }) },
          { input: JSON.stringify({ val: 1, next: { val: 2, next: null } }), expectedOutput: JSON.stringify({ val: 2, next: { val: 1, next: null } }) },
          { input: JSON.stringify(null), expectedOutput: "null" },
        ]
      },
      solutions: {
        create: {
          explanationText: "Reversing a singly linked list can be done either iteratively or recursively. In the iterative approach, we maintain three pointers: prev, curr, and next. We start with prev as null and curr as head. In a loop, we save the next node, reverse the curr pointer to point to prev, shift prev to curr, and finally shift curr to next. We repeat this until curr is null, at which point prev will point to the new head of the reversed list.",
          graphDataJson: JSON.stringify(reverseListElements),
        }
      }
    }
  });

  console.log("Seeding complete successfully!");
  console.log(`Created problems:\n- ${problem1.title} (${problem1.id})\n- ${problem2.title} (${problem2.id})\n- ${problem3.title} (${problem3.id})`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    pool.end();
  });
