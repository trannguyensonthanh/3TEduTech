// src/components/home/HeroVeins.tsx
// Animated wire/vein background — inspired by bms.im but enhanced
const HeroVeins = () => {
  return (
    <>
      {/* Horizontal veins */}
      <div className="hero-vein" style={{ top: '12%', left: '0%', width: '45%', transform: 'rotate(-1.5deg)' }} />
      <div className="hero-vein" style={{ top: '30%', left: '5%', width: '55%', transform: 'rotate(1deg)', opacity: 0.6 }} />
      <div className="hero-vein" style={{ top: '52%', left: '0%', width: '40%', transform: 'rotate(-0.5deg)', opacity: 0.4 }} />
      <div className="hero-vein" style={{ bottom: '18%', left: '8%', width: '50%', transform: 'rotate(1.5deg)', opacity: 0.35 }} />
      <div className="hero-vein" style={{ top: '22%', right: '0%', width: '30%', transform: 'rotate(-3deg)', opacity: 0.3 }} />
      <div className="hero-vein" style={{ top: '68%', right: '0%', width: '38%', transform: 'rotate(2deg)', opacity: 0.25 }} />
      <div className="hero-vein" style={{ top: '42%', left: '15%', width: '28%', transform: 'rotate(-2deg)', opacity: 0.2 }} />

      {/* Vertical veins */}
      <div className="hero-vein-v" style={{ left: '8%', top: '5%', height: '50%', transform: 'rotate(0.5deg)', opacity: 0.2 }} />
      <div className="hero-vein-v" style={{ left: '48%', top: '12%', height: '65%', transform: 'rotate(-0.5deg)', opacity: 0.15 }} />
      <div className="hero-vein-v" style={{ right: '15%', top: '0%', height: '45%', transform: 'rotate(1.5deg)', opacity: 0.12 }} />
      <div className="hero-vein-v" style={{ right: '32%', top: '35%', height: '55%', transform: 'rotate(-1deg)', opacity: 0.1 }} />

      {/* Gradient blur orbs */}
      <div className="gradient-orb gradient-orb-1" style={{ top: '10%', left: '3%' }} />
      <div className="gradient-orb gradient-orb-2" style={{ bottom: '8%', left: '22%' }} />
      <div className="gradient-orb gradient-orb-3" style={{ top: '30%', right: '3%' }} />

      {/* Bottom fade-out */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white dark:from-[#080b14] to-transparent pointer-events-none z-10" />
    </>
  );
};

export default HeroVeins;
