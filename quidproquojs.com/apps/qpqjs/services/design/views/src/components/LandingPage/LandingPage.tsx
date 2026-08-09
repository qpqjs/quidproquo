// federated.export: This file will be exported using module federation

import { Features } from './components/Features';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { Packages } from './components/Packages';
import { Pipeline } from './components/Pipeline';
import { YieldLoop } from './components/YieldLoop';
import './landing.css';

export const LandingPage = () => (
  <main>
    <Hero />
    <YieldLoop />
    <Features />
    <Pipeline />
    <Packages />
    <Footer />
  </main>
);
