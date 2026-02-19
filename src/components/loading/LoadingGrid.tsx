export default function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-6 lg:grid-rows-4 h-auto lg:h-260 max-w-500 mx-auto">
      <div className="pb-7 pt-4 bg-card rounded-xl h-40 lg:h-full col-span-1 lg:col-span-3 animate-pulse" />
      <div className="py-7 bg-card rounded-xl h-40 lg:h-full col-span-1 lg:col-span-3 animate-pulse" />
      <div className="h-40 lg:h-full lg:col-span-4 lg:row-span-3 bg-card rounded-xl animate-pulse" />
      <div className="h-40 lg:h-full lg:row-span-3 lg:col-span-2 bg-card rounded-xl animate-pulse" />
    </div>
  );
}
