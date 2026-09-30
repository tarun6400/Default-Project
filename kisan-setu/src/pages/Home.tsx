import { Hero, HowItWorks, Features, LiveBand, Multilingual, Testimonials, PriceTicker, MSPCalculator } from "../components/home/Home";

export default function Home() {
  return (
    <>
      <Hero />
      <PriceTicker />
      <HowItWorks />
      <MSPCalculator />
      <Features />
      <LiveBand />
      <Multilingual />
      <Testimonials />
    </>
  );
}