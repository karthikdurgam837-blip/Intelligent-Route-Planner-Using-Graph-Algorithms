import React, { useState } from 'react';
import { Copy, Check, BookOpen, GitBranch, ShieldCheck, Download, CodeXml, ChevronRight } from 'lucide-react';

export default function DevDocs() {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const README_CONTENT = `# Intelligent Route Planner Using Graph Algorithms

An industry-oriented, full-featured Data Structures & Algorithms course project that computes and visualizes optimal paths using classical graph algorithms (Dijkstra, A*, BFS, DFS, and Multi-Criteria) on custom spatial city networks under real-time constraints like dynamic traffic factors, toll gates, and turn penalties.

## 🚀 Key Features
- **Spatial Graph Engine**: Models road networks as weighted directed graphs using memory-efficient Adjacency Lists.
- **Multiple Algorithm Solvers**:
  - **Dijkstra's Algorithm**: Guarantees optimal cost routes based on edge relaxations and custom priority heaps.
  - **A* Search**: Backed by a custom spatial straight-line distance heuristic to prune search space efficiently.
  - **BFS / DFS**: Demonstrates level-order hop exploration and backtracking traces.
- **Live Physical Constraints**:
  - Multi-Criteria / Weighted Sum cost models ($Cost = \\alpha \\cdot time + \\beta \\cdot tolls + \\gamma \\cdot distance$).
  - Dynamic traffic scaling factors (1.5x up to 3.0x peak bottlenecks).
  - One-way traffic enforcement and sharp corner turn penalties.
  - Active road blocks with dynamic cutoffs.
- **Micro-Simulation**: Includes a step-by-step debugger featuring queue prioritization listings, active pseudocode trace panels, and moving vehicle animations.

---

## 🗺️ Logical Core Diagram
\`\`\`text
                           [NORTH PORTAL NGT]
                                  / \\
                                 /   \\
                 Toll Gate: $2  /     \\  Free Link
                               /       \\
                              /         \\
                      [TECH CORE] ---- [CENTRAL STATION] ---- [RIVER GATE EAST]
                              \\          /                    /
              Tunnel: $3.5     \\        /                    /
                                \\      /                    /
                                 \\    /                    /
                                  \\  /                    /
                       [AIRPORT LOGISTICS IND] -------- [SOUTH TRANSIT PLAZA]
\`\`\`

---

## 🛠️ Execution & Setup (Alternative CLI Engine in Python)

As a backup to the interactive React UI, a standard Python CLI engine represents the classic project architecture. 

### Dependencies:
\`\`\`bash
pip install networkx matplotlib pytest
\`\`\`

### Run main.py:
\`\`\`bash
python src/main.py
\`\`\`

---

## 🔬 Core Complexity Benchmark Matrix

| Algorithm | Vertex Space Complexity | Edge Time Complexity | Admissible Heuristic | Path Optimality |
| :--- | :--- | :--- | :--- | :--- |
| **Dijkstra** | $O(V)$ | $O((E + V) \\cdot \\log V)$ | N/A | Guaranteed Optimal (100%) |
| **A-star** | $O(V)$ | $O((E + V) \\cdot \\log V)$ | Admissible & Consistent | Guaranteed Optimal (100%) |
| **BFS (Hops)**| $O(V)$ | $O(V + E)$ | N/A | Lowest Hop Count (Suboptimal weight) |
| **DFS (Trace)**| $O(V)$ | $O(V + E)$ | N/A | Deep backtrack path (High cost) |
`;

  const FAQS = [
    {
      q: "Explain your project.",
      hr: "This is an Intelligent Route Planner designed to compute the most cost-efficient route through a city graph. For ride-hailing networks like Uber or last-mile delivery services like Swiggy, finding an optimal route is the core mechanism that determines ETA accuracy, fuel savings, and customer satisfaction. The project acts as a functional simulator modeling these real-world challenges.",
      tech: "I modeled a road network as G(V, E) where vertices represent intersections (carrying spatial coordinates) and edges represent physical roads. Edges carry weights representing travel duration, distance, tolls, and dynamic traffic factors. I implemented Dijkstra's Algorithm for single-criteria optimization, A* with straight-line spatial heuristics for optimized node search, BFS/DFS, and a weighted multi-criteria solver to handle Pareto-like multi-objective optimizations (trading off fuel, tolls, and time)."
    },
    {
      q: "What problem does this project solve?",
      hr: "It solves the operational problem of fleet and vehicle scheduling. Road conditions are never static; dynamic traffic, turn delays, toll gates, and immediate road closures significantly alter the efficiency of standard routes. By integrating constraints into path calculations, the planner avoids traffic jams, saves on highway tolls, and maintains precise ETAs.",
      tech: "Mathematically, it solves the constrained and multi-criteria single-source shortest path problem. Rather than computing static paths, it supports dynamic weight re-scaling. At runtime, as traffic variables change, edge weights are recalculated and Dijkstra's Priority Queue dynamically relaxes affected nodes, preventing path bottlenecking."
    },
    {
      q: "Which DSA concepts did you use in this project?",
      hr: "I leveraged graphs to map the city, queues and stacks to traverse the paths, and a priority queue to select the most efficient intersections. I also used custom backtracking arrays to record parent nodes and reconstruct routes.",
      tech: "The deep architecture relies on: 1. Adjacency Lists for O(V + E) compact memory representation of sparse road graphs. 2. Min-Priority Queue for Dijkstra's extract-min step. 3. Backtracking pointers: parent[V] = U enabling linear path reconstruction. 4. Euclidean metric calculations for A* heuristic bounds. 5. Stack-based LIFO storage for DFS."
    },
    {
      q: "How did you represent the map in your project?",
      hr: "The map is represented as a network diagrams of nodes (key delivery points/landmarks) connected by roads. Each node is given coordinates on a grid to compute spatial distances.",
      tech: "I used an Adjacency List where each vertex maps to an array of outgoing edge records. Each edge record contains pointers to target node V, distance_m, speed_limit_kph, active toll_cost, and road_class. This makes sparse spatial lookups on average O(deg(U)) where degree is very small."
    },
    {
      q: "Why did you use Dijkstra’s algorithm?",
      hr: "I chose Dijkstra because it is the industry-standard algorithm for finding the absolute fastest path in any non-negative weighted road network. It ensures that we are always suggesting the single mathematically most efficient path.",
      tech: "Dijkstra is suitable because it discovers the absolute shortest path on graphs containing variable, non-negative edge weights (such as time or cost). The selection of the node with the minimum tentative cost is completed inside a Min-Heap, guaranteeing optimal running time."
    },
    {
      q: "What is the role of a priority queue in Dijkstra’s algorithm?",
      hr: "A priority queue acts like an organizer that always pushes the closest or fastest node to the top. This saves the computer from checking all intersections in a city and lets us focus on the most promising paths.",
      tech: "The Priority Queue handles the 'extract-min' action. Without a priority queue, searching for the node with the minimum tentative distance takes O(V) time, leading to O(V^2) total algorithm complexity. By using a Min-Priority Queue backed by binary sorting mechanics, we achieve O((E + V) log V), which is highly performant on massive road grids."
    },
    {
      q: "What challenges did you face in this project?",
      hr: "The major challenge was incorporating complex conditions like turning delays and road blocks. Roads can become closed instantly or have dynamic left-turn delays which interfere with standard shortest paths. Tuning the algorithm to avoid these blocks without crashing was highly challenging.",
      tech: "The primary technical hurdle was implementing consistent turn penalties without increasing spatial graph redundancy. To compute a turn penalty dynamically, the weight function must evaluate the edge direction change from previous node P -> current U -> next V. I solved this by tracking the previous node in the priority queue state: state = (cost, node, prev_node). This preserves graph size without requiring line-graph state transformations (turn-expansion)."
    },
    {
      q: "How can this project be improved further?",
      hr: "This route planner can be extended by fetching actual real-world OSM mapping data, integrating live GPS tracking of delivery cars, and adding a battery range constraint for Electric Vehicles to suggest routing through charging hubs.",
      tech: "To upgrade the architecture, 1. Dynamic contractions hierarchies can pre-process the graph for sub-millisecond query performance on continent-scale networks. 2. Implement TD-Dijkstra (Time-Dependant Dijkstra) where edge weights are time-varying periodic functions. 3. Integrate EV Routing with resource-constrained shortest path (LARAC) tracking state-of-charge decay."
    }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col font-sans">
      
      {/* Tab Header title */}
      <div className="flex items-center gap-3.5 mb-5 border-b border-slate-800 pb-4">
        <BookOpen className="w-6 h-6 text-emerald-400" />
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            Student Course Portfolio & Portfolio Guide
          </h3>
          <p className="text-xs text-slate-400">Prerequisite documentation, interview Q&As, and GitHub upload strategies.</p>
        </div>
      </div>

      {/* Grid content */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 flex-1 items-start">
        
        {/* Left Column (8/12) - FAQ & Interview Preparations */}
        <div className="xl:col-span-7 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs uppercase text-emerald-400 font-bold tracking-wider mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" /> Interactive Course Interview Simulator
            </h4>
            <p className="text-xs text-slate-400 mb-4 leading-normal leading-relaxed">
              Expand these questions to study recruitment-ready answers. Each question contains a high-level **Behavior/HR pitch** and a strict **Data Structures & Algorithms core engineering explanation**.
            </p>

            <div className="space-y-2.5">
              {FAQS.map((faq, index) => {
                const isOpen = activeFaq === index;

                return (
                  <div
                    key={index}
                    className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/45 transition-colors"
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : index)}
                      className="w-full flex justify-between items-center px-4 py-3 text-left font-medium text-xs md:text-sm hover:bg-slate-800/40 outline-none select-none transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-emerald-500 font-mono font-bold">Q{index + 1}.</span>
                        <span className="text-slate-100 font-semibold">{faq.q}</span>
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-90 text-emerald-400' : ''}`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4.5 pt-1.5 border-t border-slate-800/60 text-xs text-slate-300 space-y-3.5 bg-slate-950/70 animate-fade-in">
                        <div>
                          <span className="text-[10px] text-blue-400 uppercase font-bold tracking-widest block mb-1">
                            👩‍💼 HR / Recruiter Pitch (High-level Significance)
                          </span>
                          <p className="leading-snug text-slate-300 font-sans">{faq.hr}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold block mb-1 flex items-center gap-1">
                            <CodeXml className="w-3.5 h-3.5" /> Technical DSA Core Explanation
                          </span>
                          <p className="leading-snug text-slate-300 font-mono text-[10.5px] bg-slate-900/60 p-2.5 rounded border border-slate-800">
                            {faq.tech}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5/12) - Copyable README & GitHub Steps */}
        <div className="xl:col-span-5 space-y-4">
          
          {/* GitHub README Quick Export */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs uppercase text-blue-400 font-bold tracking-wider flex items-center gap-1.5">
                <GitBranch className="w-4.5 h-4.5 text-blue-400" /> GitHub README.md Preview
              </h4>
              <button
                onClick={() => copyToClipboard(README_CONTENT, 'readme')}
                className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800"
              >
                {copiedIndex === 'readme' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied README!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Code
                  </>
                )}
              </button>
            </div>
            
            <p className="text-[10.5px] text-slate-400 mb-3.5 leading-snug">
              This markdown is formatted as a peer-reviewed academic/industry project description. Copy and paste it directly into your portfolio repository.
            </p>

            <div className="flex-1 max-h-[295px] overflow-y-auto bg-slate-900/50 p-3 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-400 select-text leading-tight leading-normal">
              <pre className="whitespace-pre-wrap">{README_CONTENT}</pre>
            </div>
          </div>

          {/* Day-wise setup Checklist */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs uppercase text-amber-500 font-bold tracking-wider mb-2.5">
              📅 Day-Wise Proof of Work Strategy
            </h4>
            <div className="space-y-2">
              {[
                { day: "Day 1", task: "Setup Environment, node definitions & coordinate layout parameters", git: "git commit -m 'feat: build spatial graph nodes and coordinate system'" },
                { day: "Day 2", task: "Adjacency List generation, edge bounds & base CSV definitions", git: "git commit -m 'feat: construct graph adjacency list models and templates'" },
                { day: "Day 3", task: "BFS / DFS stack and queue implementations with diagnostic trackers", git: "git commit -m 'feat/alg: complete pathfinders for BFS and DFS traversal models'" },
                { day: "Day 4", task: "Dijkstra Priority Queue relaxations and turn penalty parameters", git: "git commit -m 'feat/alg: implement Dijkstra Extract-min heap relaxations'" },
                { day: "Day 5", task: "A* Spatial searches based on euclidean admissable heuristics", git: "git commit -m 'feat/alg: optimize search traces via A* spatial heuristics'" },
                { day: "Day 6", task: "Assemble interface dashboard and deploy final course project code", git: "git commit -m 'release: package planning dashboard ready for peer review'" },
              ].map((d, index) => (
                <div key={index} className="bg-slate-900/55 p-2 rounded border border-slate-850/60 leading-snug text-[11px]">
                  <div className="flex justify-between font-bold text-slate-200 text-xs mb-1">
                    <span>🚀 {d.day}: {d.task}</span>
                  </div>
                  <code className="text-[10px] text-amber-400 bg-slate-950/80 p-1 rounded font-mono block truncate select-all">
                    {d.git}
                  </code>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
