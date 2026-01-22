import AlertProvider from "./AlertProvider";
import "./App.css";
import CalendarView from "./CalendarView";
import Footer from "./footer";
import NavBar from "./navbar";

function App() {
  return (
    <AlertProvider>
      <NavBar />
      <CalendarView />
      <Footer />
    </AlertProvider>
  );
}

export default App;
