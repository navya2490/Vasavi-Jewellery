import { MissionConsole } from "@/components/mission/mission-console";

export default function Home(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
      <MissionConsole />
    </main>
  );
}
