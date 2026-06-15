interface FileNameBarProps {
  fileName: string;
}

export function FileNameBar({ fileName }: FileNameBarProps) {
  return (
    <div
      className="shrink-0 flex items-center gap-2 min-w-0 min-h-9 px-4 py-2 border-b border-figma-border bg-accent-subtle"
      title={fileName}
    >
      <span className="shrink-0 font-mono text-[9px] font-bold tracking-widest text-accent uppercase leading-snug">
        File
      </span>
      <span className="shrink-0 w-px h-3.5 bg-figma-border self-center" aria-hidden />
      <span className="text-[11px] text-figma-text-primary truncate min-w-0 leading-snug">
        {fileName}
      </span>
    </div>
  );
}
