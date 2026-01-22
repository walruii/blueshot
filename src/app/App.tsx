import AlertProvider from "./alert/AlertProvider";
import "./App.css";
import CalendarView from "./calendar/CalendarView";
import Footer from "./header-footer/Footer";
import NavBar from "./header-footer/NavBar";

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
