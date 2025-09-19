import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Stories from "@/components/Stories";
import BrandCategory from "@/components/BrandCategory";
import FeaturedProducts from "@/components/FeaturedProducts";
import Categories from "@/components/Categories";
import ClientTestimonials from "@/components/ClientTestimonials";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <Hero />
        <Stories />
        <BrandCategory />
        <FeaturedProducts />
        <Categories />
        <ClientTestimonials />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
