export default function DashboardOverviewPage() {
  return (
    <div>
      <h1>Dashboard Overview</h1>
      <div className="space-y-4">
        {Array.from({ length: 60 }).map((_, i) => (
          <p key={i}>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus aut obcaecati provident nesciunt nemo ex dolore animi neque aliquid...
          </p>
        ))}
      </div>
    </div>
  );
}
