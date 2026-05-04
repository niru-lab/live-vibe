interface Props {
  step: number;
  total: number;
}

export default function ProgressBar({ step, total }: Props) {
  const pct = Math.min(100, Math.max(0, (step / total) * 100));
  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-5 pb-2 pt-4">
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 500 }}>
          {step} / {total}
        </span>
      </div>
      <div
        style={{
          height: 4,
          width: '100%',
          background: 'rgba(255,255,255,0.1)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #7C3AED 0%, #EC4899 100%)',
            transition: 'width 500ms cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 0 12px rgba(236, 72, 153, 0.4)',
          }}
        />
      </div>
    </div>
  );
}
