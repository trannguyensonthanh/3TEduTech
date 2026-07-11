
import Layout from "@/components/layout/Layout";
import Hero from "@/components/home/Hero";
import Categories from "@/components/home/Categories";
import FeaturedCourses from "@/components/home/FeaturedCourses";
import Features from "@/components/home/Features";
import Testimonials from "@/components/home/Testimonials";
import CallToAction from "@/components/home/CallToAction";
import ChatbotUI from "@/components/chatbot/ChatbotUI";

const Index = () => {
  return (
    <Layout>
      <Hero />
      <Categories />
      <FeaturedCourses />
      <Features />
      <Testimonials />
      <CallToAction />
      <ChatbotUI />
    </Layout>
  );
};

export default Index;
