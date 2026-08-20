
import Layout from "@/components/layout/Layout";
import Hero from "@/components/home/Hero";
import Categories from "@/components/home/Categories";
import FeaturedCourses from "@/components/home/FeaturedCourses";
import Features from "@/components/home/Features";
import Testimonials from "@/components/home/Testimonials";
import CallToAction from "@/components/home/CallToAction";

const Index = () => {
  return (
    <Layout>
      <Hero />
      <Categories />
      <FeaturedCourses />
      <Features />
      <Testimonials />
      <CallToAction />
      {/*
        [GỠ 20/08/2026] KHÔNG đặt ChatbotUI ở đây.
        Layout đã render sẵn một cái (components/layout/Layout.tsx), nên trang
        chủ đang có HAI khung chat nổi chồng lên nhau ở góc phải dưới: hai nút,
        hai phiên trò chuyện, bấm nút này thì khung kia vẫn còn nguyên.
      */}
    </Layout>
  );
};

export default Index;
