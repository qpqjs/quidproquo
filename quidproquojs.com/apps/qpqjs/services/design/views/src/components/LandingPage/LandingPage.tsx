// federated.export: This file will be exported using module federation

import { Actions } from './components/Actions';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { Infrastructure } from './components/Infrastructure';
import { Replay } from './components/Replay';
import { Testing } from './components/Testing';
import { YieldLoop } from './components/YieldLoop';
import './landing.css';

export const LandingPage = () => (
  <main>
    <Hero />
    <YieldLoop />
    <Replay />
    <Testing />
    <Infrastructure />
    <Actions />
    <Footer />
  </main>
);
