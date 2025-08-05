import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, Award, Heart, Users, Globe, Sparkles, CheckCircle, Quote } from "lucide-react";

const About = () => {
  const values = [
    {
      icon: <Leaf className="h-8 w-8" />,
      title: "Sustainability",
      description: "Committed to eco-friendly practices and sustainable sourcing of all ingredients.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Quality",
      description: "Premium formulations with clinically-proven ingredients for exceptional results.",
      color: "from-red-500 to-pink-500"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Inclusivity",
      description: "Beauty products designed for all skin tones, types, and individual preferences.",
      color: "from-purple-500 to-indigo-500"
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Innovation",
      description: "Cutting-edge research and technology to create breakthrough beauty solutions.",
      color: "from-blue-500 to-cyan-500"
    }
  ];

  const milestones = [
    { year: "2018", event: "Founded with a vision to revolutionize natural beauty" },
    { year: "2019", event: "Launched first sustainable skincare line" },
    { year: "2020", event: "Expanded to inclusive makeup collection" },
    { year: "2021", event: "Opened first flagship store and spa" },
    { year: "2022", event: "Introduced luxury fragrance collection" },
    { year: "2023", event: "Achieved carbon-neutral operations" },
    { year: "2024", event: "Reached 1 million satisfied customers worldwide" }
  ];

  const team = [
    {
      name: "Sarah Chen",
      role: "Founder & CEO",
      bio: "Former cosmetic chemist with 15+ years in luxury beauty innovation.",
      image: "/api/placeholder/300/300"
    },
    {
      name: "Marcus Rodriguez",
      role: "Head of Product Development",
      bio: "Expert in sustainable beauty formulations and ingredient sourcing.",
      image: "/api/placeholder/300/300"
    },
    {
      name: "Aisha Patel",
      role: "Creative Director",
      bio: "Award-winning designer specializing in inclusive beauty experiences.",
      image: "/api/placeholder/300/300"
    }
  ];

  const certifications = [
    { name: "Cruelty-Free", description: "Never tested on animals" },
    { name: "Organic Certified", description: "USDA certified organic ingredients" },
    { name: "Sustainable Packaging", description: "100% recyclable materials" },
    { name: "Fair Trade", description: "Ethically sourced ingredients" },
    { name: "Carbon Neutral", description: "Zero net carbon emissions" },
    { name: "Vegan Friendly", description: "No animal-derived ingredients" }
  ];

  const testimonials = [
    {
      quote: "Shimmer has completely transformed my skincare routine. The results are incredible and I love knowing the products are sustainably made.",
      author: "Emily Johnson",
      role: "Verified Customer"
    },
    {
      quote: "Finally found a beauty brand that understands my skin tone and needs. The inclusive shade range is exactly what the industry needed.",
      author: "Priya Sharma", 
      role: "Beauty Blogger"
    },
    {
      quote: "The quality speaks for itself. These products rival luxury brands at a fraction of the environmental impact.",
      author: "David Kim",
      role: "Sustainability Advocate"
    }
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="font-playfair text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Our Story of
              <span className="block text-transparent bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text">
                Natural Beauty
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Founded on the belief that beauty should be inclusive, sustainable, and transformative. 
              We create premium products that celebrate your unique radiance while caring for our planet.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-6">
                Shop Our Story
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-6">
                Meet Our Team
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-playfair text-4xl font-bold text-gray-900 mb-8">
              Our Mission
            </h2>
            <p className="text-2xl text-gray-700 leading-relaxed mb-8 italic">
              "To create exceptional beauty products that enhance your natural radiance 
              while protecting the planet for future generations."
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-rose-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Premium Quality</h3>
                <p className="text-gray-600">Luxury formulations with clinically-proven results</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Leaf className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Sustainability</h3>
                <p className="text-gray-600">Eco-friendly practices from source to shelf</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Inclusivity</h3>
                <p className="text-gray-600">Beauty that celebrates every skin tone and type</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600">
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
                <CardContent className="p-6 text-center">
                  <div className={`w-20 h-20 bg-gradient-to-br ${value.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <div className="text-white">
                      {value.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl mb-3">{value.title}</CardTitle>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl font-bold text-gray-900 mb-4">
              Our Journey
            </h2>
            <p className="text-xl text-gray-600">
              Key milestones in our mission to revolutionize beauty
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-center gap-8 group">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">
                      {milestone.year}
                    </div>
                  </div>
                  <Card className="flex-1 group-hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <p className="text-lg text-gray-700">{milestone.event}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600">
              The passionate experts behind our innovative products
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {team.map((member, index) => (
              <Card key={index} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="p-0">
                  <div className="w-full h-64 bg-gradient-to-br from-rose-100 to-orange-100 rounded-t-lg flex items-center justify-center">
                    <Users className="h-16 w-16 text-rose-300" />
                  </div>
                </CardHeader>
                <CardContent className="p-6 text-center">
                  <CardTitle className="text-xl mb-2">{member.name}</CardTitle>
                  <Badge variant="secondary" className="mb-3">{member.role}</Badge>
                  <p className="text-gray-600">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl font-bold text-gray-900 mb-4">
              Our Commitments
            </h2>
            <p className="text-xl text-gray-600">
              Certified standards that reflect our dedication to quality and ethics
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {certifications.map((cert, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center gap-4">
                  <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg">{cert.name}</h3>
                    <p className="text-gray-600 text-sm">{cert.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gradient-to-r from-rose-600 to-orange-600 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl font-bold mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-white/90">
              Real stories from our community of beauty enthusiasts
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardContent className="p-6">
                  <Quote className="h-8 w-8 text-white/60 mb-4" />
                  <p className="text-lg mb-6 italic">"{testimonial.quote}"</p>
                  <div className="border-t border-white/20 pt-4">
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-white/80 text-sm">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-playfair text-4xl font-bold text-gray-900 mb-4">
            Join Our Beauty Revolution
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Be part of a community that believes beauty should be inclusive, 
            sustainable, and accessible to everyone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="px-8 py-6">
              Start Shopping
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-6">
              Join Our Newsletter
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;