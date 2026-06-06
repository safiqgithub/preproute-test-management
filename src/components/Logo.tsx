export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' };
  return (
    <div className={`font-bold ${sizes[size]} flex items-center gap-0.5`}>
      <span className="text-gray-800">Prep</span>
      <span className="text-primary relative">
        route
        <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-primary" />
      </span>
    </div>
  );
}
