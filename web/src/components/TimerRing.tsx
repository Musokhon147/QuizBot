import { useEffect, useState, useRef } from "react";

interface Props {
  seconds: number;
  onTimeout: () => void;
  paused?: boolean;
  size?: number;
}

export default function TimerRing({ seconds, onTimeout, paused = false, size = 44 }: Props) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (paused || remaining <= 0) return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, remaining <= 0]);

  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = remaining / seconds;
  const offset = circumference * (1 - progress);

  const getColor = () => {
    if (progress > 0.5) return "#00cec9";
    if (progress > 0.25) return "#fdcb6e";
    return "#ff6b6b";
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.3s linear, stroke 0.5s" }}
        />
      </svg>
      <span className={`absolute text-xs font-bold ${progress <= 0.25 ? "text-coral" : "text-subtle"}`}>
        {remaining}
      </span>
    </div>
  );
}
