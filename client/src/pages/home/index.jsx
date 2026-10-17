import HeroSection from "./components/HeroSection.jsx";
import ExploreBooks from "./components/ExploreBooks.jsx";
import Categories from "./components/Categories.jsx";
import Contact from "./components/Contact.jsx";
import About from "./components/About.jsx";

export default function HomeScreen() {
  return (
    <>
      <HeroSection />
      <About />
      <ExploreBooks />
      <Categories />
      <Contact />
    </>
  );
}
