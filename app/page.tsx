import { MissionConsole } from "@/components/mission/mission-console";

export default function Home(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      <MissionConsole />
    </main>
  );
}
