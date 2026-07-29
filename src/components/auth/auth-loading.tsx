import { Salad } from "lucide-react";

export function AuthLoading() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="flex flex-col items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary anim-pulse-glow">
          <Salad className="h-6 w-6" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}