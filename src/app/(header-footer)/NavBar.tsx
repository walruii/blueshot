import Clock from "./Clock";

export default function NavBar() {
  return (
    <nav className="flex justify-between items-center p-5 ">
      <h1 className="text-4xl font-extrabold">Blueshot</h1>
      <Clock />
    </nav>
  );
}
